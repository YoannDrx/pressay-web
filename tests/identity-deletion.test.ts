import assert from "node:assert/strict";
import test from "node:test";
import type { AppleRevocationResult, AppleToken } from "../lib/apple.ts";
import { appleTokensFor, deleteIdentity, type IdentityStore, type StoredAccount } from "../lib/identity-deletion.ts";

function memoryStore(users: Record<string, StoredAccount[]>) {
  const calls: string[] = [];
  const store: IdentityStore = {
    async userExists(userId) { calls.push(`exists:${userId}`); return userId in users; },
    async findAccounts(userId) { calls.push(`accounts:${userId}`); return users[userId] ?? []; },
    async decryptToken(token) { if (token === "broken") throw new Error("bad"); return `plain-${token}`; },
    async deleteDependents(userId) { calls.push(`dependents:${userId}`); },
    async deleteUser(userId) { calls.push(`user:${userId}`); delete users[userId]; },
  };
  return { store, calls };
}

const noRevocation = async (): Promise<AppleRevocationResult> => ({ attempted: 0, revoked: 0, failures: [] });

test("unknown user is an idempotent no-op", async () => {
  const { store, calls } = memoryStore({});
  assert.deepEqual(await deleteIdentity("ghost", store, noRevocation), { deleted: false });
  assert.deepEqual(calls, ["exists:ghost"]);
});

test("deletes dependents before the user, then a replay is a no-op", async () => {
  const { store, calls } = memoryStore({ u1: [{ providerId: "google", accessToken: "g" }] });
  assert.deepEqual(await deleteIdentity("u1", store, noRevocation), { deleted: true });
  assert.deepEqual(calls, ["exists:u1", "accounts:u1", "dependents:u1", "user:u1"]);
  assert.deepEqual(await deleteIdentity("u1", store, noRevocation), { deleted: false });
});

test("Apple tokens are revoked, refresh token preferred, Google ignored", async () => {
  const { store } = memoryStore({ u1: [
    { providerId: "apple", accessToken: "a-access", refreshToken: "a-refresh" },
    { providerId: "google", accessToken: "g", refreshToken: "g-r" },
  ] });
  const seen: AppleToken[][] = [];
  await deleteIdentity("u1", store, async (tokens) => { seen.push(tokens); return { attempted: 1, revoked: 1, failures: [] }; });
  assert.deepEqual(seen, [[{ token: "plain-a-refresh", hint: "refresh_token" }]]);
});

test("Apple revocation failure never blocks deletion and logs codes only", async () => {
  const { store, calls } = memoryStore({ u1: [{ providerId: "apple", accessToken: "a" }] });
  const logs: string[] = [];
  const result = await deleteIdentity("u1", store, async () => { throw new Error("apple down"); }, (event, detail) => logs.push(`${event}:${detail}`));
  assert.deepEqual(result, { deleted: true });
  assert.ok(calls.includes("user:u1"));
  assert.deepEqual(logs, ["apple_token_revocation_failed:unexpected"]);
});

test("undecryptable tokens are skipped; access token used without refresh token", async () => {
  const tokens = await appleTokensFor(
    [{ providerId: "apple", refreshToken: "broken" }, { providerId: "apple", accessToken: "only-access" }],
    async (token) => { if (token === "broken") throw new Error("x"); return token; },
  );
  assert.deepEqual(tokens, [{ token: "only-access", hint: "access_token" }]);
});
