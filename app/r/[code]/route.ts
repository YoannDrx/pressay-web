import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  if (!/^[A-Z0-9]{6,16}$/.test(code) || !process.env.PRESSAY_REFERRAL_COOKIE_SECRET) {
    return NextResponse.redirect(new URL("/fr", request.url));
  }
  const locale = request.headers.get("accept-language")?.toLowerCase().startsWith("fr") ? "fr" : "en";
  const signature = createHmac("sha256", process.env.PRESSAY_REFERRAL_COOKIE_SECRET).update(code).digest("base64url");
  const response = NextResponse.redirect(new URL(`/${locale}?ref=${encodeURIComponent(code)}`, request.url));
  response.cookies.set("pressay_referral", `${code}.${signature}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 86_400 });
  return response;
}
