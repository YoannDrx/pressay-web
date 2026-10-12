import assert from "node:assert/strict";
import test from "node:test";
import { SignJWT } from "jose";
import {
  DEFAULT_CLOUD_INTERNAL_ISSUER,
  IDENTITY_DELETION_AUDIENCE,
  cloudInternalIssuer,
  internalJWTSecret,
  verifyIdentityDeletionRequest,
} from "../lib/internal-identity-token.ts";

const secret = "test-internal-secret-with-at-least-32-chars";
const now = new Date("2026-10-11T12:00:00Z");
const nowSeconds = Math.floor(now.getTime() / 1000);
const body = { userId: "user_123", reason: "account_deleted" };
const options = { secret, issuer: DEFAULT_CLOUD_INTERNAL_ISSUER, currentDate: now };

async function token(overrides: {
  sub?: string; iss?: string; aud?: string; iat?: number; exp?: number; jti?: string | null; key?: string; alg?: string;
} = {}) {
  const jwt = new SignJWT({})
    .setProtectedHeader({ alg: overrides.alg ?? "HS256" })
    .setSubject(overrides.sub ?? "user_123")
    .setIssuer(overrides.iss ?? DEFAULT_CLOUD_INTERNAL_ISSUER)
    .setAudience(overrides.aud ?? IDENTITY_DELETION_AUDIENCE)
    .setIssuedAt(overrides.iat ?? nowSeconds - 10)
    .setExpirationTime(overrides.exp ?? nowSeconds + 50);
  if (overrides.jti !== null) jwt.setJti(overrides.jti ?? "jti-1");
  return `Bearer ${await jwt.sign(new TextEncoder().encode(overrides.key ?? secret))}`;
}

test("a valid contract token is accepted", async () => {
  const result = await verifyIdentityDeletionRequest(await token(), body, options);
  assert.deepEqual(result, { ok: true, request: body, jti: "jti-1" });
});

test("issuer defaults to the Cloud internal issuer and the secret needs 32 chars", () => {
  assert.equal(cloudInternalIssuer({}), "https://api.press-say.app/internal");
  assert.equal(cloudInternalIssuer({ PRESSAY_CLOUD_INTERNAL_JWT_ISSUER: "https://staging/internal" }), "https://staging/internal");
  assert.equal(internalJWTSecret({ PRESSAY_INTERNAL_JWT_SECRET: "short" }), null);
  assert.equal(internalJWTSecret({ PRESSAY_INTERNAL_JWT_SECRET: secret }), secret);
});

test("missing secret answers 503 without verifying", async () => {
  const result = await verifyIdentityDeletionRequest(await token(), body, { ...options, secret: null });
  assert.deepEqual(result, { ok: false, status: 503, error: "internal_auth_not_configured" });
});

for (const [name, overrides, error] of [
  ["wrong issuer", { iss: "https://attacker/internal" }, "invalid_token"],
  ["wrong audience", { aud: "pressay-cloud" }, "invalid_token"],
  ["wrong key", { key: "another-secret-with-at-least-32-characters" }, "invalid_token"],
  ["expired token", { iat: nowSeconds - 400, exp: nowSeconds - 60 }, "token_expired"],
  ["token older than five minutes", { iat: nowSeconds - 320, exp: nowSeconds - 20 + 300 }, "token_expired"],
  ["lifetime over five minutes", { iat: nowSeconds - 10, exp: nowSeconds + 600 }, "invalid_token"],
  ["missing jti", { jti: null }, "invalid_token"],
] as const) {
  test(`rejects ${name} with 401`, async () => {
    const result = await verifyIdentityDeletionRequest(await token(overrides), body, options);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.error, error);
    }
  });
}

test("rejects a missing or malformed Authorization header", async () => {
  for (const header of [null, "", "Basic abc", "Bearer not-a-jwt"]) {
    const result = await verifyIdentityDeletionRequest(header, body, options);
    assert.equal(result.ok ? 200 : result.status, 401);
  }
});

test("rejects a token for another user", async () => {
  const result = await verifyIdentityDeletionRequest(await token({ sub: "user_999" }), body, options);
  assert.deepEqual(result, { ok: false, status: 401, error: "subject_mismatch" });
});

test("rejects an invalid body with 400", async () => {
  for (const invalid of [null, [], { userId: "user_123" }, { userId: "", reason: "account_deleted" }, { userId: 1, reason: "account_deleted" }]) {
    const result = await verifyIdentityDeletionRequest(await token(), invalid, options);
    assert.equal(result.ok ? 200 : result.status, 400);
  }
});
