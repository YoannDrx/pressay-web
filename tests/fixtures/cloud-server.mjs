import http from "node:http";
let billingError = false;
let appleSubscription = false;
let lastToken = null;
// Same window as the Cloud's DELETE /v1/me freshness check.
let deletionMaxAgeSeconds = 600;
let deletionRequests = 0;
function decodedClaims(header) {
  const payload = /^Bearer [^.]+\.([^.]+)\./.exec(header ?? "")?.[1];
  if (!payload) return null;
  return JSON.parse(Buffer.from(payload, "base64url").toString());
}
function tokenClaims(header) {
  const claims = decodedClaims(header);
  return claims && { aud: claims.aud, token_use: claims.token_use };
}
/** Contract: a web session deletes only after a sign-in within the window. */
function recentlySignedIn(header) {
  const signedInAt = decodedClaims(header)?.pressay_auth_at;
  const now = Math.floor(Date.now() / 1000);
  return (
    typeof signedInAt === "number" &&
    signedInAt > now - deletionMaxAgeSeconds &&
    signedInAt <= now + 30
  );
}
const me = {
  accountId: "00000000-0000-4000-8000-000000000001",
  email: "owner@example.test",
  status: "active",
  entitlement: {
    tier: "pro",
    source: "support",
    validUntil: "2026-12-01T00:00:00Z",
    offlineGraceUntil: "2026-12-04T00:00:00Z",
  },
};
const bodies = {
  "accounts/web-bootstrap": {
    accountId: me.accountId,
    created: false,
    entitlement: me.entitlement,
  },
  "admin/session": { role: "owner" },
  me,
  usage: {
    transcription: { usedSeconds: 120, limitSeconds: 3600 },
    transformations: { used: 2, limit: 100 },
  },
  "billing/status": { provider: null, status: null, currentPeriodEndsAt: null },
  devices: { devices: [], limit: 3 },
  "referrals/me": {
    link: "https://press-say.app/r/ABCDEF123456",
    signups: 2,
    conversions: 1,
    rewards: [],
  },
  "admin/overview": {
    users: 4,
    new_30d: 2,
    active_grants: 1,
    referrals: 2,
    conversions: 1,
    credits_minor: 567,
    failed_webhooks: 0,
    cloud_seconds: 120,
    cloud_transformations: 2,
    subscriptions: [],
    catalogueMRRMinor: 0,
  },
  "admin/users": { users: [], nextCursor: null },
  "admin/campaigns": { campaigns: [] },
  "admin/referrals": { referrals: [] },
  "admin/billing/events": { events: [] },
  "admin/audit-log": { entries: [] },
  "admin/health": {
    gates: [],
    jobs: [],
    flags: {},
    checkedAt: "2026-09-16T12:00:00Z",
  },
};
http
  .createServer((req, res) => {
    const requestURL = new URL(req.url, "http://localhost");
    const path = requestURL.pathname.replace(
      /^\/v1\//,
      "",
    );
    if (path === "/fixture/billing-error") {
      billingError = req.method === "POST";
      res.end("ok");
      return;
    }
    if (path === "/fixture/apple-subscription") {
      appleSubscription = req.method === "POST";
      res.end("ok");
      return;
    }
    if (path === "/fixture/deletion-max-age") {
      deletionMaxAgeSeconds = req.method === "POST" ? 0 : 600;
      res.end("ok");
      return;
    }
    if (path === "/fixture/deletions") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ count: deletionRequests }));
      return;
    }
    if (path === "/fixture/last-token") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(lastToken));
      return;
    }
    if (req.headers.authorization) lastToken = tokenClaims(req.headers.authorization);
    if (path === "/health") {
      res.end("ok");
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    if (path === "billing/status" && billingError) {
      res.statusCode = 503;
      res.end(
        JSON.stringify({
          error: { code: "billing_unavailable" },
          requestId: "fixture-diagnostic",
        }),
      );
      return;
    }
    if (path === "me" && req.method === "DELETE") deletionRequests += 1;
    if (
      path === "me" &&
      req.method === "DELETE" &&
      !recentlySignedIn(req.headers.authorization)
    ) {
      res.statusCode = 403;
      res.end(
        JSON.stringify({
          error: {
            code: "recent_authentication_required",
            message: "Sign in again to delete this account",
            maxAgeSeconds: String(deletionMaxAgeSeconds),
          },
          requestId: "fixture-recent-authentication",
        }),
      );
      return;
    }
    if (
      path === "me" &&
      req.method === "DELETE" &&
      appleSubscription &&
      requestURL.searchParams.get("acknowledgeAppleSubscription") !== "true"
    ) {
      // Contract §3: an active Apple subscription blocks deletion until acknowledged.
      res.statusCode = 409;
      res.end(
        JSON.stringify({
          error: {
            code: "apple_subscription_active",
            message: "An Apple subscription is still active",
            manageSubscriptionsUrl: "https://apps.apple.com/account/subscriptions",
            acknowledgeParameter: "acknowledgeAppleSubscription",
          },
          requestId: "fixture-apple-subscription",
        }),
      );
      return;
    }
    const value = bodies[path];
    res.statusCode = value ? 200 : 404;
    res.end(JSON.stringify(value ?? { error: { code: "not_found" } }));
  })
  .listen(31973, "127.0.0.1");
