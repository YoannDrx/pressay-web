import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID, createHmac, createHash } from "node:crypto";
import { Pool } from "pg";
test.skip(
  !process.env.WEB_TEST_DATABASE_URL,
  "Requires the isolated account test configuration",
);
let pool: Pool;
test.beforeAll(() => {
  pool = new Pool({ connectionString: process.env.WEB_TEST_DATABASE_URL });
});
test.afterAll(async () => {
  await pool?.end();
});
test.beforeEach(async ({ context }) => {
  const user = randomUUID(),
    session = randomUUID(),
    token = randomUUID();
  await pool.query(
    'INSERT INTO auth_users(id,name,email,"emailVerified","createdAt","updatedAt") VALUES($1,$2,$3,true,now(),now())',
    [user, "Test owner", `${user}@example.test`],
  );
  await pool.query(
    'INSERT INTO auth_sessions(id,token,"userId","expiresAt","createdAt","updatedAt") VALUES($1,$2,$3,now()+interval \'30 days\',now(),now())',
    [session, token, user],
  );
  const signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(token)
    .digest("base64");
  await context.addCookies([
    {
      name: "pressay_auth.session_token",
      value: encodeURIComponent(`${token}.${signature}`),
      url: "http://127.0.0.1:31972",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});
test("session survives landing, account, back, refresh, and active sign-in redirect", async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text()))
      hydrationErrors.push(message.text());
  });
  await page.goto("/en");
  await expect(page.locator(".session-menu summary")).toBeVisible();
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Your Pressay account" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("account.png"),
    fullPage: true,
  });
  await page.goBack();
  await expect(page.locator(".session-menu summary")).toBeVisible();
  await page.reload();
  await expect(page.locator(".session-menu summary")).toBeVisible();
  await page.goto("/sign-in?locale=en&redirect_url=%2Faccount%2Fdevices");
  await expect(page).toHaveURL(/\/account\/devices$/);
  await expect(
    page.getByRole("heading", { name: "Your devices" }),
  ).toBeVisible();
  expect(hydrationErrors).toEqual([]);
  const arbitraryAttribution = await page.request.post(
    "/api/pressay/referrals/attribute",
    {
      headers: { Origin: "http://127.0.0.1:31972" },
      data: { code: "ABCDEF123456", issuedAt: Math.floor(Date.now() / 1000) },
    },
  );
  expect(arbitraryAttribution.status()).toBe(403);
});
test("an expired session redirects to sign-in and preserves its destination", async ({
  page,
  context,
}) => {
  await page.goto("/fr");
  await page.goto("/account/devices");
  await expect(
    page.getByRole("heading", { name: "Tes appareils" }),
  ).toBeVisible();
  const cookie = (await context.cookies()).find(
    (item) => item.name === "pressay_auth.session_token",
  );
  const token = decodeURIComponent(cookie!.value).split(".")[0];
  await pool.query(
    "UPDATE auth_sessions SET \"expiresAt\"=now()-interval '1 minute' WHERE token=$1",
    [token],
  );
  await page.reload();
  await expect(page).toHaveURL(/\/sign-in\?/);
  expect(new URL(page.url()).searchParams.get("redirect_url")).toBe(
    "/account/devices",
  );
  await expect(page.getByRole("heading", { name: /Connexion/ })).toBeVisible();
});
test("partial billing failure leaves devices and security navigable", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:31973/fixture/billing-error");
  try {
    await page.goto("/fr");
    await page.goto("/account");
    await expect(
      page.getByText("fixture-diagnostic", { exact: false }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Appareils", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Tes appareils" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Sécurité", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Sécurité du compte" }),
    ).toBeVisible();
  } finally {
    await request.delete("http://127.0.0.1:31973/fixture/billing-error");
  }
});
test("admin routes render real contract fixtures and remain within the mobile viewport", async ({
  page,
}) => {
  for (const route of [
    "/admin",
    "/admin/users",
    "/admin/campaigns",
    "/admin/referrals",
    "/admin/billing",
    "/admin/health",
    "/admin/audit",
  ]) {
    await page.goto(route);
    await expect(page.locator(".admin-main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
    if (route === "/admin/campaigns")
      await page.screenshot({
        path: test.info().outputPath("admin-campaigns.png"),
        fullPage: true,
      });
  }
});
test("logout in another tab removes the authenticated account view", async ({
  page,
  context,
}) => {
  await page.goto("/en");
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Your Pressay account" }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto("/en");
  await other.locator(".session-menu summary").click();
  await other.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(other).toHaveURL(/\/en$/);
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page).toHaveURL(/\/sign-in/);
});

test("security shows persistent Authenticator status and explains stale passkey sessions inline", async ({
  page,
  context,
}) => {
  const cookie = (await context.cookies()).find(
    (item) => item.name === "pressay_auth.session_token",
  )!;
  const token = decodeURIComponent(cookie.value).split(".")[0];
  await pool.query(
    'UPDATE auth_users SET "twoFactorEnabled"=true WHERE id=(SELECT "userId" FROM auth_sessions WHERE token=$1)',
    [token],
  );
  await pool.query(
    "UPDATE auth_sessions SET \"createdAt\"=now()-interval '11 minutes' WHERE token=$1",
    [token],
  );
  await page.goto("/fr");
  await page.goto("/account/security");
  const totp = page.getByRole("region", { name: "Application Authenticator" });
  await expect(
    totp.getByText("✓ Activé et vérifié", { exact: true }),
  ).toBeVisible();
  await expect(
    totp.getByRole("button", { name: "Configurer une application" }),
  ).toHaveCount(0);
  const keys = page.getByRole("region", { name: "Clés d’accès" });
  await keys.getByRole("button", { name: "Ajouter une clé d’accès" }).click();
  await expect(keys.getByRole("alert")).toContainText("connexion récente");
  await expect(
    keys.getByRole("button", { name: "Ajouter une clé d’accès" }),
  ).toBeEnabled();
  await expect(
    keys.getByRole("button", { name: "Se reconnecter pour continuer" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    totp.getByText("✓ Activé et vérifié", { exact: true }),
  ).toBeVisible();
});

test("security registers a passkey through WebAuthn and keeps it after reload", async ({
  page,
  context,
}) => {
  const cookie = (await context.cookies()).find(
    (item) => item.name === "pressay_auth.session_token",
  )!;
  await context.addCookies([
    {
      name: cookie.name,
      value: cookie.value,
      url: "http://localhost:31972",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        transport: "usb",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    },
  );
  try {
    await page.goto("http://localhost:31972/fr");
    await page.goto("http://localhost:31972/account/security");
    const keys = page.getByRole("region", { name: "Clés d’accès" });
    await expect(keys.getByText("Aucune clé enregistrée.")).toBeVisible();
    await keys.getByRole("button", { name: "Ajouter une clé d’accès" }).click();
    await expect(
      keys.getByText(
        "Clé d’accès enregistrée. Tu peux maintenant l’utiliser pour te connecter.",
      ),
    ).toBeVisible();
    await expect(
      keys.getByRole("button", { name: "Supprimer", exact: true }),
    ).toHaveCount(1);
    await page.reload();
    await expect(
      keys.getByRole("button", { name: "Supprimer", exact: true }),
    ).toHaveCount(1);
    await page.screenshot({
      path: test.info().outputPath("security-passkey.png"),
      fullPage: true,
    });
  } finally {
    await cdp.send("WebAuthn.removeVirtualAuthenticator", { authenticatorId });
    await cdp.detach();
  }
});

test("security distinguishes a passkey list outage from an empty list", async ({
  page,
}) => {
  await page.route("**/api/auth/passkey/list-user-passkeys", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ code: "UNAVAILABLE" }),
    }),
  );
  await page.goto("/fr");
  await page.goto("/account/security");
  const keys = page.getByRole("region", { name: "Clés d’accès" });
  await expect(keys.getByRole("alert")).toContainText("Impossible de charger");
  await expect(keys.getByText("Aucune clé enregistrée.")).toHaveCount(0);
});

