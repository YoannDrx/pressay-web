import { NextRequest, NextResponse } from "next/server";
import {
  referralCookieName,
  signReferralCookie,
  verifyReferralCookie,
} from "@/lib/referral-cookie";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const code = (await params).code.toUpperCase();
  const secret = process.env.PRESSAY_REFERRAL_COOKIE_SECRET;
  if (!/^[A-Z0-9]{6,16}$/.test(code) || !secret)
    return NextResponse.redirect(new URL("/fr", request.url));
  const locale = request.headers
    .get("accept-language")
    ?.toLowerCase()
    .startsWith("fr")
    ? "fr"
    : "en";
  const response = NextResponse.redirect(
    new URL(`/${locale}?ref=${code}`, request.url),
  );
  response.headers.set("Cache-Control", "private, no-store");
  const previous = verifyReferralCookie(
    request.cookies.get(referralCookieName)?.value,
    secret,
  );
  const previousValid = previous ? await validReferral(previous.code) : false;
  if (previousValid === false && (await validReferral(code)) === true)
    response.cookies.set(referralCookieName, signReferralCookie(code, secret), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
  return response;
}

async function validReferral(code: string): Promise<boolean | null> {
  const configured = process.env.PRESSAY_API_URL?.replace(/\/+$/, "");
  // Identity-disabled local marketing previews have no Cloud service.
  if (!configured) return process.env.NODE_ENV !== "production";
  const base = configured.endsWith("/v1") ? configured : `${configured}/v1`;
  try {
    const response = await fetch(`${base}/referral-codes/${code}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.valid === true;
  } catch {
    return null;
  }
}
