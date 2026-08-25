import { expect, test } from "@playwright/test";
import { bootstrapWebAccount } from "../lib/account-bootstrap";
import { commercialDeploymentStatus } from "../lib/commercial-deployment";

const isRemoteEnvironment = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const requiredCommercialCapabilities = [
  "advanced_voice_bar",
  "app_profiles",
  "byok",
  "encrypted_sync",
  "pressay_cloud",
  "account_deletion",
  "stripe_billing",
];
const validatedCommercialCapabilities = new Set(
  (process.env.PRESSAY_PUBLIC_VALIDATED_CAPABILITIES ?? "")
    .split(",")
    .map((capability) => capability.trim())
    .filter(Boolean),
);
const isProScopeValidated = requiredCommercialCapabilities.every((capability) =>
  validatedCommercialCapabilities.has(capability),
);
const isCommercialLaunchEnabled =
  process.env.PLAYWRIGHT_COMMERCIAL_LAUNCH === "true" && isProScopeValidated;

const canonicalCommercialEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  PRESSAY_WEB_ENVIRONMENT: "production",
  PRESSAY_WEB_CANONICAL_ORIGIN: "https://press-say.app",
  PRESSAY_API_URL: "https://api.press-say.app/v1",
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_PROJECT_ID: "prj_0FmTMhNi5iA1hsLynK6Bh6mOJmvk",
};

test("commercial deployment boundary accepts only the canonical production graph", () => {
  expect(commercialDeploymentStatus(canonicalCommercialEnvironment)).toEqual({
    ready: true,
    environment: "production",
    reason: "ready",
  });

  const rejectedEnvironments = [
    { VERCEL_ENV: "preview" },
    { VERCEL_PROJECT_ID: "prj_wrong" },
    { PRESSAY_WEB_CANONICAL_ORIGIN: "https://staging.press-say.app" },
    { PRESSAY_API_URL: "https://api-staging.press-say.app/v1" },
  ];
  for (const override of rejectedEnvironments) {
    expect(
      commercialDeploymentStatus({ ...canonicalCommercialEnvironment, ...override }).ready,
    ).toBe(false);
  }
});

test("commercial requests bootstrap a web account without consuming a Mac slot", async () => {
  const requests: string[] = [];
  const fetcher = async (input: string | URL | Request) => {
    requests.push(String(input));
    return new Response(null, { status: 204 });
  };

  await expect(
    bootstrapWebAccount("https://api.press-say.app/v1", new Headers(), fetcher),
  ).resolves.toMatchObject({ status: 204 });
  expect(requests).toEqual([
    "https://api.press-say.app/v1/accounts/web-bootstrap",
  ]);
});

test("web bootstrap falls back only when the modern Cloud route is absent", async () => {
  const requests: string[] = [];
  const fetcher = async (input: string | URL | Request) => {
    requests.push(String(input));
    return new Response(null, { status: requests.length === 1 ? 404 : 204 });
  };

  await bootstrapWebAccount("https://legacy.example/v1", new Headers(), fetcher);
  expect(requests).toEqual([
    "https://legacy.example/v1/accounts/web-bootstrap",
    "https://legacy.example/v1/accounts/bootstrap",
  ]);
});

test("the documented Silero VAD URL resolves through an immutable versioned route", async ({
  request,
}) => {
  const legacy = await request.get("/silero_vad_v4.onnx", {
    headers: { host: "models.press-say.app" },
    maxRedirects: 0,
  });
  expect(legacy.status()).toBe(307);
  expect(legacy.headers().location).toBe(
    "https://models.press-say.app/pressay/silero-vad/v4/silero_vad_v4.onnx",
  );

  const versioned = await request.get(
    "/pressay/silero-vad/v4/silero_vad_v4.onnx",
    {
      headers: { host: "models.press-say.app" },
      maxRedirects: 0,
    },
  );
  expect(versioned.status()).toBe(308);
  expect(versioned.headers()["cache-control"]).toContain("immutable");
  expect(versioned.headers().location).toContain(
    "/YoannDrx/pressay/v2.0.0-beta.3/src-tauri/resources/models/silero_vad_v4.onnx",
  );
});

test("French landing exposes the product contract and metadata", async ({ page }) => {
  const response = await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Votre Mac");
  await expect(page.getByText("presse-papiers", { exact: false }).first()).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const offers = (JSON.parse(structuredData ?? "{}") as { offers?: Array<{ name: string }> })
    .offers ?? [];
  expect(offers.map((offer) => offer.name)).toEqual(
    isCommercialLaunchEnabled ? ["Free", "Pro monthly", "Pro annual"] : ["Free"],
  );
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("checkout result pages never grant Pro from a browser redirect", async ({ page }) => {
  await page.goto("/checkout/success");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "en cours de confirmation",
  );
  await expect(page.getByText("ne suffit jamais à accorder un droit")).toBeVisible();

  await page.goto("/checkout/cancel");
  await expect(page.getByText("dictée locale Free")).toBeVisible();
  await expect(page.getByText("BYOK")).toHaveCount(0);
});

test("landing navigation and compatibility marquee are accessible", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByLabel("Choisir la langue")).toContainText("FR");
  await expect(page.getByLabel("Applications compatibles")).toContainText("Slack");
  const brandIcons = page.locator(".app-logo-card .brand-icon");
  await expect(brandIcons).toHaveCount(26);
  await expect(brandIcons.first()).toHaveCSS("background-image", /data:image\/svg\+xml/);
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0);
});