test("security confirms TOTP enrollment and preserves admin verification after reload", async ({
  page,
}) => {
  await page.goto("/fr");
  await page.goto("/account/security");
  const totp = page.getByRole("region", { name: "Application Authenticator" });
  await totp
    .getByRole("button", { name: "Configurer une application" })
    .click();
  await expect(
    totp.getByText("Activation à confirmer", { exact: true }),
  ).toBeVisible();
  const uri = await totp
    .getByRole("link", { name: "Ouvrir dans l’application Authenticator" })
    .getAttribute("href");
  const secret = new URL(uri!).searchParams.get("secret")!;
  // The secret belongs only to this freshly-created local PostgreSQL fixture.
  const bits = [...secret.toUpperCase().replace(/=+$/, "")]
    .map((c) =>
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
        .indexOf(c)
        .toString(2)
        .padStart(5, "0"),
    )
    .join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const generate = () => {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const hash = createHmac("sha1", key).update(counter).digest();
    const offset = hash[hash.length - 1] & 15;
    return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(
      6,
      "0",
    );
  };
  await totp.getByLabel("Code à 6 chiffres").fill(generate());
  await totp.getByRole("button", { name: "Valider et activer" }).click();
  await expect(
    totp.getByText("✓ Activé et vérifié", { exact: true }),
  ).toBeVisible();
  await expect(
    totp.getByText(
      "Authenticator activé et vérifié. Conserve tes codes de secours hors ligne.",
    ),
  ).toBeVisible();
  await page.reload();
  await expect(
    totp.getByText("✓ Activé et vérifié", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin");
  await page
    .getByText("Valider les actions sensibles", { exact: true })
    .click();
  await page.getByLabel("Validation forte", { exact: true }).fill(generate());
  await page.getByRole("button", { name: "Valider 10 min" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Actions sensibles autorisées" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Actions sensibles autorisées" }),
  ).toBeVisible();
});

test("Google sign-in redirects to Google with the exact callback URI and shows errors", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  // Never reach the real provider: capture the authorization request instead.
  let authorize: URL | null = null;
  await page.route("https://accounts.google.com/**", async (route) => {
    authorize = new URL(route.request().url());
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>google</p>" });
  });
  await page.goto("/sign-in?locale=fr&provider=google&redirect_url=%2Faccount");
  await page.waitForURL(/^https:\/\/accounts\.google\.com\//);
  const url = authorize! as URL;
  expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
  expect(url.searchParams.get("redirect_uri")).toBe(
    "http://127.0.0.1:31972/api/auth/callback/google",
  );
  expect(url.searchParams.get("client_id")).toBe("local-test");
  expect(url.searchParams.get("response_type")).toBe("code");
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("state")).toBeTruthy();

  // Back from the provider with an error: explained, retry offered, no loop.
  authorize = null;
  await page.goto("/sign-in?locale=fr&provider=google&error=access_denied&error_description=denied");
  await expect(page.getByRole("alert").getByText("Connexion annulée.")).toBeVisible();
  const buttons = page.locator(".auth-provider-actions > button");
  await expect(buttons.first()).toHaveText("Continuer avec Google");
  await page.waitForTimeout(500);
  expect(authorize).toBeNull();
});

