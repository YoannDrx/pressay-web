import { NextResponse } from "next/server";
import { pressayAPI } from "@/lib/pressay-api";
import { referralCookieName, verifyReferralCookie } from "@/lib/referral-cookie";
export async function POST(request: Request) {
  const value = cookieValue(request.headers.get("cookie"), referralCookieName);
  if (!value) return NextResponse.json({ attributed: false });
  const code = verifyReferralCookie(value, process.env.PRESSAY_REFERRAL_COOKIE_SECRET);
  if (!code) return clear({ error: "invalid_referral_cookie" }, 400);
  const response = await pressayAPI("referrals/attribute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }, { bootstrap: true });
  const body = await response.json().catch(() => ({ attributed: response.ok }));
  if (response.status >= 500 || response.status === 401) return NextResponse.json(body, { status: response.status });
  return clear(body, response.status);
}
function clear(body: unknown, status: number) { const response = NextResponse.json(body, { status }); response.cookies.delete(referralCookieName); return response; }

function cookieValue(header: string | null, name: string): string | undefined {
  const prefix = `${name}=`;
  const value = header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}
