import assert from "node:assert/strict";
import test from "node:test";
import {
  alertItems,
  billingHref,
  billingPath,
  billingView,
} from "../lib/admin-billing.ts";

test("alerts list only what needs someone, most urgent first", () => {
  assert.deepEqual(alertItems(null), []);
  assert.deepEqual(
    alertItems({
      failed_webhooks: 2,
      open_disputes: 1,
      unpaid_subscriptions: 0,
      duplicate_subscriptions: 1,
    }).map((item) => [item.key, item.label, item.href]),
    [
      ["disputes", "1 litige ouvert", "/admin/billing?tab=dispute&open=true"],
      ["webhooks", "2 webhooks en échec", "/admin/billing?tab=webhooks"],
      ["duplicates", "1 compte avec deux abonnements actifs", null],
    ],
  );
  // An API without admin/alerts still reports failed webhooks.
  assert.deepEqual(
    alertItems(null, 3).map((item) => item.label),
    ["3 webhooks en échec"],
  );
});

test("billing views map to the Cloud filters and keep their page", () => {
  assert.deepEqual(billingView({}), { tab: "webhooks", open: false, cursor: "" });
  assert.equal(billingPath(billingView({})), "admin/billing/events?state=failed");
  assert.equal(billingPath(billingView({ tab: "events" })), "admin/billing/events?");
  const disputes = billingView({ tab: "dispute", open: "true", cursor: "c|1" });
  assert.equal(
    billingPath(disputes),
    "admin/billing/financial-events?kind=dispute&open=true&cursor=c%7C1",
  );
  assert.equal(billingHref(disputes, ""), "/admin/billing?tab=dispute&open=true");
  assert.equal(billingView({ tab: "refund", open: "true" }).open, false);
  assert.equal(billingView({ tab: "unknown" }).tab, "webhooks");
});