test("TOTP cannot be disabled without a current authenticator code", async ({
  page,
}) => {
  await page.goto("/fr");
  await page.goto("/account/security");
  const totp = page.getByRole("region", { name: "Application Authenticator" });
  await totp.getByRole("button", { name: "Configurer une application" }).click();
  const uri = await totp
    .getByRole("link", { name: "Ouvrir dans l’application Authenticator" })
    .getAttribute("href");
  const secret = new URL(uri!).searchParams.get("secret")!;
  const bits = [...secret.toUpperCase().replace(/=+$/, "")]
    .map((c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const generate = () => {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const hash = createHmac("sha1", key).update(counter).digest();
    const offset = hash[hash.length - 1] & 15;
    return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
  };
  await totp.getByLabel("Code à 6 chiffres").fill(generate());
  await totp.getByRole("button", { name: "Valider et activer" }).click();
  await expect(totp.getByText("✓ Activé et vérifié", { exact: true })).toBeVisible();

  // A session cookie alone is not enough: the API refuses without a code.
  const refused = await page.request.post("/api/auth/two-factor/disable", {
    data: {},
    headers: { Origin: "http://127.0.0.1:31972" },
  });
  expect(refused.status()).toBe(403);
  expect((await refused.json()).code).toBe("TOTP_CODE_REQUIRED");

  await totp.getByRole("button", { name: "Désactiver TOTP" }).click();
  await totp.getByLabel("Code à 6 chiffres").fill("000000");
  await totp.getByRole("button", { name: "Désactiver", exact: true }).click();
  await expect(totp.getByRole("alert").filter({ hasText: "Code incorrect" })).toBeVisible();
  await expect(totp.getByText("✓ Activé et vérifié", { exact: true })).toBeVisible();
  await totp.getByLabel("Code à 6 chiffres").fill(generate());
  await totp.getByRole("button", { name: "Désactiver", exact: true }).click();
  await expect(totp.getByText("Authenticator désactivé.")).toBeVisible();
});

async function deletionCount(request: APIRequestContext): Promise<number> {
  const response = await request.get("http://127.0.0.1:31973/fixture/deletions");
  return ((await response.json()) as { count: number }).count;
}

test("account deletion asks for a fresh sign-in, then warns about an Apple subscription", async ({
  page,
  request,
}) => {
  await page.goto("/fr");
  await page.goto("/account/security");
  // Age the session past Better Auth's freshness window.
  await pool.query(
    `UPDATE auth_sessions SET "createdAt" = now() - interval '2 days' WHERE "userId" = (SELECT id FROM auth_users ORDER BY "createdAt" DESC LIMIT 1)`,
  );
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByText("Confirme ton identité.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmer avec Google" })).toBeVisible();

  // Fresh again (as after re-authentication), with an active Apple subscription.
  await pool.query(
    `UPDATE auth_sessions SET "createdAt" = now() WHERE "userId" = (SELECT id FROM auth_users ORDER BY "createdAt" DESC LIMIT 1)`,
  );
  // The browser proxy never relays account deletion, whatever the spelling.
  const deletionsBefore = await deletionCount(request);
  for (const path of ["me", "ME", "me/", "v1/me", "me%2F", "devices/../me"]) {
    const response = await page.request.delete(`/api/pressay/${path}`, {
      headers: { Origin: "http://127.0.0.1:31972" },
      maxRedirects: 0,
    });
    expect([308, 404], path).toContain(response.status());
  }
  expect(await deletionCount(request)).toBe(deletionsBefore);

  // The Cloud re-checks freshness itself; its refusal asks for a new sign-in.
  await request.post("http://127.0.0.1:31973/fixture/deletion-max-age");
  try {
    await page.goto("/account/security?resume=delete-account");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("Confirme ton identité.")).toBeVisible();
  } finally {
    await request.delete("http://127.0.0.1:31973/fixture/deletion-max-age");
  }

  await request.post("http://127.0.0.1:31973/fixture/apple-subscription");
  try {
    await page.goto("/account/security?resume=delete-account");
    await expect(page.getByText("Connexion confirmée.")).toBeVisible();
    await expect(page).toHaveURL(/\/account\/security$/);
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("Un abonnement Apple est encore actif.")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gérer mes abonnements Apple" }),
    ).toHaveAttribute("href", "https://apps.apple.com/account/subscriptions");
    await page.getByRole("button", { name: "Supprimer quand même" }).click();
    await expect(page).toHaveURL(/\/fr$/);
    // Proxy tokens use their dedicated audience, never the Mac API one.
    const claims = await (
      await request.get("http://127.0.0.1:31973/fixture/last-token")
    ).json();
    expect(claims).toEqual({ aud: "pressay-web-proxy", token_use: "pressay_web_proxy" });
  } finally {
    await request.delete("http://127.0.0.1:31973/fixture/apple-subscription");
  }
});

