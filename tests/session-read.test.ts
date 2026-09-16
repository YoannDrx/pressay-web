import assert from "node:assert/strict";
import test from "node:test";
import { readSessionWithRetry } from "../lib/session-read.ts";

test("recovers the session after a connection timeout", async () => {
  let attempts = 0;
  const session = { user: { id: "account-a" } };
  const result = await readSessionWithRetry(async () => {
    if (++attempts === 1)
      throw new Error("Connection terminated due to connection timeout");
    return session;
  });
  assert.equal(result, session);
  assert.equal(attempts, 2);
});

test("a revoked session stays unauthenticated after recovery", async () => {
  let attempts = 0;
  assert.equal(
    await readSessionWithRetry(async () => {
      if (++attempts === 1)
        throw Object.assign(new Error("reset"), { code: "ECONNRESET" });
      return null;
    }),
    null,
  );
  assert.equal(attempts, 2);
});

test("persistent failure is thrown after one retry", async () => {
  let attempts = 0;
  const failure = new Error("Connection terminated unexpectedly");
  await assert.rejects(
    readSessionWithRetry(async () => {
      attempts++;
      throw failure;
    }),
    (error) => error === failure,
  );
  assert.equal(attempts, 2);
});

test("schema and authentication failures are not retried", async () => {
  for (const code of ["42P01", "28P01", "UNAUTHORIZED"]) {
    let attempts = 0;
    const failure = Object.assign(new Error("failure"), { code });
    await assert.rejects(
      readSessionWithRetry(async () => {
        attempts++;
        throw failure;
      }),
      (error) => error === failure,
    );
    assert.equal(attempts, 1);
  }
});

test("a missing session does not cause a retry", async () => {
  let attempts = 0;
  assert.equal(
    await readSessionWithRetry(async () => {
      attempts++;
      return null;
    }),
    null,
  );
  assert.equal(attempts, 1);
});
