import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/request-origin";
import { relayWaitlistSignup } from "@/lib/waitlist";
import { parseWaitlistInput, visitorAddress } from "@/lib/waitlist-input";

const noStore = { "Cache-Control": "no-store" };

/**
 * Platform waitlist sign-up from the site's own form. The answer is the same
 * for a new or an already listed address. Nothing is logged.
 */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: { code: "invalid_origin" } },
      { status: 403, headers: noStore },
    );
  const input = parseWaitlistInput(await request.json().catch(() => null));
  if (!input)
    return NextResponse.json(
      { error: { code: "invalid_request" } },
      { status: 422, headers: noStore },
    );
  let status: number;
  try {
    status = await relayWaitlistSignup(
      input,
      visitorAddress(request.headers.get("x-forwarded-for")),
    );
  } catch {
    status = 503;
  }
  if (status === 202 || status === 200)
    return NextResponse.json(
      { status: "registered" },
      { status: 202, headers: noStore },
    );
  const code =
    status === 429
      ? "rate_limit_exceeded"
      : status === 422
        ? "invalid_request"
        : "waitlist_unavailable";
  return NextResponse.json(
    { error: { code } },
    { status: [422, 429].includes(status) ? status : 503, headers: noStore },
  );
}