test("Cloud-initiated identity deletion removes the user once, idempotently", async ({
  request,
}) => {
  test.skip(test.info().project.name !== "desktop", "API-only contract test");
  const { SignJWT } = await import("jose");
  const { rows } = await pool.query(
    'SELECT id FROM auth_users ORDER BY "createdAt" DESC LIMIT 1',
  );
  const userId = rows[0].id as string;
  const sign = (subject: string, secret = process.env.PRESSAY_INTERNAL_JWT_SECRET!) =>
    new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("https://api.press-say.app/internal")
      .setAudience("pressay-web-internal")
      .setSubject(subject)
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(new TextEncoder().encode(secret));
  const call = async (token: string, body: unknown) =>
    request.post("/api/internal/identity-deletion", {
      headers: { Authorization: `Bearer ${token}` },
      data: body,
    });
  const body = { userId, reason: "account_deleted" };

  const forged = await call(await sign(userId, "x".repeat(40)), body);
  expect(forged.status()).toBe(401);
  const mismatch = await call(await sign("someone-else"), body);
  expect(mismatch.status()).toBe(401);

  const first = await call(await sign(userId), body);
  expect(first.status()).toBe(200);
  expect(await first.json()).toEqual({ deleted: true });
  const remaining = await pool.query(
    'SELECT (SELECT count(*) FROM auth_users WHERE id = $1) AS users, (SELECT count(*) FROM auth_sessions WHERE "userId" = $1) AS sessions',
    [userId],
  );
  expect(remaining.rows[0]).toEqual({ users: "0", sessions: "0" });

  const replay = await call(await sign(userId), body);
  expect(replay.status()).toBe(200);
  expect(await replay.json()).toEqual({ deleted: false });
});

