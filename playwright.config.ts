import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/+$/, "");

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
    url: "http://127.0.0.1:31971",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }
  ]
});
