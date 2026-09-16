import assert from "node:assert/strict";
import test from "node:test";
import { safeLocalRedirect } from "../lib/safe-redirect.ts";
import {
  signReferralCookie,
  verifyReferralCookie,
} from "../lib/referral-cookie.ts";
import { sameOrigin } from "../lib/request-origin.ts";

test("only allows internal destinations and preserves OAuth query parameters", () => {
  for (const input of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/sign-in",
    "/sign-up?redirect_url=/account",
    "/a\r\nLocation: https://evil.test",
  ])
    assert.equal(safeLocalRedirect(input), "/account");
  assert.equal(
    safeLocalRedirect("/api/auth/oauth2/authorize?client_id=desktop&state=abc"),
    "/api/auth/oauth2/authorize?client_id=desktop&state=abc",
  );
  assert.equal(
    safeLocalRedirect("/en/pricing?plan=pro"),
    "/en/pricing?plan=pro",
  );
});
test("referral attribution is signed, expires after thirty days and cannot move into the future", () => {
  const issued = 1_800_000_000;
  const cookie = signReferralCookie("ABCDEF123456", "secret", issued);
  assert.deepEqual(verifyReferralCookie(cookie, "secret", issued + 60), {
    code: "ABCDEF123456",
    issuedAt: issued,
  });
  assert.equal(verifyReferralCookie(cookie, "wrong", issued), null);
  assert.equal(
    verifyReferralCookie(cookie, "secret", issued + 30 * 86400 + 1),
    null,
  );
  assert.equal(verifyReferralCookie(cookie, "secret", issued - 61), null);
  assert.equal(
    verifyReferralCookie(cookie.replace("ABCDEF", "AAAAAA"), "secret", issued),
    null,
  );
});
test("sensitive mutations reject missing and cross-site origins", () => {
  const req = (origin?: string, site = "same-origin") =>
    new Request("https://press-say.app/api/pressay/admin/campaigns", {
      method: "POST",
      headers: {
        ...(origin ? { Origin: origin } : {}),
        "Sec-Fetch-Site": site,
      },
    });
  assert.equal(sameOrigin(req()), false);
  assert.equal(sameOrigin(req("https://evil.test")), false);
  assert.equal(sameOrigin(req("https://press-say.app", "cross-site")), false);
  assert.equal(sameOrigin(req("https://press-say.app")), true);
});
