import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pressayAPI } from "@/lib/pressay-api";
import { referralCookieName, verifyReferralCookie } from "@/lib/referral-cookie";
export async function POST() {
  const jar = await cookies();
  const value = jar.get(referralCookieName)?.value;
  if (!value) return NextResponse.json({ attributed: false });
  const code = verifyReferralCookie(value, process.env.PRESSAY_REFERRAL_COOKIE_SECRET);
  if (!code) return clear({ error: "invalid_referral_cookie" }, 400);
  const response = await pressayAPI("referrals/attribute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }, { bootstrap: true });
  const body = await response.json().catch(() => ({ attributed: response.ok }));
  if (response.status >= 500 || response.status === 401) return NextResponse.json(body, { status: response.status });
  return clear(body, response.status);
}
function clear(body: unknown, status: number) { const response = NextResponse.json(body, { status }); response.cookies.delete(referralCookieName); return response; }
