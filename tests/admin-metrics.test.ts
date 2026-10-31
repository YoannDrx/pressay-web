import assert from "node:assert/strict";
import test from "node:test";
import { metricsSummary } from "../lib/admin-metrics.ts";

test("metrics keep trials and Sandbox apart from paying subscribers and sum MRR per currency", () => {
  const summary = metricsSummary({
    subscribers: [
      { provider: "stripe", billing_interval: "month", status: "active", environment: "Production", count: 3 },
      { provider: "stripe", billing_interval: "month", status: "trialing", environment: "Production", count: 2 },
      { provider: "app_store", billing_interval: "year", status: "grace", environment: "Production", count: 1 },
      { provider: "app_store", billing_interval: "month", status: "active", environment: "Sandbox", count: 4 },
    ],
    mrr: [
      { provider: "app_store", currency: "eur", mrr_minor: 500, arr_minor: 6000, subscriptions: 1, estimated_subscriptions: 1 },
      { provider: "stripe", currency: "eur", mrr_minor: 2397, arr_minor: 28764, subscriptions: 3, estimated_subscriptions: 0 },
      { provider: "stripe", currency: "chf", mrr_minor: 900, arr_minor: 10800, subscriptions: 1, estimated_subscriptions: 0 },
    ],
    signups: [
      { day: "2026-10-30", count: 0 },
      { day: "2026-10-31", count: 6 },
    ],
    activeAccounts: { active_7d: 1, active_30d: 2 },
    grants: [{ source: "support", count: 2 }],
    collectedThisMonth: [],
    downloads: [{ platform: "macos", app_version: "1.4.0", last_7d: 1, last_30d: 5 }],
    generatedAt: "2026-10-31T00:00:00Z",
  });
  assert.equal(summary.paying, 4);
  assert.equal(summary.trials, 2);
  assert.equal(summary.sandbox, 4);
  assert.deepEqual(summary.payingByProvider, { stripe: 3, app_store: 1 });
  assert.deepEqual(summary.mrr, [
    { currency: "chf", amountMinor: 900 },
    { currency: "eur", amountMinor: 2897 },
  ]);
  assert.equal(summary.estimated, 1);
  assert.equal(summary.signups30d, 6);
  assert.equal(summary.signupsPeak, 6);
  assert.equal(summary.activeGrants, 2);
  assert.equal(summary.downloads30d, 5);
});
