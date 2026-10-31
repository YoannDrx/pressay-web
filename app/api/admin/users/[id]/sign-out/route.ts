import { NextResponse } from "next/server";
import {
  isAccountId,
  parseSignOutRequest,
  signOutEverywhere,
} from "@/lib/admin-sign-out";
import { identityProvider } from "@/lib/auth-env";
import { sameOrigin } from "@/lib/request-origin";
import { commercialIsConfigured } from "@/lib/pressay-api";
import { getWebIdentity } from "@/lib/server-identity";

const STEP_UP_SECONDS = 10 * 60;
const noStore = { "Cache-Control": "private, no-store" };

function refuse(status: number, code: string, message?: string) {
  return NextResponse.json(
    { error: { code, ...(message ? { message } : {}) } },
    { status, headers: noStore },
  );
}

/**
 * Support action: end every web session and desktop authorization of a
 * customer. Requires this site's step-up as well as the Cloud's owner and
 * step-up checks, and is recorded in the Cloud audit ledger.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!sameOrigin(request)) return refuse(403, "invalid_origin");
  if (!commercialIsConfigured() || identityProvider() !== "better-auth")
    return refuse(503, "not_configured");
  const viewer = await getWebIdentity();
  if (!viewer) return refuse(401, "authentication_required");
  const now = Math.floor(Date.now() / 1000);
  if (
    !viewer.stepUpAt ||
    viewer.stepUpAt > now + 60 ||
    now - viewer.stepUpAt > STEP_UP_SECONDS
  )
    return refuse(
      403,
      "step_up_required",
      "Verify your second factor within ten minutes",
    );
  const { id } = await context.params;
  if (!isAccountId(id)) return refuse(422, "invalid_id");
  const input = parseSignOutRequest(await request.json().catch(() => null));
  if (!input)
    return refuse(422, "invalid_request", "Indique un motif (3 caractères minimum).");
  const outcome = await signOutEverywhere(id.toLowerCase(), input);
  if (!outcome.ok)
    return NextResponse.json(outcome.body, {
      status: outcome.status,
      headers: noStore,
    });
  return NextResponse.json(
    {
      signedOut: true,
      webSessions: outcome.webSessions,
      oauthRefreshTokens: outcome.oauthRefreshTokens,
      oauthAccessTokens: outcome.oauthAccessTokens,
    },
    { headers: noStore },
  );
}
