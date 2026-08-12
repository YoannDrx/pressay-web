import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { commercialCheckoutIsEnabled, pressayAPI } from "@/lib/pressay-api";
import { referralCookieName, verifyReferralCookie } from "@/lib/referral-cookie";

export async function POST(request: Request) {
  if (!commercialCheckoutIsEnabled()) return NextResponse.json({ error: "commercial_launch_not_enabled" }, { status: 503 });
  const input = await request.json() as { plan?: string; interval?: string; acceptedTerms?: boolean; immediatePerformanceConsent?: boolean; termsVersion?: string };
  const jar = await cookies();
  const referralCookie = jar.get(referralCookieName)?.value;
  let clearReferralCookie = Boolean(referralCookie);
  const referralCode = verifyReferralCookie(referralCookie, process.env.PRESSAY_REFERRAL_COOKIE_SECRET);
  if (referralCode) {
    const attribution = await pressayAPI("referrals/attribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: referralCode })
    }, { bootstrap: true });
    if (attribution.status === 401 || attribution.status >= 500) {
      clearReferralCookie = false;
      return new NextResponse(await attribution.text(), {
        status: attribution.status,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  const checkoutInput = { ...input, idempotencyKey: randomUUID() };
  const response = await pressayAPI("billing/checkout", {
    method: "POST",
    body: JSON.stringify(checkoutInput)
  }, { bootstrap: true });
  const result = new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
  if (clearReferralCookie) result.cookies.delete(referralCookieName);
  return result;
}
