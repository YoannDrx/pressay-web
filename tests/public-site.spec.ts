import { expect, test } from "@playwright/test";

const isRemoteEnvironment = Boolean(process.env.PLAYWRIGHT_BASE_URL);

test("French landing exposes the product contract and metadata", async ({ page }) => {
  const response = await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Votre voix");
  await expect(page.getByText("presse-papiers", { exact: false }).first()).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("landing navigation and compatibility marquee are accessible", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByLabel("Choisir la langue")).toContainText("FR");
  await expect(page.getByLabel("Applications compatibles")).toContainText("Slack");
  await expect(page.locator(".app-logo-card svg")).toHaveCount(26);
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0);
});

test("expanded legal pages expose identity, privacy and withdrawal routes", async ({ page }) => {
  await page.goto("/fr/legal");
  await expect(page.getByText("803 272 590 00024")).toBeVisible();
  await page.goto("/fr/privacy");
  await expect(page.getByRole("heading", { name: "Données exclues" })).toBeVisible();
  await page.goto("/fr/withdrawal");
  await expect(page.getByRole("heading", { name: "Droit de rétractation" })).toBeVisible();
});

test("English routes expose factual pricing and the current launch state", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("generous Free");
  await expect(page.getByRole("row", { name: /Pressay/ })).toContainText("€69");
  await expect(page.getByRole("row", { name: /Superwhisper/ })).toContainText("$249.99");
  if (isRemoteEnvironment) {
    await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(0);
    expect(await page.getByRole("button", { name: /€69|€7\.99|€149/ }).count()).toBeGreaterThan(0);
  } else {
    await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /€69|€7\.99|€149/ })).toHaveCount(0);
  }
});

test("download page exposes the public stable and checksum", async ({ page }) => {
  await page.goto("/fr/download");
  await expect(page.getByText(/^v1\.2\.6$/)).toBeVisible();
  await expect(page.getByRole("link", { name: /SHA-256/ })).toHaveAttribute("href", /Pressay\.dmg\.sha256$/);
});

test("commercial UI fails closed before identity and Stripe are configured", async ({ page }) => {
  test.skip(isRemoteEnvironment, "This is the local fail-closed contract.");
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("bientôt disponible");
  const response = await page.request.post("/api/checkout", { data: { plan: "pro_byok", interval: "annual" } });
  expect(response.status()).toBe(503);
});

test("legacy sign-in callback remains harmless while identity is disabled", async ({ page }) => {
  test.skip(isRemoteEnvironment, "This is the local identity-disabled contract.");
  await page.goto("/sign-in/sso-callback");
  await expect(page).toHaveTitle(/Pressay/);
  await expect(page.getByRole("heading", { name: "Connexion bientôt disponible." })).toBeVisible();
});

test("local sign-up route is available", async ({ page }) => {
  test.skip(isRemoteEnvironment, "This is the local identity-disabled contract.");
  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: "Inscription bientôt disponible." })).toBeVisible();
});

test("self-hosted identity endpoints fail closed without server secrets", async ({ request }) => {
  test.skip(isRemoteEnvironment, "This is the local identity-disabled contract.");
  const session = await request.get("/api/auth/get-session");
  const authorizationMetadata = await request.get("/.well-known/oauth-authorization-server");
  const stepUp = await request.post("/api/account/step-up", {
    data: { code: "123456", method: "totp" }
  });

  expect(session.status()).toBe(503);
  expect(authorizationMetadata.status()).toBe(503);
  expect(stepUp.status()).toBe(409);
});

test("a valid referral route signs a private cookie and preserves it on a transient attribution failure", async ({ page }) => {
  test.skip(isRemoteEnvironment, "This test intentionally simulates an unavailable API.");
  await page.goto("/r/PABCDEF1234567");
  await expect(page).toHaveURL(/\/(?:fr|en)\?ref=PABCDEF1234567$/);
  const cookie = (await page.context().cookies()).find((candidate) => candidate.name === "pressay_referral");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.context().clearCookies({ name: "pressay_referral" });
  await page.context().addCookies([{
    name: "pressay_referral",
    value: cookie!.value,
    url: "http://localhost:31971",
    httpOnly: true,
    secure: false,
    sameSite: "Lax"
  }]);

  const attributionStatus = await page.evaluate(async () => (await fetch("/api/referral/attribute", { method: "POST" })).status);
  expect(attributionStatus).toBe(503);
  expect((await page.context().cookies()).some((candidate) => candidate.name === "pressay_referral")).toBe(true);
});

test("an invalid referral route does not persist a cookie", async ({ page }) => {
  await page.goto("/r/INVALID-CODE");
  await expect(page).toHaveURL(/\/fr$/);
  expect((await page.context().cookies()).some((candidate) => candidate.name === "pressay_referral")).toBe(false);
});

test("remote staging exposes Better Auth and protects account step-up", async ({ page, request }) => {
  test.skip(!isRemoteEnvironment, "This contract requires a configured staging deployment.");

  const session = await request.get("/api/auth/get-session");
  const authorizationMetadata = await request.get("/.well-known/oauth-authorization-server");
  const stepUp = await request.post("/api/account/step-up", {
    data: { code: "123456", method: "totp" }
  });

  expect(session.status()).toBe(200);
  expect(await session.json()).toBeNull();
  expect(authorizationMetadata.status()).toBe(200);
  expect((await authorizationMetadata.json()).issuer).toBe(new URL(process.env.PLAYWRIGHT_BASE_URL!).origin);
  expect(stepUp.status()).toBe(401);

  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
});
