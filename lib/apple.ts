import { importPKCS8, SignJWT } from "jose";

const APPLE_AUDIENCE = "https://appleid.apple.com";
const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";

/**
 * Sign in with Apple client secret: an ES256 JWT signed with the Apple key
 * provisioned for the web Services ID (APPLE_CLIENT_ID).
 */
export async function generateAppleClientSecret(
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const clientID = env.APPLE_CLIENT_ID;
  const teamID = env.APPLE_TEAM_ID;
  const keyID = env.APPLE_KEY_ID;
  const privateKey = env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientID || !teamID || !keyID || !privateKey) {
    throw new Error("Sign in with Apple is not configured");
  }
  const signingKey = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1_000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyID })
    .setIssuer(teamID)
    .setSubject(clientID)
    .setAudience(APPLE_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(signingKey);
}

export type AppleToken = {
  token: string;
  hint: "refresh_token" | "access_token";
};

export type AppleRevocationResult = {
  attempted: number;
  revoked: number;
  /** Status codes or error classes only; never token material. */
  failures: string[];
};

/**
 * Best-effort revocation of Sign in with Apple tokens, required by App Store
 * Review Guideline 5.1.1(v) when an account is deleted. A refresh token is
 * preferred: revoking it also invalidates the user's authorization.
 * Failures are returned as codes and never block account deletion.
 */
export async function revokeAppleTokens(
  tokens: AppleToken[],
  options: {
    clientID?: string;
    clientSecret?: () => Promise<string>;
    fetcher?: typeof fetch;
  } = {},
): Promise<AppleRevocationResult> {
  const result: AppleRevocationResult = {
    attempted: 0,
    revoked: 0,
    failures: [],
  };
  const usable = tokens.filter((candidate) => candidate.token);
  if (!usable.length) return result;
  const clientID = options.clientID ?? process.env.APPLE_CLIENT_ID;
  if (!clientID) {
    result.failures.push("apple_not_configured");
    return result;
  }
  let secret: string;
  try {
    secret = await (options.clientSecret ?? generateAppleClientSecret)();
  } catch {
    result.failures.push("apple_client_secret_unavailable");
    return result;
  }
  const fetcher = options.fetcher ?? fetch;
  for (const candidate of usable) {
    result.attempted += 1;
    try {
      const response = await fetcher(APPLE_REVOKE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientID,
          client_secret: secret,
          token: candidate.token,
          token_type_hint: candidate.hint,
        }),
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) result.revoked += 1;
      else result.failures.push(`apple_revoke_http_${response.status}`);
    } catch (error) {
      result.failures.push(
        error instanceof Error && error.name === "TimeoutError"
          ? "apple_revoke_timeout"
          : "apple_revoke_network",
      );
    }
  }
  return result;
}
