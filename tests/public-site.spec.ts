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
      commercialDeploymentStatus({
        ...canonicalCommercialEnvironment,
        ...override,
      }).ready,
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

  await bootstrapWebAccount(
    "https://legacy.example/v1",
    new Headers(),
    fetcher,
  );
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

test("French landing exposes the product contract and metadata", async ({
  page,
}) => {
  const response = await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Là où tu peux écrire, tu peux parler.",
  );
  for (const heading of [
    "Appuie, parle, c’est écrit.",
    "Dicte en français, envoie en anglais.",
    "Une voix, la bonne forme.",
    "Ta voix reste sur ton ordinateur.",
    "Dans toutes tes apps, sur Mac et sur PC.",
    "Comparer avant de choisir.",
    "Questions fréquentes",
  ])
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  // Mac and PC shortcuts of both shortcuts are spelled out.
  await expect(page.locator("#how kbd.keys")).toHaveCount(2);
  await expect(page.locator("#translate kbd.keys")).toHaveCount(2);
  await expect(
    page.getByText("presse-papiers", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    1,
  );
  const structuredData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  ) as {
    "@type"?: string;
    operatingSystem?: string;
    offers?: Array<{ name: string }>;
  };
  expect(structuredData["@type"]).toBe("SoftwareApplication");
  expect(structuredData.operatingSystem).toContain("macOS 14");
  expect((structuredData.offers ?? []).map((offer) => offer.name)).toEqual(
    isCommercialLaunchEnabled
      ? ["Free", "Pro monthly", "Pro annual"]
      : ["Free"],
  );
  expect(response?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  await expect(page.locator("footer")).toContainText("macOS 14+ · Windows 10/11");
  // The first Tab reaches the skip link, which becomes visible.
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toHaveText("Aller au contenu");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("the download call to action follows the visitor's system", async ({
  browser,
}) => {
  const userAgents = {
    macos:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    windows:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  };
  for (const [platform, userAgent] of Object.entries(userAgents)) {
    const context = await browser.newContext({ userAgent });
    try {
      const page = await context.newPage();
      await page.goto("/en");
      const hero = page.locator(".hero");
      // A Windows download is only offered once a release ships installers.
      const windowsReleased =
        (await hero.getByText("Windows is coming soon").count()) === 0;
      const expected =
        platform === "windows" && windowsReleased ? "windows" : "macos";
      const primary = hero.locator(".button-primary");
      await expect(primary).toHaveText(
        expected === "windows" ? "Download for Windows" : "Download for macOS",
      );
      await expect(primary).toHaveAttribute("href", `/en/download#${expected}`);
      if (windowsReleased)
        await expect(hero.locator("a.hero-other")).toHaveAttribute(
          "href",
          `/en/download#${expected === "windows" ? "macos" : "windows"}`,
        );
      // The closing choice shows both systems, the visitor's own first.
      const choices = page.locator(".cta-platforms > li");
      await expect(choices).toHaveCount(2);
      await expect(choices.first()).toHaveClass(/is-detected/);
      await expect(choices.first().locator("h3")).toContainText(
        expected === "windows" ? "Windows" : "macOS",
      );
    } finally {
      await context.close();
    }
  }
});

test("checkout result pages never grant Pro from a browser redirect", async ({
  page,
}) => {
  await page.goto("/fr");
  await page.goto("/checkout/success");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "en cours de confirmation",
  );
  await expect(
    page.getByText("ne suffit jamais à accorder un droit"),
  ).toBeVisible();

  await page.goto("/checkout/cancel");
  await expect(page.getByText("dictée locale Free")).toBeVisible();
  await expect(page.getByText("BYOK")).toHaveCount(0);
});

test("landing navigation and compatibility wall are accessible", async ({
  page,
}) => {
  await page.goto("/fr");
  await expect(page.getByLabel("Choisir la langue")).toContainText("FR");
  const wall = page.getByRole("list", { name: "Applications compatibles" });
  await expect(wall).toContainText("Slack");
  await expect(wall).toContainText("Windows Terminal");
  const brandIcons = page.locator(".app-logo .brand-icon");
  await expect(brandIcons).toHaveCount(22);
  // Logos are cacheable files, not data URIs inflating every landing response.
  await expect(brandIcons.first()).toHaveAttribute(
    "src",
    /^\/brand-icons\/(logos|simple)-[a-z-]+\.svg$/,
  );
  await brandIcons.first().scrollIntoViewIfNeeded();
  await expect
    .poll(() => brandIcons.first().evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  const icon = await page.request.get("/brand-icons/logos-slack-icon.svg");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toContain("image/svg+xml");
  expect((await page.request.get("/brand-icons/logos-unknown.svg")).status()).toBe(404);
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
  await expect(
    page.getByText(/Keychain|Trousseau macOS/).first(),
  ).toBeVisible();
});

test("processing routes list only validated routes, Local first", async ({
  page,
}) => {
  await page.goto("/en");
  const routes = page.getByRole("list", { name: "Available processing routes" });
  const expectedRoutes = [
    "Local",
    ...(validatedCommercialCapabilities.has("apple_intelligence")
      ? ["Apple Intelligence"]
      : []),
    ...(validatedCommercialCapabilities.has("byok") ? ["BYOK"] : []),
    ...(validatedCommercialCapabilities.has("pressay_cloud")
      ? ["Pressay Cloud"]
      : []),
  ];
  await expect(routes.getByRole("listitem")).toHaveCount(expectedRoutes.length);
  await expect(routes.getByRole("listitem").first()).toContainText("Default");
  for (const [index, route] of expectedRoutes.entries())
    await expect(routes.getByRole("listitem").nth(index).locator("strong")).toHaveText(route);
});

test("the hero demonstration can be paused and has a reduced-motion fallback", async ({
  page,
}) => {
  await page.goto("/en");
  const demo = page.locator(".demo");
  await expect(demo.getByRole("img")).toHaveAttribute("aria-label", /Demonstration/);
  // The loop starts on its own and can be paused (WCAG 2.2.2).
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  // Reduced motion shows the finished first scene and no animation control.
  await expect(demo).toHaveAttribute("data-phase", "written");
  await expect(demo.locator(".demo-text")).toContainText("Hi Sam, can we move the product review");
  await expect(demo.locator(".demo-text span").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toHaveCount(0);
  await expect(demo.locator(".voice-wave i").first()).toHaveCSS("animation-name", "none");
});

test("expanded legal pages expose identity, privacy and withdrawal routes", async ({
  page,
}) => {
  await page.goto("/fr/legal");
  await expect(page.getByText("803 272 590 00024")).toBeVisible();
  await page.goto("/fr/privacy");
  await expect(
    page.getByRole("heading", { name: "Données exclues" }),
  ).toBeVisible();
  await page.goto("/fr/withdrawal");
  await expect(
    page.getByRole("heading", { name: "Droit de rétractation" }),
  ).toBeVisible();
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

test("English routes expose factual pricing and the current launch state", async ({
  page,
}) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Local stays free",
  );
  await expect(page.getByRole("row", { name: /Pressay/ })).toContainText("€69");
  await expect(page.getByRole("row", { name: /Superwhisper/ })).toContainText(
    "$249.99",
  );
  if (isCommercialLaunchEnabled) {
    await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(0);
    const checkoutButtons = page.getByRole("button", { name: /€69|€7\.99/ });
    expect(await checkoutButtons.count()).toBeGreaterThan(0);
    await expect(checkoutButtons.first()).toBeDisabled();
    for (const consent of await page.getByRole("checkbox").all())
      await consent.check();
    await expect(checkoutButtons.first()).toBeEnabled();
  } else {
    await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /€69|€7\.99/ })).toHaveCount(
      0,
    );
    if (!isProScopeValidated)
      await expect(
        page.getByText("Subscriptions open once each one has passed", {
          exact: false,
        }),
      ).toBeVisible();
  }
  // The real Pro scope is always listed, prices include VAT.
  await expect(
    page.getByText("BYOK (your own key) and Apple Intelligence on Mac", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Up to 3 devices (Mac or PC)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Encrypted sync between your devices", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("incl. VAT").first()).toBeVisible();
});

test("download page exposes the public release channel and checksum", async ({
  page,
}) => {
  await page.goto("/fr/download");
  // Playwright's desktop profile reports a Windows user agent, which
  // preselects the Windows tab; the release checks below are the Mac's.
  await page.getByRole("tab", { name: "macOS" }).click();
  // Scope to the macOS panel: a published Windows release has its own
  // channel label and checksum links.
  const macOS = page.locator("#macos");
  const version = macOS.locator(".download-card h2");
  await expect(version).toHaveText(/^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?$/);
  const tag = await version.innerText();
  await expect(
    macOS.getByText(tag.includes("-") ? "PUBLIC BETA" : "PUBLIC STABLE"),
  ).toBeVisible();
  await expect(macOS.getByRole("link", { name: /SHA-256/ })).toHaveAttribute(
    "href",
    `https://github.com/YoannDrx/pressay/releases/download/${tag}/Pressay.dmg.sha256`,
  );
  await expect(macOS.getByText(/Apple Silicon · arm64/)).toBeVisible();
  await expect(macOS.getByRole("link", { name: /SHA-256/ })).toHaveAttribute(
    "href",
    /Pressay\.dmg\.sha256$/,
  );
  await expect(page.getByRole("tab", { name: "Windows" })).toBeVisible();
});

test("commercial UI fails closed before identity and Stripe are configured", async ({
  page,
}) => {
  test.skip(isRemoteEnvironment, "This is the local fail-closed contract.");
  await page.goto("/sign-in?locale=fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "bientôt disponible",
  );
  const response = await page.request.post("/api/checkout", {
    data: { plan: "pro_byok", interval: "annual" },
  });
  expect(response.status()).toBe(503);
});

test("legacy sign-in callback remains harmless while identity is disabled", async ({
  page,
}) => {
  test.skip(
    isRemoteEnvironment,
    "This is the local identity-disabled contract.",
  );
  await page.goto("/sign-in/sso-callback?locale=fr");
  await expect(page).toHaveTitle(/Pressay/);
  await expect(
    page.getByRole("heading", { name: "Connexion bientôt disponible." }),
  ).toBeVisible();
});

test("local sign-up route is available", async ({ page }) => {
  test.skip(
    isRemoteEnvironment,
    "This is the local identity-disabled contract.",
  );
  await page.goto("/sign-up?locale=fr");
  await expect(
    page.getByRole("heading", { name: "Connexion bientôt disponible." }),
  ).toBeVisible();
});

test("self-hosted identity endpoints fail closed without server secrets", async ({
  request,
}) => {
  test.skip(
    isRemoteEnvironment,
    "This is the local identity-disabled contract.",
  );
  const session = await request.get("/api/auth/get-session");
  const authorizationMetadata = await request.get(
    "/.well-known/oauth-authorization-server",
  );
  const stepUp = await request.post("/api/account/step-up", {
    headers: {
      origin: new URL(
        process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:31971",
      ).origin,
    },
    data: { code: "123456", method: "totp" },
  });

  expect(session.status()).toBe(503);
  expect(authorizationMetadata.status()).toBe(503);
  expect(stepUp.status()).toBe(409);
});

test("a valid referral route signs a private cookie and preserves it on a transient attribution failure", async ({
  page,
}) => {
  test.skip(
    isRemoteEnvironment,
    "This test intentionally simulates an unavailable API.",
  );
  await page.goto("/r/PABCDEF1234567");
  await expect(page).toHaveURL(/\/(?:fr|en)\?ref=PABCDEF1234567$/);
  const cookie = (await page.context().cookies()).find(
    (candidate) => candidate.name === "pressay_referral",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.context().clearCookies({ name: "pressay_referral" });
  await page.context().addCookies([
    {
      name: "pressay_referral",
      value: cookie!.value,
      url: "http://localhost:31971",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const attributionStatus = await page.evaluate(
    async () =>
      (await fetch("/api/referral/attribute", { method: "POST" })).status,
  );
  expect(attributionStatus).toBe(503);
  expect(
    (await page.context().cookies()).some(
      (candidate) => candidate.name === "pressay_referral",
    ),
  ).toBe(true);
});

test("an invalid referral route does not persist a cookie", async ({
  page,
}) => {
  await page.goto("/r/INVALID-CODE");
  await expect(page).toHaveURL(/\/fr$/);
  expect(
    (await page.context().cookies()).some(
      (candidate) => candidate.name === "pressay_referral",
    ),
  ).toBe(false);
});

test("remote staging exposes Better Auth and protects account step-up", async ({
  page,
  request,
}) => {
  test.skip(
    !isRemoteEnvironment,
    "This contract requires a configured staging deployment.",
  );

  const session = await request.get("/api/auth/get-session");
  const authorizationMetadata = await request.get(
    "/.well-known/oauth-authorization-server",
  );
  const stepUp = await request.post("/api/account/step-up", {
    headers: {
      origin: new URL(
        process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:31971",
      ).origin,
    },
    data: { code: "123456", method: "totp" },
  });

  expect(session.status()).toBe(200);
  expect(await session.json()).toBeNull();
  expect(authorizationMetadata.status()).toBe(200);
  expect((await authorizationMetadata.json()).issuer).toBe(
    new URL(process.env.PLAYWRIGHT_BASE_URL!).origin,
  );
  expect(stepUp.status()).toBe(401);

  await page.goto("/sign-in?locale=fr");
  await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  await expect(
    page.getByText("Aucun code d’accès n’est nécessaire."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /passkey/i })).toBeHidden();
  await page.getByText("Autre méthode", { exact: true }).click();
  await expect(page.getByRole("button", { name: /passkey/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "conditions générales d’utilisation et de vente" }),
  ).toHaveAttribute("href", "/fr/terms");
});

test("Free and Pro stay centered with equal widths across public pages", async ({
  page,
}) => {
  for (const route of ["/fr", "/en/pricing"]) {
    await page.goto(route);
    const grid = page.locator(".pricing-grid");
    const box = await grid.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize()!;
    expect(
      Math.abs(box!.x + box!.width / 2 - viewport.width / 2),
    ).toBeLessThanOrEqual(2);
    const cards = await grid.locator(".price-card").all();
    expect(cards).toHaveLength(2);
    const [free, pro] = await Promise.all(
      cards.map((card) => card.boundingBox()),
    );
    expect(Math.abs(free!.width - pro!.width)).toBeLessThanOrEqual(1);
    if (viewport.width < 800) expect(pro!.y).toBeGreaterThan(free!.y);
    else expect(Math.abs(free!.y - pro!.y)).toBeLessThanOrEqual(1);
    await expect(page.locator("footer .site-brand img")).toBeAttached();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("unknown and malformed URLs answer a localized 404, never a 500", async ({
  page,
  request,
}) => {
  const missing = await page.goto("/en/does-not-exist");
  expect(missing?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "This page does not exist.",
  );
  for (const path of [
    "/download/pressay%5C%5C%5C",
    "/fr/privacy%5C",
    "/fr/not-a-legal-page",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
  }
});

test("pages declare their language, canonical URL and alternates", async ({
  page,
}) => {
  await page.goto("/en/pricing");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/en\/pricing$/,
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="fr"]'),
  ).toHaveAttribute("href", /\/fr\/pricing$/);
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveAttribute("href", /\/fr\/pricing$/);
  await expect(page).toHaveTitle("Pricing · Pressay");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "en_US",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://press-say.app/en/pricing",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Free stays unlimited locally/,
  );
  await page.goto("/fr/privacy");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/fr\/privacy$/,
  );
});

test("language switch keeps the current page", async ({ page }) => {
  await page.goto("/fr/security");
  const english = page.locator(".language-switch a[hreflang=en]");
  if (await english.isVisible())
    await expect(english).toHaveAttribute("href", "/en/security");
  else
    await expect(
      page.locator(".mobile-menu a[hreflang=en]"),
    ).toHaveAttribute("href", "/en/security");
});

test("scripts run under a per-request nonce without unsafe-inline", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text()))
      errors.push(message.text());
  });
  const first = await page.goto("/fr");
  const second = await page.request.get("/fr");
  const policy = first?.headers()["content-security-policy"] ?? "";
  const script = policy.split(";").find((part) => part.trim().startsWith("script-src")) ?? "";
  expect(script).toContain("'nonce-");
  expect(script).not.toContain("unsafe-inline");
  expect(policy).not.toContain("clerk");
  expect(second.headers()["content-security-policy"]).not.toBe(policy);
  for (const path of ["/en/pricing", "/fr/download", "/fr/privacy", "/sign-in?locale=fr", "/en/nope"])
    await page.goto(path);
  expect(errors).toEqual([]);
});

