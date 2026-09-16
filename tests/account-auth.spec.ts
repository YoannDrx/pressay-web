import { test, expect } from "@playwright/test";
import { randomUUID, createHmac } from "node:crypto";
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
