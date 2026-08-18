import "server-only";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { auth } from "@/lib/auth";
import { identityProvider } from "@/lib/auth-env";
import { getWebIdentity, type WebIdentity } from "@/lib/server-identity";

export function commercialIsConfigured(): boolean {
  const provider = identityProvider();
  if (!process.env.PRESSAY_API_URL || provider === "disabled") return false;
  return provider === "clerk" || validInternalJWTSecret() !== null;
}

export function commercialCheckoutIsEnabled(): boolean {
  return commercialIsConfigured()
    && process.env.COMMERCIAL_CHECKOUT_ENABLED === "true";
}

export async function pressayAPI(
  path: string,
  init: RequestInit = {},
  options: { bootstrap?: boolean } = {}
): Promise<Response> {
  if (!commercialIsConfigured()) {
    return Response.json({ error: "commercial_beta_not_configured" }, { status: 503 });
  }
  const identity = await getWebIdentity();
  if (!identity) return Response.json({ error: "authentication_required" }, { status: 401 });
  const token = identity.clerkToken ?? await createInternalAPIToken(identity);
  if (!token) return Response.json({ error: "api_token_unavailable" }, { status: 401 });
  const base = normalizedAPIURL();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Request-ID", randomUUID());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.bootstrap) {
    const bootstrap = await fetch(`${base}/accounts/bootstrap`, {
      method: "POST", headers, cache: "no-store"
    });
    if (!bootstrap.ok && bootstrap.status !== 409) return bootstrap;
  }
  return fetch(`${base}/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}

async function createInternalAPIToken(identity: WebIdentity): Promise<string | null> {
  // Better Auth already owns the asymmetric signing keys advertised by the
  // public JWKS endpoint and trusted by the macOS/API OAuth path. Reuse that
  // trust chain for the server-side account proxy instead of depending on a
  // second shared secret that can drift between Vercel projects.
  if (identity.provider === "better-auth") {
    try {
      const signed = await auth.api.signJWT({
        body: {
          payload: {
            sub: identity.subject,
            email: identity.email,
            email_verified: identity.emailVerified,
            name: identity.name,
            sid: identity.sessionID,
            pressay_step_up_at: identity.stepUpAt,
            pressay_step_up_method: identity.stepUpMethod
          }
        }
      });
      return signed.token;
    } catch {
      return null;
    }
  }

  const secret = validInternalJWTSecret();
  if (!secret) return null;
  return new SignJWT({
    email: identity.email,
    email_verified: identity.emailVerified,
    name: identity.name,
    sid: identity.sessionID,
    pressay_step_up_at: identity.stepUpAt,
    pressay_step_up_method: identity.stepUpMethod,
    token_use: "pressay_web_proxy"
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(identity.subject)
    .setIssuer(process.env.PRESSAY_INTERNAL_JWT_ISSUER || "https://press-say.app/internal")
    .setAudience("pressay-api")
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(new TextEncoder().encode(secret));
}

function validInternalJWTSecret(): string | null {
  const secret = process.env.PRESSAY_INTERNAL_JWT_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export async function pressayJSON<T>(path: string): Promise<{ response: Response; data: T | null }> {
  const response = await pressayAPI(path);
  const parsed = await response.json().catch(() => null) as T | null;
  return { response, data: response.ok ? parsed : null };
}

function normalizedAPIURL(): string {
  const configured = process.env.PRESSAY_API_URL!.replace(/\/+$/, "");
  return configured.endsWith("/v1") ? configured : `${configured}/v1`;
}
