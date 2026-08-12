import { createHmac, timingSafeEqual } from "node:crypto";

export const referralCookieName = "pressay_referral";

export function verifyReferralCookie(value: string | undefined, secret: string | undefined): string | null {
  if (!value || !secret) return null;
  const split = value.lastIndexOf(".");
  if (split < 0) return null;
  const code = value.slice(0, split);
  if (!/^[A-Z0-9]{6,16}$/.test(code)) return null;
  const received = Buffer.from(value.slice(split + 1));
  const expected = Buffer.from(createHmac("sha256", secret).update(code).digest("base64url"));
  return received.length === expected.length && timingSafeEqual(received, expected) ? code : null;
}
