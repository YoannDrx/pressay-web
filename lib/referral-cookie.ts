import { createHmac, timingSafeEqual } from "node:crypto";
export const referralCookieName = "pressay_referral";
export function signReferralCookie(
  code: string,
  secret: string,
  issuedAt = Math.floor(Date.now() / 1000),
) {
  const payload = `${code}.${issuedAt}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifyReferralCookie(
  value: string | undefined,
  secret: string | undefined,
  now = Math.floor(Date.now() / 1000),
): { code: string; issuedAt: number } | null {
  if (!value || !secret || value.length > 160) return null;
  const [code, time, signature, ...extra] = value.split(".");
  const issuedAt = Number(time);
  if (
    extra.length ||
    !code ||
    !time ||
    !signature ||
    !/^[A-Z0-9]{6,16}$/.test(code) ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > now + 60 ||
    issuedAt < now - 30 * 86400
  )
    return null;
  const received = Buffer.from(signature);
  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${code}.${time}`).digest("base64url"),
  );
  return received.length === expected.length &&
    timingSafeEqual(received, expected)
    ? { code, issuedAt }
    : null;
}
