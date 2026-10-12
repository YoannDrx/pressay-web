import assert from "node:assert/strict";
import test from "node:test";
import { providerHint, sanitizeSignInErrorCode, signInErrorView } from "../lib/sign-in-errors.ts";

test("no error parameter shows no error", () => {
  assert.equal(signInErrorView(undefined, undefined, "fr"), null);
});

test("cancelled consent gets an actionable French message", () => {
  const view = signInErrorView("access_denied", "The user denied", "fr");
  assert.equal(view?.kind, "cancelled");
  assert.match(view!.message, /Apple ou Google/);
});

test("expired state is explained in English", () => {
  const view = signInErrorView("state_mismatch", undefined, "en");
  assert.equal(view?.kind, "expired");
  assert.match(view!.message, /same browser/);
});

test("redirect_uri problems are classified from the description, never echoed", () => {
  const view = signInErrorView("weird_code", "Bad redirect_uri <script>", "en");
  assert.equal(view?.kind, "provider");
  assert.ok(!view!.message.includes("<script>"));
  assert.ok(!view!.title.includes("redirect_uri"));
});

test("arbitrary text in error is reduced to a safe code", () => {
  assert.equal(sanitizeSignInErrorCode("<img src=x onerror=alert(1)>"), "unknown");
  assert.equal(sanitizeSignInErrorCode(["a", "ACCOUNT_NOT_LINKED"]), "account_not_linked");
  assert.equal(signInErrorView("account_not_linked", null, "fr")?.kind, "account_link");
});

test("provider hint is read directly or from the nested authorize URL", () => {
  assert.equal(providerHint("google", undefined), "google");
  assert.equal(providerHint(["apple"], undefined), "apple");
  assert.equal(providerHint(undefined, "/api/auth/oauth2/authorize?client_id=x&provider=apple"), "apple");
  assert.equal(providerHint("github", undefined), null);
  assert.equal(providerHint(undefined, "https://evil.example/?provider=google"), null);
});
