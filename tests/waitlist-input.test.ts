import assert from "node:assert/strict";
import test from "node:test";
import { parseWaitlistInput, visitorAddress } from "../lib/waitlist-input.ts";

const valid = {
  email: " Someone@Example.TEST ",
  platform: "ios",
  locale: "fr",
  source: "landing",
  consent: true,
};

test("waitlist sign-ups need explicit consent, a valid address and a known platform", () => {
  assert.deepEqual(parseWaitlistInput(valid), {
    email: "someone@example.test",
    platform: "ios",
    locale: "fr",
    source: "landing",
    consent: true,
  });
  for (const change of [
    { consent: false },
    { consent: "true" },
    { consent: undefined },
    { email: "no-at-sign" },
    { email: `${"a".repeat(250)}@x.fr` },
    { platform: "android" },
    { locale: "de" },
  ])
    assert.equal(parseWaitlistInput({ ...valid, ...change }), null, JSON.stringify(change));
  assert.equal(parseWaitlistInput(null), null);
  // Unknown fields are dropped and an odd source becomes "site".
  assert.deepEqual(
    parseWaitlistInput({ ...valid, source: "Bad Source!", ip: "1.2.3.4" }),
    { ...parseWaitlistInput(valid), source: "site" },
  );
});

test("the visitor address is the first forwarded address", () => {
  assert.equal(visitorAddress("203.0.113.7, 10.0.0.1"), "203.0.113.7");
  assert.equal(visitorAddress(null), null);
  assert.equal(visitorAddress(""), null);
  assert.equal(visitorAddress("x".repeat(65)), null);
});
