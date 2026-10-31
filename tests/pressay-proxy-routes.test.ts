import assert from "node:assert/strict";
import test from "node:test";
import { proxyRoute } from "../lib/pressay-proxy-routes.ts";
import {
  cloudErrorCode,
  RECENT_AUTHENTICATION_REQUIRED,
  sessionSignedInAt,
} from "../lib/account-deletion.ts";

const methods = ["GET", "HEAD", "POST", "PATCH", "DELETE", "PUT"];

/** Catch-all segments as Next.js hands them to the route: decoded once. */
function segmentsOf(rawPath: string): string[] {
  const { pathname } = new URL(`https://press-say.app/api/pressay/${rawPath}`);
  return pathname
    .replace(/^\/api\/pressay\/?/, "")
    .split("/")
    .map((segment) => decodeURIComponent(segment));
}

test("the generic proxy never relays account routes, whatever the method or spelling", () => {
  const variants = [
    "me",
    "me/",
    "ME",
    "Me",
    "v1/me",
    "v1%2Fme",
    "me%2F",
    "me%2Fexport",
    "me/export",
    "./me",
    "devices/../me",
    "devices/%2e%2e/me",
    "%2e%2e/me",
    "me%00",
    "me.",
    "me?acknowledgeAppleSubscription=true",
    "me%3FacknowledgeAppleSubscription=true",
    "admin/../me",
  ];
  for (const variant of variants)
    for (const method of methods)
      assert.equal(
        proxyRoute(method, segmentsOf(variant)).allowed,
        false,
        `${method} ${variant}`,
      );
  for (const method of methods) {
    assert.deepEqual(proxyRoute(method, ["me"]), {
      allowed: false,
      status: 404,
      error: "route_not_allowed",
    });
    assert.equal(proxyRoute(method, ["v1", "me"]).allowed, false);
    assert.equal(proxyRoute(method, ["me", ""]).allowed, false);
    assert.equal(proxyRoute(method, ["v1/me"]).allowed, false);
  }
});

test("the generic proxy relays exactly the routes used by client components", () => {
  const id = "0b7c1d3e-1234-4abc-8def-0123456789ab";
  const relayed: Array<[string, string]> = [
    ["POST", "access/claim"],
    ["DELETE", `devices/${id}`],
    ["POST", "admin/campaigns"],
    ["GET", `admin/campaigns/${id}/usage`],
    ["HEAD", `admin/campaigns/${id}/usage`],
    ["POST", `admin/campaigns/${id}/revoke`],
    ["POST", `admin/grants/${id}/revoke`],
    ["POST", `admin/grants/${id}/extend`],
    ["POST", `admin/users/${id}/grants`],
    ["POST", `admin/users/${id}/deletion`],
    ["POST", `admin/devices/${id}/revoke`],
    ["POST", `admin/devices/${id}/restore`],
    ["POST", `devices/${id}/restore`],
    ["POST", "admin/billing/events/stripe/evt_1Abc23/replay"],
    ["PATCH", `admin/gates/direct/${id}`],
    ["POST", "admin/rewards/process"],
    ["POST", `admin/rewards/${id}/retry`],
  ];
  for (const [method, path] of relayed)
    assert.deepEqual(
      proxyRoute(method, path.split("/")),
      { allowed: true, target: path },
      `${method} ${path}`,
    );
});

test("the generic proxy refuses other methods, prefixes and unlisted routes", () => {
  const id = "0b7c1d3e-1234-4abc-8def-0123456789ab";
  const refused: Array<[string, string]> = [
    ["GET", "access/claim"],
    ["DELETE", "devices"],
    ["GET", `devices/${id}`],
    ["POST", `devices/${id}`],
    ["DELETE", `devices/${id}/extra`],
    ["DELETE", `admin/campaigns/${id}`],
    ["GET", "admin/campaigns"],
    ["POST", "admin/campaigns/extra"],
    ["DELETE", `admin/grants/${id}/revoke`],
    // Recorded server-side only, after the site's own sessions are revoked.
    ["POST", "admin/audit/external"],
    ["POST", "admin/billing/events/apple/evt_1/replay"],
    ["GET", "admin/billing/financial-events"],
    ["POST", `admin/devices/${id}/delete`],
    ["GET", `admin/users/${id}/grants`],
    ["DELETE", `devices/${id}/restore`],
    ["GET", "entitlements"],
    ["GET", "billing/status"],
    ["POST", "billing/portal"],
    ["POST", "billing/checkout"],
    ["GET", "messages"],
    ["POST", "accounts/web-bootstrap"],
    ["DELETE", "sync/recovery"],
    ["POST", "Access/claim"],
    ["delete", `devices/${id}`],
  ];
  for (const [method, path] of refused)
    assert.equal(
      proxyRoute(method, path.split("/")).allowed,
      false,
      `${method} ${path}`,
    );
  assert.equal(proxyRoute("GET", []).allowed, false);
});

test("referral attribution through the generic proxy stays forbidden", () => {
  for (const method of ["POST", "PATCH", "DELETE"])
    assert.deepEqual(proxyRoute(method, ["referrals", "attribute"]), {
      allowed: false,
      status: 403,
      error: "signed_referral_required",
    });
});

test("the session sign-in time is sent in seconds and ignores invalid values", () => {
  assert.equal(
    sessionSignedInAt(new Date("2026-10-31T09:00:00.500Z")),
    Date.UTC(2026, 9, 31, 9) / 1000,
  );
  assert.equal(
    sessionSignedInAt("2026-10-31T09:00:00.000Z"),
    Date.UTC(2026, 9, 31, 9) / 1000,
  );
  for (const value of [undefined, null, "", "not a date", 0, 1_700_000_000, {}])
    assert.equal(sessionSignedInAt(value), undefined, String(value));
});

test("Cloud deletion refusals are read from both error envelopes", () => {
  assert.equal(
    cloudErrorCode({ error: { code: RECENT_AUTHENTICATION_REQUIRED } }),
    "recent_authentication_required",
  );
  assert.equal(
    cloudErrorCode({ error: "apple_subscription_active" }),
    "apple_subscription_active",
  );
  for (const payload of [null, "x", {}, { error: {} }, { error: { code: 1 } }])
    assert.equal(cloudErrorCode(payload), undefined);
});
