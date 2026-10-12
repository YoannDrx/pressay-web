import assert from "node:assert/strict";
import test from "node:test";
import { revokeAppleTokens } from "../lib/apple.ts";

test("posts each token to Apple's revoke endpoint as a form", async () => {
  const requests: { url: string; body: URLSearchParams }[] = [];
  const result = await revokeAppleTokens([{ token: "rt", hint: "refresh_token" }], {
    clientID: "app.press-say.web",
    clientSecret: async () => "client-secret-jwt",
    fetcher: async (url, init) => {
      requests.push({ url: String(url), body: init?.body as URLSearchParams });
      return new Response(null, { status: 200 });
    },
  });
  assert.deepEqual(result, { attempted: 1, revoked: 1, failures: [] });
  assert.equal(requests[0]!.url, "https://appleid.apple.com/auth/revoke");
  assert.equal(requests[0]!.body.get("client_id"), "app.press-say.web");
  assert.equal(requests[0]!.body.get("client_secret"), "client-secret-jwt");
  assert.equal(requests[0]!.body.get("token"), "rt");
  assert.equal(requests[0]!.body.get("token_type_hint"), "refresh_token");
});

test("reports failures as codes without throwing", async () => {
  const result = await revokeAppleTokens(
    [{ token: "a", hint: "access_token" }, { token: "b", hint: "access_token" }],
    {
      clientID: "id",
      clientSecret: async () => "s",
      fetcher: (() => {
        let call = 0;
        return async () => { call += 1; if (call === 1) return new Response(null, { status: 400 }); throw new TypeError("offline"); };
      })(),
    },
  );
  assert.deepEqual(result, { attempted: 2, revoked: 0, failures: ["apple_revoke_http_400", "apple_revoke_network"] });
});

test("no tokens or no configuration means no network call", async () => {
  let called = false;
  const fetcher = async () => { called = true; return new Response(); };
  assert.deepEqual(await revokeAppleTokens([], { clientID: "id", fetcher }), { attempted: 0, revoked: 0, failures: [] });
  const missing = await revokeAppleTokens([{ token: "t", hint: "access_token" }], { clientID: "id", clientSecret: async () => { throw new Error("no key"); }, fetcher });
  assert.deepEqual(missing.failures, ["apple_client_secret_unavailable"]);
  assert.equal(called, false);
});
