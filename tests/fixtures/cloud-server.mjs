import http from "node:http";
// Waitlist sign-ups relayed by the site, with the claims of their token.
let waitlistSignups = [];
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
// Administrator role returned by admin/session, and whether admin routes
// require the Authenticator proof (off by default: test users have none).
let adminRole = "owner";
let requireTwoFactor = false;
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
        id: "00000000-0000-4000-8000-0000000000d4",
        displayName: "Pocket iPhone",
        platform: "ios",
        appVariant: "app_store_ios",
        appVersion: "1.0.0",
        lastSeenAt: "2026-10-28T09:00:00Z",
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
        active_device_count: 3,
        macos_device_count: 1,
        windows_device_count: 1,
        ios_device_count: 1,
        last_device_seen_at: "2026-10-30T09:00:00Z",
      },
    ],
    nextCursor: null,
    searchKind: "stripe_customer",
  },
  "admin/campaigns": { campaigns: [] },
  "admin/waitlist": {
    platforms: [
      { platform: "ios", subscribed: 12, unsubscribed: 1, french: 8, english: 4, last_7d: 5, last_signup_at: "2026-10-30T10:00:00Z" },
      { platform: "windows", subscribed: 3, unsubscribed: 0, french: 1, english: 2, last_7d: 0, last_signup_at: "2026-10-12T10:00:00Z" },
    ],
    sources: [{ platform: "ios", source: "landing", count: 12 }],
  },
  "admin/referrals": { referrals: [] },
  "admin/billing/events": {
    events: [
      {
        provider: "stripe",
        provider_event_id: "evt_FixtureFailed",
        event_type: "invoice.paid",
        state: "failed",
        error_code: "stripe_api_error",
        received_at: "2026-10-30T08:00:00Z",
        processed_at: "2026-10-30T08:00:01Z",
        account_id: "00000000-0000-4000-8000-000000000001",
      },
      {
        provider: "apple",
        provider_event_id: "apple-fixture",
        event_type: "DID_RENEW",
        state: "failed",
        error_code: "app_store_unavailable",
        received_at: "2026-10-29T08:00:00Z",
        processed_at: "2026-10-29T08:00:01Z",
        account_id: null,
      },
    ],
    nextCursor: null,
  },
  "admin/billing/financial-events": {
    events: [
      {
        provider_event_id: "evt_dispute",
        provider_object_id: "dp_Fixture",
        provider_subscription_id: null,
        kind: "dispute",
        status: "needs_response",
        amount_minor: 799,
        currency: "eur",
        full_reversal: true,
        provider_occurred_at: "2026-10-28T00:00:00Z",
        account_id: "00000000-0000-4000-8000-000000000001",
        email: "owner@example.test",
      },
    ],
    nextCursor: "2026-10-28T00:00:00+00:00|evt_dispute",
  },
  "admin/metrics": {
    subscribers: [
      { provider: "app_store", billing_interval: "month", status: "active", environment: "Sandbox", count: 1 },
      { provider: "app_store", billing_interval: "year", status: "active", environment: "Production", count: 2 },
      { provider: "stripe", billing_interval: "month", status: "active", environment: "Production", count: 3 },
      { provider: "stripe", billing_interval: "month", status: "trialing", environment: "Production", count: 2 },
    ],
    mrr: [
      { provider: "app_store", currency: "eur", mrr_minor: 1167, arr_minor: 14004, subscriptions: 2, estimated_subscriptions: 1 },
      { provider: "stripe", currency: "eur", mrr_minor: 2397, arr_minor: 28764, subscriptions: 3, estimated_subscriptions: 0 },
    ],
    signups: Array.from({ length: 30 }, (_, index) => ({
      day: new Date(Date.UTC(2026, 9, 2 + index)).toISOString().slice(0, 10),
      count: index % 7 === 0 ? 3 : index % 3,
    })),
    activeAccounts: { active_7d: 4, active_30d: 9 },
    grants: [
      { source: "invitation", count: 1 },
      { source: "support", count: 2 },
    ],
    collectedThisMonth: [
      { currency: "eur", paid_minor: 7699, refunded_minor: 799, invoices: 2 },
    ],
    devicesByPlatform: [
      { platform: "ios", active: 7, seen_7d: 5, seen_30d: 6 },
      { platform: "macos", active: 30, seen_7d: 18, seen_30d: 25 },
    ],
    downloads: [
      { platform: "macos", app_version: "1.4.0", last_7d: 12, last_30d: 40 },
      { platform: "windows", app_version: "1.4.0", last_7d: 3, last_30d: 8 },
    ],
    generatedAt: "2026-10-31T06:00:00Z",
  },
  "admin/metrics/advanced": {
    months: 12,
    days: 30,
    historyStartedAt: "2026-10-31T06:00:00Z",
    churn: [
      { month: "2026-08", paying_start: 0, new_paying: 4, churned: 0 },
      { month: "2026-09", paying_start: 4, new_paying: 3, churned: 1 },
      { month: "2026-10", paying_start: 6, new_paying: 2, churned: 0 },
    ],
    cohorts: [
      { month: "2026-08", signups: 20, converted: 5, converted_30d: 4, trials: 6 },
      { month: "2026-09", signups: 16, converted: 2, converted_30d: 2, trials: 3 },
      { month: "2026-10", signups: 9, converted: 0, converted_30d: 0, trials: 2 },
    ],
    trials: [
      { month: "2026-08", started: 6, converted: 3, ended: 3, running: 0 },
      { month: "2026-09", started: 3, converted: 1, ended: 1, running: 1 },
      { month: "2026-10", started: 2, converted: 0, ended: 0, running: 2 },
    ],
    downloads: {
      platforms: [
        { platform: "macos", count: 40 },
        { platform: "windows", count: 8 },
      ],
      versions: [
        { platform: "macos", app_version: "1.4.0", count: 40 },
        { platform: "windows", app_version: "1.4.0", count: 8 },
      ],
      sources: [
        { source: "site", count: 44 },
        { source: "newsletter", count: 4 },
      ],
      campaigns: [{ campaign: "launch-week", count: 4 }],
    },
    generatedAt: "2026-10-31T06:00:00Z",
  },
  "admin/alerts": {
    failed_webhooks: 2,
    failed_webhooks_24h: 1,
    open_disputes: 1,
    unpaid_subscriptions: 1,
    duplicate_subscriptions: 0,
    refunds_24h: 0,
    failed_payments_24h: 1,
    checkedAt: "2026-10-31T06:00:00Z",
  },
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
        id: "00000000-0000-4000-8000-0000000000d4",
        displayName: "Pocket iPhone",
        platform: "ios",
        appVariant: "app_store_ios",
        appVersion: "1.0.0",
        approved: false,
        lastSeenAt: "2026-10-28T09:00:00Z",
        createdAt: "2026-10-01T00:00:00Z",
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
    providerEvents: [
      {
        provider: "stripe",
        provider_event_id: "evt_FixtureFailed",
        event_type: "invoice.paid",
        state: "failed",
        error_code: "stripe_api_error",
        received_at: "2026-10-30T08:00:00Z",
        processed_at: "2026-10-30T08:00:01Z",
        account_id: me.accountId,
      },
    ],
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
    if (path === "/fixture/admin-role") {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        adminRole = raw || "owner";
        res.end("ok");
      });
      return;
    }
    if (path === "/fixture/require-two-factor") {
      requireTwoFactor = req.method === "POST";
      res.end("ok");
      return;
    }
    if (req.headers.authorization) lastToken = tokenClaims(req.headers.authorization);
    // Contract: every administrator needs an Authenticator app.
    if (
      requireTwoFactor &&
      path.startsWith("admin/") &&
      decodedClaims(req.headers.authorization)?.pressay_two_factor !== true
    ) {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 403;
      res.end(JSON.stringify({ error: { code: "two_factor_required" } }));
      return;
    }
    if (path === "admin/session") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ role: adminRole, accountId: me.accountId }));
      return;
    }
    if (path === "admin/members" && req.method === "GET") {
      res.setHeader("Content-Type", "application/json");
      if (adminRole !== "owner") {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: { code: "role_forbidden" } }));
        return;
      }
      res.end(
        JSON.stringify({
          members: [
            {
              accountId: me.accountId,
              authUserId: decodedClaims(req.headers.authorization)?.sub ?? "unknown",
              email: me.email,
              role: "owner",
              addedBy: null,
              addedByEmail: null,
              createdAt: "2026-09-01T00:00:00Z",
              updatedAt: "2026-09-01T00:00:00Z",
            },
            {
              accountId: "00000000-0000-4000-8000-0000000000b2",
              authUserId: "member-without-web-identity",
              email: "helper@example.test",
              role: "support",
              addedBy: me.accountId,
              addedByEmail: me.email,
              createdAt: "2026-10-30T00:00:00Z",
              updatedAt: "2026-10-30T00:00:00Z",
            },
          ],
        }),
      );
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
      if (req.method === "DELETE") {
        supportCalls = [];
        auditQueries = [];
      }
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
    if (
      ["admin/audit-log", "admin/billing/events", "admin/billing/financial-events"].includes(
        path,
      )
    )
      auditQueries.push({ path, ...Object.fromEntries(requestURL.searchParams) });
    if (
      req.method === "POST" &&
      (/^admin\/(users\/[0-9a-f-]{36}\/(grants|deletion)|grants\/[0-9a-f-]{36}\/extend|devices\/[0-9a-f-]{36}\/(revoke|restore)|audit\/external|billing\/events\/stripe\/[A-Za-z0-9_-]+\/replay|members|members\/[0-9a-f-]{36}\/(role|remove))$/.test(
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
    if (/^admin\/users\/[0-9a-f-]{36}\/export$/.test(path)) {
      auditQueries.push({ path, ...Object.fromEntries(requestURL.searchParams) });
      // Contract: the access-request export is a step-up read.
      const claims = decodedClaims(req.headers.authorization);
      if (
        typeof claims?.pressay_step_up_at !== "number" ||
        claims.pressay_step_up_at < Date.now() / 1000 - 600
      ) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: { code: "step_up_required" } }));
        return;
      }
      res.end(
        JSON.stringify({
          format: "pressay-cloud-support-export/1",
          account: { id: me.accountId, status: "active" },
          contact: { email: me.email },
          waitlists: [{ platform: "ios", locale: "fr", source: "landing" }],
          identitySubject: claims.sub,
          supportActions: [{ action: "grant.create", result: "succeeded", reason: "Beta tester" }],
          reservedInvitations: [],
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
    if (path === "/fixture/waitlist") {
      if (req.method === "DELETE") waitlistSignups = [];
      res.end(JSON.stringify({ signups: waitlistSignups }));
      return;
    }
    if (path === "waitlist" && req.method === "POST") {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        const claims = decodedClaims(req.headers.authorization);
        waitlistSignups.push({
          body: JSON.parse(raw),
          token: claims && {
            aud: claims.aud,
            token_use: claims.token_use,
            client_address: claims.client_address,
          },
        });
        res.statusCode = 202;
        res.end(JSON.stringify({ status: "registered" }));
      });
      return;
    }
    if (path === "admin/metrics/advanced")
      auditQueries.push({ path, ...Object.fromEntries(requestURL.searchParams) });
    if (/^admin\/export\/[a-z]+\.csv$/.test(path)) {
      auditQueries.push({ path, ...Object.fromEntries(requestURL.searchParams) });
      // Contract: exports are step-up reads.
      const stepUpAt = decodedClaims(req.headers.authorization)?.pressay_step_up_at;
      if (typeof stepUpAt !== "number" || stepUpAt < Date.now() / 1000 - 600) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: { code: "step_up_required" } }));
        return;
      }
      const dataset = path.slice("admin/export/".length, -".csv".length);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="pressay-${dataset}-2026-10-31.csv"`,
      );
      res.end('month,paying_start,new_paying,churned,churn_rate\r\n"2026-10","6","2","0","0.0000"\r\n');
      return;
    }
    if (path === "admin/waitlist/export") {
      // Contract: the export is a step-up read.
      const stepUpAt = decodedClaims(req.headers.authorization)?.pressay_step_up_at;
      if (typeof stepUpAt !== "number" || stepUpAt < Date.now() / 1000 - 600) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: { code: "step_up_required" } }));
        return;
      }
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.end(
        'email,platform,locale,source,consent_at,created_at\r\n"a@example.test","ios","fr","landing","2026-10-30T10:00:00.000Z","2026-10-30T10:00:00.000Z"\r\n',
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
