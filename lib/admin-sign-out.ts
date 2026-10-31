import "server-only";
import { auth } from "@/lib/auth";
import { pressayAPI } from "@/lib/pressay-api";
import type {
  ExternalAuditInput,
  ExternalAuditRecorded,
} from "@/lib/operations-contract";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SignOutRequest = { idempotencyKey: string; reason: string };

/** Body of the admin form: the form's idempotency key and a reason. */
export function parseSignOutRequest(value: unknown): SignOutRequest | null {
  if (!value || typeof value !== "object") return null;
  const { idempotencyKey, reason } = value as Record<string, unknown>;
  if (typeof idempotencyKey !== "string" || !UUID.test(idempotencyKey))
    return null;
  if (typeof reason !== "string") return null;
  const trimmed = reason.trim();
  if (trimmed.length < 3 || trimmed.length > 500) return null;
  return { idempotencyKey, reason: trimmed };
}

export function isAccountId(value: string): boolean {
  return UUID.test(value);
}

export type SignOutOutcome =
  | {
      ok: true;
      webSessions: number;
      oauthRefreshTokens: number;
      oauthAccessTokens: number;
    }
  | { ok: false; status: number; body: unknown };

async function record(
  input: Omit<ExternalAuditInput, "result" | "details">,
  result: ExternalAuditInput["result"],
  details?: ExternalAuditInput["details"],
): Promise<Response> {
  return pressayAPI("admin/audit/external", {
    method: "POST",
    body: JSON.stringify({ ...input, result, details }),
  });
}

/**
 * Sign a customer out everywhere: web sessions and desktop OAuth tokens live
 * only in this site's database. The Cloud first checks the owner role and the
 * step-up, records the request and returns the identity subject to act on (so
 * the browser never chooses it); the outcome is then recorded with counts.
 */
export async function signOutEverywhere(
  targetAccountId: string,
  request: SignOutRequest,
): Promise<SignOutOutcome> {
  const base = {
    idempotencyKey: request.idempotencyKey,
    reason: request.reason,
    action: "user.sessions.revoke" as const,
    targetAccountId,
  };
  const requested = await record(base, "requested");
  const payload = (await requested.json().catch(() => null)) as
    | (ExternalAuditRecorded & Record<string, unknown>)
    | null;
  if (!requested.ok || typeof payload?.authUserId !== "string")
    return {
      ok: false,
      status: requested.ok ? 502 : requested.status,
      body: payload ?? { error: { code: "audit_unavailable" } },
    };
  try {
    const context = await auth.$context;
    const where = [{ field: "userId", value: payload.authUserId }];
    // Access tokens first: removing a refresh token cascades to the access
    // tokens it issued, which would then be missing from the counts.
    const oauthAccessTokens = await context.adapter.deleteMany({
      model: "oauthAccessToken",
      where,
    });
    const oauthRefreshTokens = await context.adapter.deleteMany({
      model: "oauthRefreshToken",
      where,
    });
    const webSessions = await context.adapter.deleteMany({
      model: "session",
      where,
    });
    const counts = { webSessions, oauthRefreshTokens, oauthAccessTokens };
    await record(base, "succeeded", counts);
    return { ok: true, ...counts };
  } catch {
    // Code only: never the user identifier or a database message.
    console.error("[admin-sign-out] identity_store_failed");
    await record(base, "failed", { errorCode: "identity_store_failed" }).catch(
      () => null,
    );
    return {
      ok: false,
      status: 503,
      body: {
        error: {
          code: "identity_store_failed",
          message: "Déconnexion impossible pour le moment. Réessaie.",
        },
      },
    };
  }
}
