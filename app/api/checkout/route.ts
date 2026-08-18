import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { commercialCheckoutIsEnabled, pressayAPI } from "@/lib/pressay-api";
import { referralCookieName, verifyReferralCookie } from "@/lib/referral-cookie";

const CURRENT_TERMS_VERSION = "2026-08-10";

export async function POST(request: Request) {
  if (!commercialCheckoutIsEnabled()) return NextResponse.json({ error: "commercial_launch_not_enabled" }, { status: 503 });
  const input = await request.json().catch(() => null) as {
    plan?: unknown;
    interval?: unknown;
    acceptedTerms?: unknown;
    immediatePerformanceConsent?: unknown;
    termsVersion?: unknown;
  } | null;
  if (
    input?.plan !== "pro_byok"
    || !["monthly", "annual"].includes(String(input.interval))
    || input.acceptedTerms !== true
    || input.immediatePerformanceConsent !== true
    || input.termsVersion !== CURRENT_TERMS_VERSION
  ) {
    return NextResponse.json({ error: "invalid_checkout_request" }, { status: 422 });
  }
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
  const idempotencyKey = randomUUID();
  const checkoutInput = {
    interval: input.interval === "annual" ? "year" : "month",
    acceptedTerms: true,
    immediatePerformanceConsent: true,
    termsVersion: CURRENT_TERMS_VERSION
  };
  const response = await pressayAPI("billing/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "idempotency-key": idempotencyKey
    },
    body: JSON.stringify(checkoutInput)
  }, { bootstrap: true });
  const result = new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
  if (clearReferralCookie) result.cookies.delete(referralCookieName);
  return result;
}
