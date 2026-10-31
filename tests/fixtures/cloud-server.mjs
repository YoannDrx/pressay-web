import http from "node:http";
let billingError = false;
let pastDue = false;
let identityReads = 0;
let appleSubscription = false;
let lastToken = null;
// Same window as the Cloud's DELETE /v1/me freshness check.
let deletionMaxAgeSeconds = 600;
let deletionRequests = 0;
// Support actions received by the fake Cloud, in order.
let supportCalls = [];
let signOutSubject = "unknown";
let auditQueries = [];
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
  devices: {
    devices: [
      {
        id: "00000000-0000-4000-8000-0000000000d1",
        displayName: "Studio Mac",
        platform: "macos",
        appVariant: "direct",
        appVersion: "1.4.0",
        lastSeenAt: "2026-10-30T09:00:00Z",
      },
      {
        id: "00000000-0000-4000-8000-0000000000d2",
        displayName: "Office PC",
        platform: "windows",
        appVariant: "direct",
        appVersion: "1.4.0",
        lastSeenAt: "2026-10-29T09:00:00Z",
      },
    ],
    limit: 3,
  },
  "me/export": {
    format: "pressay-cloud-export/1",
    account: { id: "00000000-0000-4000-8000-000000000001", status: "active" },
  },
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
  "admin/users": {
    users: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        email: "owner@example.test",
        display_name: "owner@example.test",
        status: "active",
        created_at: "2026-09-01T00:00:00Z",
        plan: "pro",
        entitlement_source: "stripe",
        sandbox: false,
        active_device_count: 2,
        macos_device_count: 1,
        windows_device_count: 1,
        last_device_seen_at: "2026-10-30T09:00:00Z",
      },
    ],
    nextCursor: null,
    searchKind: "stripe_customer",
  },
  "admin/campaigns": { campaigns: [] },
  "admin/referrals": { referrals: [] },
  "admin/billing/events": { events: [] },
  "admin/audit-log": {
    entries: [
      {
        id: "120",
        actor_id: me.accountId,
        actor_email: "owner@example.test",
        action: "grant.create",
        target_id: me.accountId,
        target_account_id: me.accountId,
        reason: "Beta tester",
        result: "succeeded",
        request_id: "req-audit-fixture",
        details: { grantId: "00000000-0000-4000-8000-0000000000a1", days: 30 },
        created_at: "2026-10-30T00:00:00Z",
      },
      {
        id: "119",
        actor_id: null,
        actor_email: null,
        action: "launch_gate.updated",
        target_id: "direct/tax",
        target_account_id: null,
        reason: "Checked",
        result: "failed",
        request_id: "req-audit-gate",
        details: { errorCode: "gate_not_found" },
        created_at: "2026-10-29T00:00:00Z",
      },
    ],
    nextCursor: "119",
  },
  "admin/health": {
    gates: [],
    jobs: [],
    flags: {},
    checkedAt: "2026-09-16T12:00:00Z",
  },
};
/** Contract fixture of GET /v1/admin/users/:id for the signed-in subject. */
function adminUserDetail(subject) {
  return {
    account: {
      accountId: me.accountId,
      authUserId: subject ?? "unknown",
      email: me.email,
      status: "active",
      createdAt: "2026-09-01T00:00:00Z",
      deletionRequestedAt: null,
      entitlement: {
        tier: "pro",
        source: "stripe",
        validFrom: "2026-10-01T00:00:00Z",
        validUntil: "2027-10-01T00:00:00Z",
        offlineGraceUntil: "2027-10-04T00:00:00Z",
        revision: 3,
        sandbox: false,
      },
    },
    billingCustomer: {
      stripeCustomerId: "cus_Fixture123",
      appStoreOriginalTransactionId: null,
      stripeMode: "test",
    },
    usage: { transcription: { usedSeconds: 120 }, transformations: { used: 2 } },
    usageHistory: [
      { period_start: "2026-10-01", transcription_seconds_used: 120, transformations_used: 2 },
    ],
    devices: [
      {
        id: "00000000-0000-4000-8000-0000000000d1",
        displayName: "Studio Mac",
        platform: "macos",
        appVariant: "direct",
        appVersion: "1.4.0",
        approved: false,
        lastSeenAt: "2026-10-30T09:00:00Z",
        createdAt: "2026-09-01T00:00:00Z",
        revokedAt: null,
      },
      {
        id: "00000000-0000-4000-8000-0000000000d3",
        displayName: "Old PC",
        platform: "windows",
        appVariant: "direct",
        appVersion: "1.3.0",
        approved: false,
        lastSeenAt: "2026-09-10T09:00:00Z",
        createdAt: "2026-09-02T00:00:00Z",
        revokedAt: "2026-09-11T00:00:00Z",
      },
    ],
    subscriptions: [
      {
        provider: "stripe",
        provider_subscription_id: "sub_Fixture123",
        provider_product_id: "prod_fixture",
        status: "past_due",
        billing_interval: "year",
        trial_ends_at: null,
        current_period_starts_at: "2026-10-01T00:00:00Z",
        current_period_ends_at: "2027-10-01T00:00:00Z",
        cancel_at_period_end: true,
        grace_ends_at: "2026-10-08T00:00:00Z",
        apple_environment: "Production",
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-02T00:00:00Z",
      },
    ],
    financialEvents: [
      {
        provider_event_id: "evt_fixture",
        provider_object_id: "in_Fixture123",
        provider_subscription_id: "sub_Fixture123",
        kind: "invoice_failed",
        status: "open",
        amount_minor: 6900,
        currency: "eur",
        full_reversal: false,
        provider_occurred_at: "2026-10-02T00:00:00Z",
      },
    ],
    legalAcceptances: [
      {
        terms_version: "2026-10-01",
        immediate_performance_consent: true,
        accepted_at: "2026-10-01T00:00:00Z",
      },
    ],
    deletion: null,
    grants: [
      {
        id: "00000000-0000-4000-8000-0000000000a1",
        source: "support",
        starts_at: "2026-10-01T00:00:00Z",
        ends_at: "2027-01-01T00:00:00Z",
        revoked_at: null,
        reason: "Beta tester",
        created_by: me.accountId,
      },
    ],
    referrals: [],
    audit: [
      {
        id: "1",
        actor_id: me.accountId,
        action: "grant.revoked",
        target_id: me.accountId,
        reason: "Fixture",
        result: "succeeded",
        request_id: "req-fixture",
        created_at: "2026-10-03T00:00:00Z",
        target_account_id: me.accountId,
        details: { days: 30, endsAt: "2027-01-01T00:00:00Z" },
      },
    ],
    auditReads: { count: 2, lastAt: "2026-10-31T00:00:00Z" },
  };
}
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
    if (path === "/fixture/past-due") {
      pastDue = req.method === "POST";
      res.end("ok");
      return;
    }
    if (path === "/fixture/identity-reads") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ count: identityReads }));
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
    if (path === "billing/status" && pastDue) {
      res.end(
        JSON.stringify({
          provider: "stripe",
          interval: "year",
          status: "past_due",
          currentPeriodEndsAt: "2026-12-01T00:00:00Z",
          cancelAtPeriodEnd: false,
        }),
      );
      return;
    }
    if (path === "me/export") {
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="pressay-cloud-export.json"',
      );
    }
    if (path === "/fixture/support-calls") {
      if (req.method === "DELETE") supportCalls = [];
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ calls: supportCalls, auditQueries }));
      return;
    }
    if (path === "/fixture/sign-out-subject") {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        signOutSubject = raw;
        res.end("ok");
      });
      return;
    }
    if (path === "admin/audit-log")
      auditQueries.push(Object.fromEntries(requestURL.searchParams));
    if (
      req.method === "POST" &&
      (/^admin\/(users\/[0-9a-f-]{36}\/(grants|deletion)|grants\/[0-9a-f-]{36}\/extend|devices\/[0-9a-f-]{36}\/(revoke|restore)|audit\/external)$/.test(
        path,
      ) ||
        /^devices\/[0-9a-f-]{36}\/restore$/.test(path))
    ) {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        const body = raw ? JSON.parse(raw) : null;
        supportCalls.push({ path, body });
        res.setHeader("Content-Type", "application/json");
        if (path === "admin/audit/external") {
          res.end(JSON.stringify({ recorded: true, authUserId: signOutSubject }));
          return;
        }
        if (path.startsWith("devices/")) {
          res.end(JSON.stringify({ restored: true }));
          return;
        }
        res.statusCode = path.endsWith("/grants")
          ? 201
          : path.endsWith("/deletion")
            ? 202
            : 200;
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    if (path === "devices" && requestURL.searchParams.get("include") === "revoked") {
      res.end(
        JSON.stringify({
          ...bodies.devices,
          revokedDevices: [
            {
              id: "00000000-0000-4000-8000-0000000000d3",
              displayName: "Old PC",
              platform: "windows",
              appVariant: "direct",
              appVersion: "1.3.0",
              lastSeenAt: "2026-09-10T09:00:00Z",
              revokedAt: "2026-09-11T00:00:00Z",
            },
          ],
        }),
      );
      return;
    }
    if (/^admin\/users\/[0-9a-f-]{36}$/.test(path)) {
      if (requestURL.searchParams.get("include") === "identity")
        identityReads += 1;
      res.end(
        JSON.stringify(
          adminUserDetail(decodedClaims(req.headers.authorization)?.sub),
        ),
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
