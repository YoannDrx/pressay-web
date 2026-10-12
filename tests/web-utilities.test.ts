import assert from "node:assert/strict";
import test from "node:test";
import { localizedPath } from "../lib/locale-path.ts";
import { isMalformedPath } from "../lib/request-path.ts";
import { checkoutErrorMessage } from "../lib/checkout-errors.ts";
import { contentSecurityPolicy } from "../lib/content-security-policy.ts";

test("language switch keeps the current page", () => {
  assert.equal(localizedPath("/fr/pricing", "en"), "/en/pricing");
  assert.equal(localizedPath("/en/support/secure-input?x=1", "fr"), "/fr/support/secure-input");
  assert.equal(localizedPath("/fr", "en"), "/en");
  assert.equal(localizedPath("/account", "en"), "/en");
  assert.equal(localizedPath("/french", "en"), "/en");
});

test("crafted paths are rejected before routing", () => {
  for (const path of ["/download/pressay%5C%5C%5C", "/download/pressay%5c", "/fr/a\\b", "/x%00", "/fr%2Fprivacy", "/bad%E0%A4%A"])
    assert.equal(isMalformedPath(path), true, path);
  for (const path of ["/", "/fr/privacy", "/download/pressay", "/en/support/secure-input", "/caf%C3%A9"])
    assert.equal(isMalformedPath(path), false, path);
});

test("checkout errors become sentences, never raw codes", () => {
  const closed = checkoutErrorMessage(503, { error: "commercial_launch_not_enabled" }, "fr");
  assert.match(closed, /pas encore ouverts/);
  assert.match(checkoutErrorMessage(429, null, "en"), /Too many attempts/);
  assert.match(checkoutErrorMessage(500, { error: { code: "stripe_error" } }, "en"), /not been charged/);
  assert.ok(!checkoutErrorMessage(500, { error: "stripe_error" }, "en").includes("stripe_error"));
});

test("script policy is nonce-based without unsafe-inline", () => {
  const policy = contentSecurityPolicy("abc123");
  const script = policy.split("; ").find((directive) => directive.startsWith("script-src"))!;
  assert.match(script, /'nonce-abc123'/);
  assert.match(script, /'strict-dynamic'/);
  assert.ok(!script.includes("unsafe-inline"));
  assert.ok(!script.includes("unsafe-eval"));
  assert.ok(!policy.includes("clerk"));
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicy("n", { development: true }), /'unsafe-eval'/);
});