test("withdrawal page offers the model withdrawal form", async ({ page }) => {
  await page.goto("/fr/withdrawal");
  await expect(
    page.getByRole("heading", { name: "Formulaire type de rétractation" }),
  ).toBeVisible();
  await page.goto("/en/withdrawal");
  await expect(
    page.getByRole("heading", { name: "Model withdrawal form" }),
  ).toBeVisible();
});

test("public pages make no session or authenticated request", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));
  for (const path of ["/fr", "/en", "/fr/pricing", "/en/download", "/fr/terms"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(
    requests.filter((path) => /^\/api\/(account|auth|pressay)\//.test(path)),
  ).toEqual([]);
  await expect(page.locator(".session-menu")).toHaveCount(0);
});

test("locale-less entry points follow the visitor's language once", async ({
  browser,
}) => {
  const english = await browser.newContext({ locale: "en-GB" });
  const french = await browser.newContext({ locale: "fr-FR" });
  const german = await browser.newContext({ locale: "de-DE" });
  try {
    const englishPage = await english.newPage();
    await englishPage.goto("/");
    await expect(englishPage).toHaveURL(/\/en$/);
    await englishPage.goto("/download");
    await expect(englishPage).toHaveURL(/\/en\/download$/);
    // Shared localized links are never redirected...
    await englishPage.goto("/fr/pricing");
    await expect(englishPage).toHaveURL(/\/fr\/pricing$/);
    // ...and the language the visitor then reads is remembered.
    await englishPage.goto("/");
    await expect(englishPage).toHaveURL(/\/fr$/);

    const frenchPage = await french.newPage();
    await frenchPage.goto("/?ref=ABC");
    await expect(frenchPage).toHaveURL(/\/fr\?ref=ABC$/);
    await frenchPage.goto("/?locale=en");
    await expect(frenchPage).toHaveURL(/\/en$/);

    const germanPage = await german.newPage();
    await germanPage.goto("/");
    await expect(germanPage).toHaveURL(/\/fr$/);
  } finally {
    await Promise.all([english.close(), french.close(), german.close()]);
  }
});

test("crawlers get the x-default page whatever their language header", async ({
  request,
}) => {
  const response = await request.get("/", {
    maxRedirects: 0,
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(/\/fr$/);
  expect(response.headers()["vary"]).toContain("Accept-Language");
});
