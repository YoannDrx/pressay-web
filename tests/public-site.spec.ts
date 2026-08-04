import { expect, test } from "@playwright/test";

test("French landing exposes the product contract and metadata", async ({ page }) => {
  const response = await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Maintiens Fn");
  await expect(page.getByText("presse-papiers", { exact: false }).first()).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("English routes and factual pricing are available", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("generous Free");
  await expect(page.getByRole("row", { name: /Pressay/ })).toContainText("€69");
  await expect(page.getByRole("row", { name: /Superwhisper/ })).toContainText("$249.99");
  await expect(page.getByRole("button", { name: "Try 14 days — €69/year" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Or €7.99/month" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Become Founding — €149" })).toBeVisible();
});

test("download page exposes the public stable and checksum", async ({ page }) => {
  await page.goto("/fr/download");
  await expect(page.getByText(/^v1\.2\.4$/)).toBeVisible();
  await expect(page.getByRole("link", { name: /SHA-256/ })).toHaveAttribute("href", /Pressay\.dmg\.sha256$/);
});

test("commercial UI fails closed before Clerk and Stripe are configured", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("bientôt disponible");
  const response = await page.request.post("/api/checkout", { data: { plan: "pro_byok", interval: "annual" } });
  expect(response.status()).toBe(503);
});

test("Clerk sign-in callback is handled by the catch-all route", async ({ page }) => {
  await page.goto("/sign-in/sso-callback");
  await expect(page).toHaveTitle(/Pressay/);
  await expect(page.getByRole("heading", { name: "Connexion bientôt disponible." })).toBeVisible();
});
