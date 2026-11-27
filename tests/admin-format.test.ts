import assert from "node:assert/strict";
import test from "node:test";
import {
  describeUserAgent,
  deviceMix,
  money,
  paymentNeedsAction,
  platformLabel,
  stripeDashboardURL,
} from "../lib/admin-format.ts";

test("Stripe links follow the API's Stripe mode and accept only Stripe identifiers", () => {
  assert.equal(
    stripeDashboardURL("cus_Q1w2E3", "live"),
    "https://dashboard.stripe.com/customers/cus_Q1w2E3",
  );
  assert.equal(
    stripeDashboardURL("sub_1Abc", "test"),
    "https://dashboard.stripe.com/test/subscriptions/sub_1Abc",
  );
  assert.equal(
    stripeDashboardURL("dp_9", "live"),
    "https://dashboard.stripe.com/disputes/dp_9",
  );
  for (const id of ["", null, "cus_", "cus_x/../y", "javascript:alert(1)", "evt_1"])
    assert.equal(stripeDashboardURL(id, "live"), null, String(id));
  assert.equal(stripeDashboardURL("cus_Q1", undefined), null);
});

test("devices are labelled by platform", () => {
  assert.equal(platformLabel("windows"), "Windows");
  assert.equal(platformLabel("macos", "mas"), "Mac (App Store)");
  assert.equal(platformLabel(undefined), "Mac");
  assert.equal(deviceMix(2, 1, 3), "2 Mac · 1 Windows");
  assert.equal(deviceMix(0, 0, 0), "0");
  assert.equal(deviceMix(undefined, undefined, 4), "4");
});

test("session user agents are reduced to browser and system", () => {
  assert.equal(
    describeUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
    ),
    "Chrome · macOS",
  );
  assert.equal(
    describeUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    ),
    "Safari · iOS",
  );
  assert.equal(describeUserAgent(null), "—");
});

test("payment problems and amounts", () => {
  assert.equal(paymentNeedsAction("past_due"), true);
  assert.equal(paymentNeedsAction("grace"), true);
  assert.equal(paymentNeedsAction("active"), false);
  assert.equal(paymentNeedsAction(null), false);
  assert.match(money(6900, "eur"), /69,00\s€/);
});
