import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pressayAPI } from "@/lib/pressay-api";
export async function POST() {
  const jar = await cookies(); const value = jar.get("pressay_referral")?.value; const secret = process.env.PRESSAY_REFERRAL_COOKIE_SECRET;
  if (!value || !secret) return NextResponse.json({ attributed: false });
  const split = value.lastIndexOf("."); if (split < 0) return clear({ error: "invalid_referral_cookie" }, 400);
  const code = value.slice(0, split); const received = Buffer.from(value.slice(split + 1)); const expected = Buffer.from(createHmac("sha256", secret).update(code).digest("base64url"));
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return clear({ error: "invalid_referral_cookie" }, 400);
  const response = await pressayAPI("referrals/attribute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }, { bootstrap: true });
  return clear(await response.json().catch(() => ({ attributed: response.ok })), response.status);
}
function clear(body: unknown, status: number) { const response = NextResponse.json(body, { status }); response.cookies.delete("pressay_referral"); return response; }
