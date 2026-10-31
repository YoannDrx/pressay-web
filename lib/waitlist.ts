import "server-only";
import { auth } from "@/lib/auth";
import { identityProvider } from "@/lib/auth-env";
import type { WaitlistInput } from "@/lib/waitlist-input";

/**
 * Relay a sign-up to the Cloud. The site vouches for the visitor's address
 * with a five-minute token signed by its Better Auth keys, for the waitlist
 * audience only, so the Cloud limits sign-ups per visitor rather than for the
 * whole site. The address is not stored by either side.
 */
export async function relayWaitlistSignup(
  input: WaitlistInput,
  visitorAddress: string | null,
): Promise<number> {
  const apiURL = process.env.PRESSAY_API_URL?.replace(/\/+$/, "");
  if (!apiURL) return 503;
  const base = apiURL.endsWith("/v1") ? apiURL : `${apiURL}/v1`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (identityProvider() === "better-auth" && visitorAddress) {
    const now = Math.floor(Date.now() / 1000);
    const { token } = await auth.api.signJWT({
      body: {
        payload: {
          iat: now,
          exp: now + 300,
          sub: "press-say.app",
          token_use: "pressay_waitlist",
          aud: "pressay-waitlist",
          client_address: visitorAddress,
        },
      },
    });
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${base}/waitlist`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  return response.status;
}
