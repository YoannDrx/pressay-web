import http from "node:http";
let billingError = false;
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
    const path = new URL(req.url, "http://localhost").pathname.replace(
      /^\/v1\//,
      "",
    );
    if (path === "/fixture/billing-error") {
      billingError = req.method === "POST";
      res.end("ok");
      return;
    }
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
    const value = bodies[path];
    res.statusCode = value ? 200 : 404;
    res.end(JSON.stringify(value ?? { error: { code: "not_found" } }));
  })
  .listen(31973, "127.0.0.1");
