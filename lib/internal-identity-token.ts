import { errors, jwtVerify } from "jose";

/** Cloud -> web identity deletion contract (cross-repo contract §2). */
export const IDENTITY_DELETION_AUDIENCE = "pressay-web-internal";
export const DEFAULT_CLOUD_INTERNAL_ISSUER = "https://api.press-say.app/internal";
const MAX_TOKEN_AGE_SECONDS = 300;

export type IdentityDeletionRequest = { userId: string; reason: "account_deleted" };

export type IdentityDeletionVerification =
  | { ok: true; request: IdentityDeletionRequest; jti: string }
  | { ok: false; status: 400 | 401 | 503; error: string };

export function cloudInternalIssuer(env: Record<string, string | undefined> = process.env): string {
  return env.PRESSAY_CLOUD_INTERNAL_JWT_ISSUER || DEFAULT_CLOUD_INTERNAL_ISSUER;
}

export function internalJWTSecret(env: Record<string, string | undefined> = process.env): string | null {
  const secret = env.PRESSAY_INTERNAL_JWT_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function bearer(authorization: string | null): string | null {
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}

function parseBody(body: unknown): IdentityDeletionRequest | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { userId, reason } = body as Record<string, unknown>;
  if (typeof userId !== "string" || !userId.trim() || userId.length > 255) return null;
  if (reason !== "account_deleted") return null;
  return { userId, reason };
}

/**
 * Verify `Authorization: Bearer <HS256 JWT>` and the JSON body exactly as the
 * contract specifies: issuer, audience, at most 5 minutes old, `jti`, and
 * `sub` equal to `body.userId`.
 */
export async function verifyIdentityDeletionRequest(
  authorization: string | null,
  body: unknown,
  options: {
    secret: string | null;
    issuer: string;
    currentDate?: Date;
  },
): Promise<IdentityDeletionVerification> {
  if (!options.secret) return { ok: false, status: 503, error: "internal_auth_not_configured" };
  const token = bearer(authorization);
  if (!token) return { ok: false, status: 401, error: "invalid_token" };
  let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
  try {
    ({ payload } = await jwtVerify(token, new TextEncoder().encode(options.secret), {
      algorithms: ["HS256"],
      issuer: options.issuer,
      audience: IDENTITY_DELETION_AUDIENCE,
      maxTokenAge: MAX_TOKEN_AGE_SECONDS,
      requiredClaims: ["sub", "jti", "iat", "exp"],
      clockTolerance: 5,
      currentDate: options.currentDate,
    }));
  } catch (error) {
    return {
      ok: false,
      status: 401,
      error: error instanceof errors.JWTExpired ? "token_expired" : "invalid_token",
    };
  }
  if (
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number" ||
    payload.exp - payload.iat > MAX_TOKEN_AGE_SECONDS
  )
    return { ok: false, status: 401, error: "invalid_token" };
  const request = parseBody(body);
  if (!request) return { ok: false, status: 400, error: "invalid_request" };
  if (payload.sub !== request.userId)
    return { ok: false, status: 401, error: "subject_mismatch" };
  return { ok: true, request, jti: String(payload.jti) };
}