test("desktop secure-input help URL resolves to localized private guidance", async ({
  page,
}) => {
  const response = await page.goto("/support/secure-input");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/(fr|en)\/support\/secure-input$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /secret|hors de portée/i }),
  ).toBeVisible();
  await expect(page.getByText(/Keychain|Trousseau macOS/).first()).toBeVisible();
});

test("processing routes stay explicit and keyboard operable", async ({ page }) => {
  await page.goto("/en");
  const routes = page.getByRole("group", { name: "Processing route" });
  const expectedRoutes = [
    "Local",
    ...(validatedCommercialCapabilities.has("apple_intelligence") ? ["Apple Intelligence"] : []),
    ...(validatedCommercialCapabilities.has("byok") ? ["BYOK"] : []),
    ...(validatedCommercialCapabilities.has("pressay_cloud") ? ["Pressay Cloud"] : []),
  ];
  await expect(routes.getByRole("button")).toHaveCount(expectedRoutes.length);
  await expect(routes.getByRole("button", { name: "Local" })).toHaveAttribute("aria-pressed", "true");
  for (const route of expectedRoutes) {
    await expect(routes.getByRole("button", { name: route, exact: true })).toBeVisible();
  }
  if (expectedRoutes.length === 1) {
    await expect(routes.getByRole("button", { name: "BYOK" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "One voice. One validated route." })).toBeVisible();
  } else if (expectedRoutes.includes("BYOK")) {
    await routes.getByRole("button", { name: "BYOK", exact: true }).click();
    await expect(routes.getByRole("button", { name: "BYOK", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".route-console-core strong")).toHaveText("BYOK");
    await expect(page.locator(".route-console")).toHaveAttribute("data-route", "byok");
  }
});

test("immersive motion has a complete reduced-motion fallback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.locator("[data-reveal]").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".route-console-signal i").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator(".story-sticky")).toHaveCSS("position", "relative");
  await expect(page.locator(".story-progress")).toHaveCSS("display", "none");
});

test("expanded legal pages expose identity, privacy and withdrawal routes", async ({ page }) => {
  await page.goto("/fr/legal");
  await expect(page.getByText("803 272 590 00024")).toBeVisible();
  await page.goto("/fr/privacy");
  await expect(page.getByRole("heading", { name: "Données exclues" })).toBeVisible();
  await page.goto("/fr/withdrawal");
  await expect(page.getByRole("heading", { name: "Droit de rétractation" })).toBeVisible();
});

test("locale-neutral commercial URLs resolve instead of returning 404", async ({
  page,
}) => {
  for (const path of ["support", "privacy", "terms"]) {
    const response = await page.goto(`/${path}`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/(fr|en)/${path}$`));
  }
});

test("English routes expose factual pricing and the current launch state", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Local stays free");
  await expect(page.getByRole("row", { name: /Pressay/ })).toContainText("€69");
  await expect(page.getByRole("row", { name: /Superwhisper/ })).toContainText("$249.99");
  if (isCommercialLaunchEnabled) {
    await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(0);
    const checkoutButtons = page.getByRole("button", { name: /€69|€7\.99/ });
    expect(await checkoutButtons.count()).toBeGreaterThan(0);
    await expect(checkoutButtons.first()).toBeDisabled();
    for (const consent of await page.getByRole("checkbox").all()) await consent.check();
    await expect(checkoutButtons.first()).toBeEnabled();
  } else {
    await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /€69|€7\.99/ })).toHaveCount(0);
    if (!isProScopeValidated) {
      await expect(page.getByText("The Pro scope will be published", { exact: false })).toBeVisible();
      await expect(page.getByText("Apple Intelligence and BYOK", { exact: true })).toHaveCount(0);
    }
  }
});

test("download page exposes the public release channel and checksum", async ({ page }) => {
  await page.goto("/fr/download");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/,
    }),
  ).toBeVisible();
  await expect(page.getByText("PUBLIC BETA")).toBeVisible();
  await expect(page.getByText(/Apple Silicon · arm64/)).toBeVisible();
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
  await expect(page.getByText("Aucun code d’accès n’est nécessaire.")).toBeVisible();
  await expect(page.getByRole("button", { name: /passkey/i })).toBeHidden();
  await page.getByText("Autre méthode", { exact: true }).click();
  await expect(page.getByRole("button", { name: /passkey/i })).toBeVisible();
});
