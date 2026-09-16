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
