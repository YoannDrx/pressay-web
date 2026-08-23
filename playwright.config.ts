import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/+$/, "");
const commercialLaunchFixture = process.env.PLAYWRIGHT_COMMERCIAL_LAUNCH === "true";
const inheritedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] =>
    typeof entry[1] === "string"),
);
const localServerEnvironment = commercialLaunchFixture
  ? {
      ...inheritedEnvironment,
      PRESSAY_WEB_ENVIRONMENT: "production",
      PRESSAY_WEB_CANONICAL_ORIGIN: "https://press-say.app",
      PRESSAY_API_URL: "https://api.press-say.app/v1",
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_PROJECT_ID: "prj_0FmTMhNi5iA1hsLynK6Bh6mOJmvk",
    }
  : inheritedEnvironment;

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: remoteBaseURL || "http://127.0.0.1:31971",
    trace: "on-first-retry"
  },
  webServer: remoteBaseURL ? undefined : {
    command: "PRESSAY_REFERRAL_COOKIE_SECRET=playwright-referral-secret pnpm dev --hostname 127.0.0.1 --port 31971",
    env: localServerEnvironment,
    url: "http://127.0.0.1:31971",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }
  ]
});
