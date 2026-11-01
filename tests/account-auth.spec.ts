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
  // Public pages carry no session lookup: the header links to the account,
  // whose layout owns the session menu.
  const publicPageAPICalls: string[] = [];
  const recordAPICall = (request: { url(): string }) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/api/")) publicPageAPICalls.push(path);
  };
  page.on("request", recordAPICall);
  await page.goto("/en");
  await page.waitForLoadState("networkidle");
  page.off("request", recordAPICall);
  expect(publicPageAPICalls).toEqual([]);
  await expect(page.locator(".session-menu")).toHaveCount(0);
  await expect(
    page.locator(".site-header .nav-actions > a.text-link[href='/account']"),
  ).toHaveText("My account");
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Your Pressay account" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("account.png"),
    fullPage: true,
  });
  // First call of the navigation route compiles it in dev mode.
  await expect(page.locator(".session-menu summary")).toBeVisible({
    timeout: 30_000,
  });
  await page.goBack();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/account");
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
  context,
}) => {
  // The administration is French-only, whatever language the visitor chose
  // for the public site, and visiting it does not change that choice.
  await context.addCookies([
    { name: "pressay_locale", value: "en", url: "http://127.0.0.1:31972" },
  ]);
  await page.goto("/admin");
  await expect(page.locator(".admin-sidebar .session-menu summary")).toHaveText(
    "Mon compte",
    { timeout: 30_000 },
  );
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "pressay_locale")
      ?.value,
  ).toBe("en");
  for (const route of [
    "/admin",
    "/admin/metrics",
    "/admin/users",
    "/admin/campaigns",
    "/admin/referrals",
    "/admin/waitlist",
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
/** Signed admin step-up cookie for the current session, as /api/account/step-up sets it. */
async function grantStepUp(context: import("@playwright/test").BrowserContext) {
  const cookie = (await context.cookies()).find(
    (item) => item.name === "pressay_auth.session_token",
  );
  const token = decodeURIComponent(cookie!.value).split(".")[0];
  const session = (
    await pool.query<{ id: string; userId: string }>(
      'SELECT id,"userId" FROM auth_sessions WHERE token=$1',
      [token],
    )
  ).rows[0]!;
  const now = Math.floor(Date.now() / 1000);
  const encoded = Buffer.from(
    JSON.stringify({
      sub: session.userId,
      sid: session.id,
      iat: now,
      exp: now + 600,
      method: "totp",
    }),
  ).toString("base64url");
  const signature = createHmac(
    "sha256",
    process.env.PRESSAY_INTERNAL_JWT_SECRET!,
  )
    .update(encoded)
    .digest("base64url");
  await context.addCookies([
    {
      name: "pressay_admin_step_up",
      value: `${encoded}.${signature}`,
      url: "http://127.0.0.1:31972",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  return session;
}
test("admin customer record shows billing, devices and site identity only after step-up", async ({
  page,
  context,
  request,
}) => {
  const before = (await (
    await request.get("http://127.0.0.1:31973/fixture/identity-reads")
  ).json()) as { count: number };
  await page.goto("/admin/users?search=cus_Fixture123");
  await expect(page.getByText("Recherche par client Stripe.")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "1 Mac · 1 Windows · 1 iPhone" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "owner@example.test" }).click();
  const identity = page.locator(".admin-panel", { hasText: "Connexion au site" });
  await expect(identity).toContainText("Valide ton code Authenticator");

  const session = await grantStepUp(context);
  await pool.query(
    `INSERT INTO auth_accounts(id,"accountId","providerId","userId","createdAt","updatedAt")
     VALUES($1,$2,'google',$3,now(),now())`,
    [randomUUID(), randomUUID(), session.userId],
  );
  await page.reload();
  await expect(identity).toContainText("Google");
  await expect(identity).toContainText("Sessions web actives");
  await expect(identity).not.toContainText("127.0.0.1");
  await expect(
    page.getByRole("link", { name: /cus_Fixture123/ }),
  ).toHaveAttribute(
    "href",
    "https://dashboard.stripe.com/test/customers/cus_Fixture123",
  );
  await expect(page.getByText("Paiement échoué")).toBeVisible();
  await expect(page.getByText("Résiliation programmée")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Windows" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "iPhone", exact: true })).toBeVisible();
  await expect(page.getByText(/Révoqué le/)).toBeVisible();
  await expect(page.getByText("Consultations de cette fiche")).toBeVisible();
  const after = (await (
    await request.get("http://127.0.0.1:31973/fixture/identity-reads")
  ).json()) as { count: number };
  expect(after.count).toBeGreaterThan(before.count);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("admin-customer.png"),
    fullPage: true,
  });
});
test("support exports a customer's data for an access request with the site sign-in data, after step-up", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  await page.goto(`/admin/users/${CUSTOMER}`);
  const panel = page.locator(".admin-actions-section", {
    hasText: "Demande d’accès (RGPD)",
  });
  // Without step-up the export opens the security panel instead.
  await panel.getByRole("button", { name: "Exporter les données (JSON)" }).click();
  // The export route compiles on first use in development.
  await expect(panel.getByRole("status")).toHaveText(
    "Saisis ton code Authenticator dans le panneau ouvert, puis réessaie.",
    { timeout: 30_000 },
  );
  const session = await grantStepUp(context);
  await pool.query(
    `INSERT INTO auth_accounts(id,"accountId","providerId","userId","createdAt","updatedAt")
     VALUES($1,$2,'apple',$3,now(),now())`,
    [randomUUID(), randomUUID(), session.userId],
  );
  await page.reload();
  const download = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Exporter les données (JSON)" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`pressay-account-${CUSTOMER}.json`);
  const { readFile } = await import("node:fs/promises");
  const exported = JSON.parse(await readFile((await file.path())!, "utf8")) as {
    identitySubject: string;
    contact: { email: string };
    supportActions: unknown[];
    site: {
      format: string;
      exists: boolean;
      providers: { providerId: string }[];
      twoFactorEnabled: boolean;
      sessions: unknown[];
    };
  };
  expect(exported.identitySubject).toBe(session.userId);
  expect(exported.contact.email).toBe("owner@example.test");
  expect(exported.supportActions).toHaveLength(1);
  expect(exported.site).toMatchObject({
    format: "pressay-web-identity/1",
    exists: true,
    twoFactorEnabled: false,
  });
  expect(exported.site.providers.map((p) => p.providerId)).toContain("apple");
  expect(exported.site.sessions.length).toBeGreaterThan(0);
  // Secrets and network addresses never leave the site.
  expect(JSON.stringify(exported)).not.toMatch(/token|secret|127\.0\.0\.1/i);
  await expect(panel.getByRole("status")).toHaveText("Export téléchargé et audité.");
  const { auditQueries } = (await (
    await request.get("http://127.0.0.1:31973/fixture/support-calls")
  ).json()) as { auditQueries: Record<string, string>[] };
  expect(
    auditQueries.filter((query) => query.path.endsWith("/export")),
  ).toEqual([
    { path: `admin/users/${CUSTOMER}/export`, include: "identity" },
    { path: `admin/users/${CUSTOMER}/export`, include: "identity" },
  ]);
  const origin = { Origin: "http://127.0.0.1:31972" };
  expect(
    (await page.request.post("/api/admin/users/not-an-id/export", { headers: origin })).status(),
  ).toBe(422);
  expect(
    (
      await page.request.post(`/api/admin/users/${CUSTOMER}/export`, {
        headers: { Origin: "https://attacker.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await capture(page, "admin-customer-export");
});
test("waitlists: consented sign-up relayed with a vouched address, counters and audited CSV export", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/waitlist");
  await page.goto("/admin/waitlist");
  await expect(page.getByRole("cell", { name: "iPhone" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "12", exact: true }).first()).toBeVisible();
  // Without step-up the export opens the security panel instead.
  await page.getByRole("button", { name: "Exporter (CSV)" }).first().click();
  await expect(
    page.getByText("Saisis ton code Authenticator dans le panneau ouvert"),
  ).toBeVisible();
  const iphone = page.getByRole("form", { name: "Liste d’attente iPhone" });
  await iphone.getByLabel("Adresse e-mail").fill("Someone@Example.test");
  await iphone.getByRole("button", { name: "Prévenez-moi" }).click();
  // The browser refuses the form until consent is given.
  const unticked = (await (
    await request.get("http://127.0.0.1:31973/fixture/waitlist")
  ).json()) as { signups: unknown[] };
  expect(unticked.signups).toEqual([]);
  await iphone.getByRole("checkbox").check();
  await iphone.getByRole("button", { name: "Prévenez-moi" }).click();
  await expect(iphone.getByRole("status")).toHaveText(
    "C’est noté. Nous t’écrirons à la sortie de Pressay pour iPhone.",
  );
  const windows = page.getByRole("form", { name: "Windows waitlist" });
  await expect(windows).toContainText("I agree that Pressay may write to this address");
  await page.screenshot({
    path: test.info().outputPath("admin-waitlist.png"),
    fullPage: true,
  });
  if (process.env.PRESSAY_SCREENSHOT_DIR)
    await page.screenshot({
      path: `${process.env.PRESSAY_SCREENSHOT_DIR}/admin-waitlist-${test.info().project.name}.png`,
      fullPage: true,
    });
  const { signups } = (await (
    await request.get("http://127.0.0.1:31973/fixture/waitlist")
  ).json()) as {
    signups: { body: Record<string, unknown>; token: Record<string, unknown> | null }[];
  };
  expect(signups).toHaveLength(1);
  expect(signups[0]?.body).toEqual({
    email: "someone@example.test",
    platform: "ios",
    locale: "fr",
    source: "admin-preview",
    consent: true,
  });
  expect(signups[0]?.token).toMatchObject({
    aud: "pressay-waitlist",
    token_use: "pressay_waitlist",
  });
  expect(typeof signups[0]?.token?.client_address).toBe("string");

  const origin = { Origin: "http://127.0.0.1:31972" };
  const noConsent = await page.request.post("/api/waitlist", {
    headers: origin,
    data: { email: "x@example.test", platform: "ios", locale: "fr", consent: false },
  });
  expect(noConsent.status()).toBe(422);
  const crossSite = await page.request.post("/api/waitlist", {
    headers: { Origin: "https://attacker.example" },
    data: { email: "x@example.test", platform: "ios", locale: "fr", consent: true },
  });
  expect(crossSite.status()).toBe(403);
  const repeated = await page.request.post("/api/waitlist", {
    headers: origin,
    data: { email: "someone@example.test", platform: "ios", locale: "fr", consent: true },
  });
  expect(repeated.status()).toBe(202);
  expect(await repeated.json()).toEqual({ status: "registered" });

  await grantStepUp(context);
  await page.reload();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter (CSV)" }).first().click();
  expect((await download).suggestedFilename()).toBe("pressay-waitlist-ios.csv");
  await expect(page.getByText("Export téléchargé et audité.")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
test("account lists device platforms, asks to fix a failed payment and exports data", async ({
  page,
  request,
}) => {
  await page.goto("/fr");
  await page.goto("/account/devices");
  await expect(page.getByText("2 / 3 appareils")).toBeVisible();
  await expect(page.getByText("Pocket iPhone")).toBeVisible();
  await expect(page.getByText(/^iPhone · 1\.0\.0/)).toBeVisible();
  await request.post("http://127.0.0.1:31973/fixture/past-due");
  try {
    await page.goto("/account/billing");
    await expect(page.locator(".account-alert")).toContainText(
      "Ton dernier paiement a échoué",
    );
    await expect(
      page.getByRole("button", { name: "Régulariser le paiement" }),
    ).toBeVisible();
    await expect(page.getByText("Offre annuelle")).toBeVisible();
  } finally {
    await request.delete("http://127.0.0.1:31973/fixture/past-due");
  }
  await page.goto("/account/security");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter mes données" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^pressay-export-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(page.getByText("Export téléchargé.")).toBeVisible();
  const crossSite = await page.request.post("/api/account/export", {
    headers: { Origin: "https://attacker.example" },
  });
  expect(crossSite.status()).toBe(403);
  const proxied = await page.request.get("/api/pressay/me/export");
  expect(proxied.status()).toBe(404);
});
test("every administrator needs an Authenticator app before the administration opens", async ({
  page,
  context,
  request,
}) => {
  await request.post("http://127.0.0.1:31973/fixture/require-two-factor");
  try {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Code Authenticator obligatoire" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: "Configurer l’Authenticator" }),
    ).toHaveAttribute("href", "/account/security");
    await expect(page.locator(".admin-sidebar")).toHaveCount(0);
    await capture(page, "admin-two-factor-gate");
    // Once the web account has an Authenticator app, the site sends the proof.
    const cookies = await context.cookies();
    const token = decodeURIComponent(
      cookies.find((c) => c.name === "pressay_auth.session_token")!.value,
    ).split(".")[0];
    await pool.query(
      `UPDATE auth_users SET "twoFactorEnabled"=true
       WHERE id=(SELECT "userId" FROM auth_sessions WHERE token=$1)`,
      [token],
    );
    // Drop the cached session copy so the change is read at once.
    await context.clearCookies();
    await context.addCookies(
      cookies.filter((c) => c.name === "pressay_auth.session_token"),
    );
    await page.reload();
    await expect(page.locator(".admin-role")).toHaveText("Rôle : Propriétaire");
  } finally {
    await request.delete("http://127.0.0.1:31973/fixture/require-two-factor");
  }
});
test("owners manage members and roles; support and read-only see their role without the members screen", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  await grantStepUp(context);
  page.on("dialog", (dialog) => void dialog.accept());
  try {
    await page.goto("/admin");
    await expect(page.locator(".admin-role")).toHaveText("Rôle : Propriétaire", {
      timeout: 30_000,
    });
    await page.locator(".admin-sidebar").getByRole("link", { name: "Membres" }).click();
    await expect(page).toHaveURL(/\/admin\/team$/);
    const owner = page.getByRole("row", { name: /^owner@example\.test/ });
    await expect(owner).toContainText("toi");
    await expect(owner).toContainText("Propriétaire");
    // The fixture user has no Authenticator app on the site.
    await expect(owner).toContainText("Non configuré : accès bloqué");
    const helper = page.getByRole("row", { name: /helper@example\.test/ });
    await expect(helper).toContainText("Support");
    await expect(helper).toContainText("Inconnu");

    const add = page.getByRole("form", { name: "Ajouter un membre" });
    await add.getByLabel("Adresse e-mail vérifiée").fill("analyst@example.test");
    await add.getByLabel("Rôle").selectOption("readonly");
    await add.getByLabel("Motif").fill("Nouvel analyste");
    await add.getByRole("button", { name: "Ajouter" }).click();
    // The proxy route compiles on first use in development.
    await expect(add.getByRole("status")).toHaveText("Action effectuée et auditée.", {
      timeout: 30_000,
    });
    const change = helper.getByRole("form", { name: "Changer le rôle" });
    await change.getByLabel("Nouveau rôle").selectOption("owner");
    await change.getByLabel("Motif").fill("Associée");
    await change.getByRole("button", { name: "Changer" }).click();
    await expect(change.getByRole("status")).toHaveText("Action effectuée et auditée.");
    const remove = helper.getByRole("form", { name: "Retirer" });
    await remove.getByLabel("Motif").fill("Départ");
    await remove.getByRole("button", { name: "Retirer" }).click();
    await expect(remove.getByRole("status")).toHaveText("Action effectuée et auditée.");
    const calls = await supportCalls(request);
    expect(calls.map((call) => call.path)).toEqual([
      "admin/members",
      "admin/members/00000000-0000-4000-8000-0000000000b2/role",
      "admin/members/00000000-0000-4000-8000-0000000000b2/remove",
    ]);
    expect(calls[0]?.body).toMatchObject({
      email: "analyst@example.test",
      role: "readonly",
      reason: "Nouvel analyste",
      idempotencyKey: expect.stringMatching(UUID_PATTERN),
    });
    expect(calls[1]?.body).toMatchObject({ role: "owner", reason: "Associée" });
    expect(calls[2]?.body).toMatchObject({ reason: "Départ" });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    await capture(page, "admin-team");

    for (const [role, label] of [
      ["support", "Support"],
      ["readonly", "Lecture seule"],
    ] as const) {
      await request.post("http://127.0.0.1:31973/fixture/admin-role", { data: role });
      await page.goto("/admin");
      await expect(page.locator(".admin-role")).toHaveText(`Rôle : ${label}`);
      await expect(
        page.locator(".admin-sidebar").getByRole("link", { name: "Membres" }),
      ).toHaveCount(0);
      await page.goto("/admin/team");
      await expect(page.getByText("Cette page est réservée aux propriétaires.")).toBeVisible();
      await expect(page.getByRole("form", { name: "Ajouter un membre" })).toHaveCount(0);
    }
    await capture(page, "admin-team-readonly");
  } finally {
    await request.post("http://127.0.0.1:31973/fixture/admin-role", { data: "owner" });
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
  await other.goto("/account");
  await other.locator(".session-menu summary").click();
  await other.getByRole("button", { name: "Sign out", exact: true }).click();
  // Signing out from a protected page lands on the site or on sign-in,
  // whichever of the two navigations wins.
  await expect(other).toHaveURL(/\/en$|\/sign-in\?/);
  await page.bringToFront();
  // The sign-out broadcast may already be navigating this page away.
  await page
    .evaluate(() => window.dispatchEvent(new Event("focus")))
    .catch(() => undefined);
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

  // Terms and privacy are one click away before any account is created.
  await expect(
    page.getByRole("link", { name: "conditions générales d’utilisation et de vente" }),
  ).toHaveAttribute("href", "/fr/terms");
  await expect(
    page.getByRole("link", { name: "politique de confidentialité" }),
  ).toHaveAttribute("href", "/fr/privacy");
  await page.goto("/sign-up?locale=en");
  await expect(
    page.getByRole("link", { name: "terms of use and sale" }),
  ).toHaveAttribute("href", "/en/terms");
  await expect(
    page.getByRole("link", { name: "privacy policy" }),
  ).toHaveAttribute("href", "/en/privacy");
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

const SCREENSHOTS = process.env.PRESSAY_SCREENSHOT_DIR;
/** Full-page capture kept with the test output (and in a chosen folder). */
async function capture(page: import("@playwright/test").Page, name: string) {
  const project = test.info().project.name;
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: true });
  if (SCREENSHOTS)
    await page.screenshot({
      path: `${SCREENSHOTS}/${name}-${project}.png`,
      fullPage: true,
    });
}
type SupportCall = { path: string; body: Record<string, unknown> | null };
async function supportCalls(request: APIRequestContext): Promise<SupportCall[]> {
  return (
    (await (
      await request.get("http://127.0.0.1:31973/fixture/support-calls")
    ).json()) as { calls: SupportCall[] }
  ).calls;
}
const CUSTOMER = "00000000-0000-4000-8000-000000000001";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test("support offers and extends Pro and restores a device from the record, with a reason", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  await grantStepUp(context);
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto(`/admin/users/${CUSTOMER}`);
  const offer = page.getByRole("form", { name: "Offrir Pro" });
  await offer.getByLabel("Durée (1–365 jours)").fill("45");
  await offer.getByLabel("Motif").fill("Partenaire presse");
  await offer.getByRole("button", { name: "Offrir Pro" }).click();
  await expect(offer.getByRole("status")).toHaveText("Action effectuée et auditée.");

  const extend = page.getByRole("form", { name: "Prolonger" });
  await extend.getByLabel("Jours (1–365)").fill("10");
  await extend.getByLabel("Motif").fill("Geste commercial");
  await extend.getByRole("button", { name: "Prolonger" }).click();
  await expect(extend.getByRole("status")).toHaveText("Action effectuée et auditée.");

  const restore = page.getByRole("form", { name: "Réactiver" });
  await restore.getByLabel("Motif").fill("Ordinateur retrouvé");
  await restore.getByRole("button", { name: "Réactiver" }).click();
  await expect(restore.getByRole("status")).toHaveText("Action effectuée et auditée.");
  await expect(page.getByText("Beta tester")).toBeVisible();
  await expect(page.getByText(/jours 30 · fin/)).toBeVisible();

  const calls = await supportCalls(request);
  expect(calls.map((call) => call.path)).toEqual([
    `admin/users/${CUSTOMER}/grants`,
    "admin/grants/00000000-0000-4000-8000-0000000000a1/extend",
    "admin/devices/00000000-0000-4000-8000-0000000000d3/restore",
  ]);
  expect(calls[0]?.body).toMatchObject({ days: 45, reason: "Partenaire presse" });
  expect(calls[1]?.body).toMatchObject({ days: 10, reason: "Geste commercial" });
  for (const call of calls)
    expect(String(call.body?.idempotencyKey)).toMatch(UUID_PATTERN);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await capture(page, "admin-support-actions");
});

test("sign out everywhere ends the customer's web sessions and app tokens, after step-up", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  const customer = randomUUID();
  await pool.query(
    'INSERT INTO auth_users(id,name,email,"emailVerified","createdAt","updatedAt") VALUES($1,$2,$3,true,now(),now())',
    [customer, "Customer", `${customer}@example.test`],
  );
  for (const id of [randomUUID(), randomUUID()])
    await pool.query(
      'INSERT INTO auth_sessions(id,token,"userId","expiresAt","createdAt","updatedAt") VALUES($1,$2,$3,now()+interval \'30 days\',now(),now())',
      [id, randomUUID(), customer],
    );
  const clientId = `support-test-${randomUUID()}`;
  await pool.query(
    `INSERT INTO auth_oauth_clients(id,"clientId","redirectUris","tokenEndpointAuthMethod","grantTypes","responseTypes","requirePKCE","skipConsent",scopes,name,"createdAt","updatedAt")
     VALUES($1,$2,'["pressay://callback"]','none','["refresh_token"]','["code"]',true,true,'["openid"]','Pressay for Windows',now(),now())`,
    [randomUUID(), clientId],
  );
  const refresh = randomUUID();
  await pool.query(
    `INSERT INTO auth_oauth_refresh_tokens(id,token,"clientId","userId","expiresAt","createdAt",scopes)
     VALUES($1,$2,$3,$4,now()+interval '30 days',now(),'["openid"]')`,
    [refresh, randomUUID(), clientId, customer],
  );
  await pool.query(
    `INSERT INTO auth_oauth_access_tokens(id,token,"clientId","userId","refreshId","expiresAt","createdAt",scopes)
     VALUES($1,$2,$3,$4,$5,now()+interval '15 minutes',now(),'["openid"]')`,
    [randomUUID(), randomUUID(), clientId, customer, refresh],
  );
  await request.post("http://127.0.0.1:31973/fixture/sign-out-subject", {
    data: customer,
  });

  await page.goto("/fr");
  const endpoint = `/api/admin/users/${CUSTOMER}/sign-out`;
  const body = { idempotencyKey: randomUUID(), reason: "Ordinateur volé" };
  const origin = { Origin: "http://127.0.0.1:31972" };
  const withoutStepUp = await page.request.post(endpoint, { headers: origin, data: body });
  expect(withoutStepUp.status()).toBe(403);
  expect((await withoutStepUp.json()).error.code).toBe("step_up_required");
  const session = await grantStepUp(context);
  const crossSite = await page.request.post(endpoint, {
    headers: { Origin: "https://attacker.example" },
    data: body,
  });
  expect(crossSite.status()).toBe(403);
  expect(
    (await page.request.post(endpoint, { headers: origin, data: { ...body, reason: "" } })).status(),
  ).toBe(422);
  expect(await supportCalls(request)).toEqual([]);

  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto(`/admin/users/${CUSTOMER}`);
  const form = page.getByRole("form", { name: "Déconnecter partout" });
  await form.getByLabel("Motif").fill("Ordinateur volé");
  await form.getByRole("button", { name: "Déconnecter" }).click();
  await expect(form.getByRole("status")).toHaveText("Action effectuée et auditée.");

  const remaining = await pool.query<{ table: string; count: number }>(
    `SELECT 'sessions' AS table,count(*)::int FROM auth_sessions WHERE "userId"=$1
     UNION ALL SELECT 'refresh',count(*)::int FROM auth_oauth_refresh_tokens WHERE "userId"=$1
     UNION ALL SELECT 'access',count(*)::int FROM auth_oauth_access_tokens WHERE "userId"=$1`,
    [customer],
  );
  expect(remaining.rows.map((row) => row.count)).toEqual([0, 0, 0]);
  // The owner's own session is untouched.
  expect(
    (await pool.query("SELECT 1 FROM auth_sessions WHERE id=$1", [session.id])).rowCount,
  ).toBe(1);
  const calls = await supportCalls(request);
  expect(calls.map((call) => [call.path, call.body?.result])).toEqual([
    ["admin/audit/external", "requested"],
    ["admin/audit/external", "succeeded"],
  ]);
  expect(calls[1]?.body).toMatchObject({
    action: "user.sessions.revoke",
    targetAccountId: CUSTOMER,
    reason: "Ordinateur volé",
    details: { webSessions: 2, oauthRefreshTokens: 1, oauthAccessTokens: 1 },
  });
  expect(calls[0]?.body?.idempotencyKey).toBe(calls[1]?.body?.idempotencyKey);
  expect(JSON.stringify(calls)).not.toContain(customer);
  const relayed = await page.request.post("/api/pressay/admin/audit/external", {
    headers: origin,
    data: { ...body, action: "user.sessions.revoke", result: "requested" },
  });
  expect(relayed.status()).toBe(404);
});

test("audit ledger shows full authors and details, filters and pages under step-up", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  await grantStepUp(context);
  await page.goto("/admin/audit");
  await expect(page.getByText("owner@example.test")).toBeVisible();
  await expect(page.getByRole("link", { name: CUSTOMER }).first()).toBeVisible();
  await expect(page.getByText(/accès 00000000-0000-4000-8000-0000000000a1 · jours 30/)).toBeVisible();
  await expect(page.getByText("Échec")).toBeVisible();
  await page.getByLabel("Action (ou préfixe)").fill("grant");
  await page.getByLabel("Compte ou cible").fill(CUSTOMER);
  await page.getByLabel("Du", { exact: true }).fill("2026-10-01");
  await page.getByRole("button", { name: "Filtrer" }).click();
  await expect(page).toHaveURL(/action=grant/);
  await page.getByRole("link", { name: "Plus anciennes →" }).click();
  await expect(page).toHaveURL(/cursor=119/);
  await expect(page.getByRole("link", { name: "← Plus récentes" })).toBeVisible();
  const { auditQueries } = (await (
    await request.get("http://127.0.0.1:31973/fixture/support-calls")
  ).json()) as { auditQueries: Record<string, string>[] };
  expect(auditQueries[0]).toEqual({ path: "admin/audit-log", reads: "exclude" });
  expect(auditQueries.at(-1)).toEqual({
    path: "admin/audit-log",
    action: "grant",
    target: CUSTOMER,
    from: "2026-10-01",
    reads: "exclude",
    cursor: "119",
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await capture(page, "admin-audit");
});

test("the account lists revoked devices and restores one", async ({ page, request }) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto("/fr");
  await page.goto("/account/devices");
  const revoked = page.locator(".account-card", { hasText: "Appareils révoqués" });
  await expect(revoked).toContainText("Old PC");
  await expect(revoked).toContainText("Révoqué le");
  await revoked.getByRole("button", { name: "Réactiver" }).click();
  await expect
    .poll(async () => (await supportCalls(request)).map((call) => call.path))
    .toEqual(["devices/00000000-0000-4000-8000-0000000000d3/restore"]);
  await capture(page, "account-revoked-devices");
});

test("billing tabs show disputes and failed webhooks, replay a Stripe event and alert on the overview", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  await grantStepUp(context);
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto("/admin");
  const alerts = page.locator(".admin-alerts");
  await expect(alerts).toContainText("1 litige ouvert");
  await expect(alerts).toContainText("2 webhooks en échec");
  await expect(alerts).toContainText("1 abonnement impayé");
  await capture(page, "admin-overview-alerts");
  await alerts.getByRole("link", { name: "2 webhooks en échec" }).click();
  await expect(page).toHaveURL(/\/admin\/billing\?tab=webhooks/);
  await expect(page.getByText("Relance par Apple")).toBeVisible();
  const replay = page.getByRole("form", { name: "Rejouer" });
  await replay.getByLabel("Motif").fill("Stripe en panne hier");
  await replay.getByRole("button", { name: "Rejouer" }).click();
  await expect(replay.getByRole("status")).toHaveText("Action effectuée et auditée.");
  await capture(page, "admin-billing-webhooks");
  await page.getByRole("link", { name: "Litiges" }).click();
  await page.getByRole("link", { name: "Seulement les litiges ouverts" }).click();
  await expect(page).toHaveURL(/open=true/);
  await expect(page.getByRole("link", { name: "owner@example.test" })).toBeVisible();
  await expect(page.getByText("7,99 €")).toBeVisible();
  await page.getByRole("link", { name: "Plus anciens →" }).click();
  await expect(page).toHaveURL(/cursor=/);
  await capture(page, "admin-billing-disputes");
  const calls = await supportCalls(request);
  expect(calls.map((call) => call.path)).toEqual([
    "admin/billing/events/stripe/evt_FixtureFailed/replay",
  ]);
  expect(calls[0]?.body).toMatchObject({ reason: "Stripe en panne hier" });
  const { auditQueries } = (await (
    await request.get("http://127.0.0.1:31973/fixture/support-calls")
  ).json()) as { auditQueries: Record<string, string>[] };
  expect(auditQueries).toContainEqual({ path: "admin/billing/events", state: "failed" });
  expect(auditQueries).toContainEqual({
    path: "admin/billing/financial-events",
    kind: "dispute",
    open: "true",
    cursor: "2026-10-28T00:00:00+00:00|evt_dispute",
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});

test("metrics show Stripe and App Store revenue, trials apart, sign-ups and downloads", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.locator(".admin-sidebar").getByRole("link", { name: "Indicateurs" }).click();
  await expect(page).toHaveURL(/\/admin\/metrics$/);
  const kpis = page.locator(".admin-kpis");
  await expect(kpis).toContainText("35,64 €");
  await expect(kpis).toContainText("5 · 3 Stripe · 2 App Store");
  await expect(kpis).toContainText("Essais en cours2");
  await expect(kpis).toContainText("4 · 9");
  await expect(kpis).toContainText("76,99 €");
  await expect(page.getByText("1 abonnement(s) antérieur(s)")).toBeVisible();
  await expect(page.getByText("Sandbox Apple actif (non payé) : 1.")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Sandbox (non payé)" })).toBeVisible();
  await expect(page.locator(".admin-bars > div")).toHaveCount(30);
  await expect(page.getByRole("heading", { name: "Appareils actifs par plateforme" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "iPhone", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Téléchargements (48 sur 30 jours)" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await capture(page, "admin-metrics");
});

test("metrics show churn, cohort conversion, trials, download breakdowns and audited CSV exports", async ({
  page,
  context,
  request,
}) => {
  await request.delete("http://127.0.0.1:31973/fixture/support-calls");
  await page.goto("/admin/metrics");
  const advanced = page.locator(".admin-advanced");
  await expect(advanced.getByRole("heading", { name: "Churn mensuel" })).toBeVisible();
  // September (the last complete month of the fixture): 1 stop out of 4.
  await expect(advanced.locator(".admin-churn-last")).toContainText(/sept\. 2026\) :\s25\s%/);
  await expect(advanced.getByText(/Historique des statuts d’abonnement depuis le/)).toBeVisible();
  // August cohort: 5 of 20 paid.
  await expect(
    advanced.getByRole("row", { name: /août 2026 20 5 25\s%/ }),
  ).toBeVisible();
  await expect(advanced.getByRole("cell", { name: "launch-week" })).toBeVisible();
  await expect(
    advanced.getByRole("heading", { name: "Téléchargements détaillés (30 jours)" }),
  ).toBeVisible();
  await page.getByLabel("Période").selectOption("24");
  await page.getByLabel("Téléchargements sur").selectOption("90");
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page).toHaveURL(/months=24&days=90/);

  // Without step-up the export opens the security panel instead.
  await page.getByRole("button", { name: "Churn (CSV)" }).click();
  // The export route compiles on first use in development.
  await expect(
    page.getByText("Saisis ton code Authenticator dans le panneau ouvert, puis réessaie."),
  ).toBeVisible({ timeout: 30_000 });
  await grantStepUp(context);
  await page.reload();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Churn (CSV)" }).click();
  expect((await download).suggestedFilename()).toBe("pressay-churn-2026-10-31.csv");
  await expect(page.getByText("Export téléchargé et audité.")).toBeVisible();
  const { auditQueries } = (await (
    await request.get("http://127.0.0.1:31973/fixture/support-calls")
  ).json()) as { auditQueries: Record<string, string>[] };
  expect(auditQueries).toContainEqual({
    path: "admin/metrics/advanced",
    months: "24",
    days: "90",
  });
  expect(auditQueries.filter((query) => query.path.startsWith("admin/export/"))).toEqual([
    { path: "admin/export/churn.csv", months: "24" },
    { path: "admin/export/churn.csv", months: "24" },
  ]);

  // The site refuses malformed or cross-site export requests before the Cloud.
  const origin = { Origin: "http://127.0.0.1:31972" };
  for (const path of [
    "/api/admin/export/churn.csv?days=30",
    "/api/admin/export/accounts.csv?months=12",
    "/api/admin/export/churn.csv?months=12&x=1",
  ])
    expect((await page.request.post(path, { headers: origin })).status(), path).toBe(422);
  expect(
    (
      await page.request.post("/api/admin/export/churn.csv?months=12", {
        headers: { Origin: "https://attacker.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await capture(page, "admin-metrics-advanced");
});
