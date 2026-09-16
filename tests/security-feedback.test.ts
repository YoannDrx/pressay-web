import assert from "node:assert/strict";
import test from "node:test";
import { securityFailure } from "../lib/security-feedback.ts";

test("stale session asks for reauthentication without weakening freshness", () => {
  for (const locale of ["fr", "en"] as const) {
    assert.equal(
      securityFailure({ code: "SESSION_NOT_FRESH", status: 403 }, locale)
        .reauthenticate,
      true,
    );
    assert.equal(
      securityFailure({ status: 500 }, locale).reauthenticate,
      undefined,
    );
  }
});
test("cancellation and duplicate keys have actionable messages", () => {
  assert.match(
    securityFailure({ code: "ERROR_CEREMONY_ABORTED" }, "fr").text,
    /annulée/,
  );
  assert.match(
    securityFailure({ code: "PREVIOUSLY_REGISTERED" }, "en").text,
    /already registered/,
  );
});
test("unknown errors never expose server or credential content", () => {
  const result = securityFailure(new Error("private-user-data"), "fr");
  assert.equal(result.tone, "error");
  assert.equal(result.text.includes("private-user-data"), false);
});
