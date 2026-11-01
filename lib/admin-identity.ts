import "server-only";
import { auth } from "@/lib/auth";
import { identityProvider } from "@/lib/auth-env";
import { getWebIdentity } from "@/lib/server-identity";
import type { AdminUserDetail } from "@/lib/operations-contract";

const STEP_UP_SECONDS = 10 * 60;

export type AdminIdentity =
  | {
      status: "ok";
      exists: true;
      createdAt: string;
      emailVerified: boolean;
      twoFactorEnabled: boolean;
      providers: { providerId: string; linkedAt: string }[];
      passkeys: {
        name: string | null;
        deviceType: string | null;
        backedUp: boolean;
        createdAt: string | null;
      }[];
      sessions: {
        createdAt: string;
        updatedAt: string;
        expiresAt: string;
        userAgent: string | null;
      }[];
      lastSignInAt: string | null;
      desktopAuthorizations: number;
    }
  | { status: "ok"; exists: false }
  | { status: "step_up_required" | "not_configured" | "unavailable" };

type Row = Record<string, unknown>;
const iso = (value: unknown) =>
  value instanceof Date || typeof value === "string"
    ? new Date(value).toISOString()
    : null;

/**
 * Sign-in methods, passkeys and sessions of the Better Auth user behind a
 * Cloud account. These live only in the web database.
 *
 * Call it only with a record the Cloud has just returned for
 * `admin/users/:id?include=identity` or `admin/users/:id/export?include=identity`:
 * that response proves the administrator role and a step-up less than ten
 * minutes old, and the Cloud has audited the read (`admin.user.identity.read`,
 * or `admin.user.export` with `siteIdentity`). The step-up is checked here again so a
 * misuse of this module cannot read identities without it. Never reads
 * secrets (tokens, credentials, TOTP seeds, passkey keys) or IP addresses.
 */
export async function readAdminIdentity(cloudRecord: {
  account: Pick<AdminUserDetail["account"], "authUserId">;
}): Promise<AdminIdentity> {
  const userId = cloudRecord.account.authUserId;
  if (identityProvider() !== "better-auth" || !userId)
    return { status: "not_configured" };
  const viewer = await getWebIdentity();
  const now = Math.floor(Date.now() / 1000);
  if (
    !viewer?.stepUpAt ||
    viewer.stepUpAt > now + 60 ||
    now - viewer.stepUpAt > STEP_UP_SECONDS
  )
    return { status: "step_up_required" };
  try {
    const context = await auth.$context;
    const user = (await context.internalAdapter.findUserById(userId)) as
      | (Row & { createdAt: Date; emailVerified: boolean })
      | null;
    if (!user) return { status: "ok", exists: false };
    const byUser = [{ field: "userId", value: userId }];
    const [accounts, sessions, passkeys, refreshTokens] = await Promise.all([
      context.internalAdapter.findAccounts(userId),
      context.internalAdapter.listSessions(userId),
      context.adapter.findMany<Row>({ model: "passkey", where: byUser }),
      context.adapter.findMany<Row>({
        model: "oauthRefreshToken",
        where: byUser,
      }),
    ]);
    const nowDate = new Date();
    const active = sessions.filter(
      (session) => new Date(session.expiresAt) > nowDate,
    );
    const lastSignIn = sessions
      .map((session) => new Date(session.createdAt).getTime())
      .sort((a, b) => b - a)[0];
    return {
      status: "ok",
      exists: true,
      createdAt: new Date(user.createdAt).toISOString(),
      emailVerified: user.emailVerified === true,
      twoFactorEnabled: user.twoFactorEnabled === true,
      providers: accounts.map((account) => ({
        providerId: account.providerId,
        linkedAt: new Date(account.createdAt).toISOString(),
      })),
      passkeys: passkeys.map((passkey) => ({
        name: typeof passkey.name === "string" ? passkey.name : null,
        deviceType:
          typeof passkey.deviceType === "string" ? passkey.deviceType : null,
        backedUp: passkey.backedUp === true,
        createdAt: iso(passkey.createdAt),
      })),
      sessions: active
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .map((session) => ({
          createdAt: new Date(session.createdAt).toISOString(),
          updatedAt: new Date(session.updatedAt).toISOString(),
          expiresAt: new Date(session.expiresAt).toISOString(),
          userAgent: session.userAgent ?? null,
        })),
      lastSignInAt: lastSignIn ? new Date(lastSignIn).toISOString() : null,
      // Mac, Windows and iPhone apps sign in through OAuth; each live refresh
      // token is one app authorization.
      desktopAuthorizations: refreshTokens.filter(
        (token) =>
          !token.revoked &&
          (!token.expiresAt || new Date(token.expiresAt as string) > nowDate),
      ).length,
    };
  } catch {
    // Code only: never the user identifier or a database message.
    console.error("[admin-identity] read_failed");
    return { status: "unavailable" };
  }
}