test("desktop OAuth: provider hint reaches sign-in, public client can revoke its refresh token", async ({
  browser,
  page,
  request,
}) => {
  test.skip(test.info().project.name !== "desktop", "Protocol test, once");
  const clientID = "w9ckUgrcFp7H7wNV";
  const redirectURI = "pressay://oauth/callback";
  const resource = "https://api.press-say.app";
  // First request initializes Better Auth, which seeds the API resource.
  const metadata = await (
    await page.request.get("/.well-known/oauth-authorization-server")
  ).json();
  // The production client is registered once by the owner; mirror it locally.
  await pool.query(
    `INSERT INTO auth_oauth_clients(id,"clientId","redirectUris","tokenEndpointAuthMethod","grantTypes","responseTypes","requirePKCE","skipConsent",scopes,name,"createdAt","updatedAt")
     VALUES($1,$2,$3,'none',$4,$5,true,true,$6,'Pressay for Mac',now(),now()) ON CONFLICT ("clientId") DO NOTHING`,
    [
      randomUUID(),
      clientID,
      JSON.stringify([redirectURI]),
      JSON.stringify(["authorization_code", "refresh_token"]),
      JSON.stringify(["code"]),
      JSON.stringify(["openid", "profile", "email", "offline_access"]),
    ],
  );
  await pool.query(
    `INSERT INTO auth_oauth_client_resources(id,"clientId","resourceId","createdAt") VALUES($1,$2,$3,now()) ON CONFLICT DO NOTHING`,
    [randomUUID(), clientID, resource],
  );

  expect(metadata.revocation_endpoint).toBe(
    "http://127.0.0.1:31972/api/auth/oauth2/revoke",
  );
  expect(metadata.code_challenge_methods_supported).toContain("S256");
  const openid = await (
    await page.request.get("/.well-known/openid-configuration")
  ).json();
  expect(openid.revocation_endpoint).toBe(metadata.revocation_endpoint);

  const verifier = randomUUID() + randomUUID();
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorize = (provider?: string) => {
    const query = new URLSearchParams({
      response_type: "code",
      client_id: clientID,
      redirect_uri: redirectURI,
      scope: "openid profile email offline_access",
      state: randomUUID(),
      code_challenge: challenge,
      code_challenge_method: "S256",
      resource,
    });
    if (provider) query.set("provider", provider);
    return `/api/auth/oauth2/authorize?${query}`;
  };

  // Signed out: the Mac app's hint survives the redirect to /sign-in and
  // starts Google directly (the provider itself is never contacted).
  const anonymous = await browser.newContext({ baseURL: "http://127.0.0.1:31972" });
  const signedOut = await anonymous.newPage();
  const signInURLs: string[] = [];
  signedOut.on("request", (request) => {
    if (new URL(request.url()).pathname === "/sign-in") signInURLs.push(request.url());
  });
  await signedOut.route("https://accounts.google.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<p>google</p>" }),
  );
  await signedOut.goto(authorize("google"));
  await signedOut.waitForURL(/^https:\/\/accounts\.google\.com\//);
  const signIn = new URL(signInURLs[0]!);
  expect(signIn.searchParams.get("provider")).toBe("google");
  expect(signIn.searchParams.get("sig")).toBeTruthy();
  await anonymous.close();

  // Signed in: code -> tokens -> RFC 7009 revocation by the public client.
  // Token calls come from the app, which has no browser cookies.
  const redirect = await page.request.get(authorize("apple"), { maxRedirects: 0 });
  const location = redirect.headers()["location"] ?? (await redirect.json()).url;
  const code = new URL(location).searchParams.get("code");
  expect(code).toBeTruthy();
  const tokens = await (
    await request.post("/api/auth/oauth2/token", {
      form: {
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: redirectURI,
        client_id: clientID,
        code_verifier: verifier,
        resource,
      },
    })
  ).json();
  expect(tokens.refresh_token).toBeTruthy();
  const revoked = await request.post(metadata.revocation_endpoint, {
    form: {
      token: tokens.refresh_token,
      token_type_hint: "refresh_token",
      client_id: clientID,
    },
  });
  expect(revoked.status()).toBe(200);
  const refreshed = await request.post("/api/auth/oauth2/token", {
    form: {
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: clientID,
      resource,
    },
  });
  expect(refreshed.status()).toBeGreaterThanOrEqual(400);
});

test("pages linked from the Mac app stay live", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "Routing test, once");
  for (const path of [
    "/fr/pricing?source=pressay-desktop",
    "/en/pricing?source=pressay-desktop",
    "/fr/terms",
    "/en/terms",
    "/privacy",
    "/support",
    "/account/billing",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
  }
});
