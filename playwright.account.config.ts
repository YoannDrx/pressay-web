import { defineConfig, devices } from "@playwright/test";
const database = process.env.WEB_TEST_DATABASE_URL;
if (!database) throw new Error("WEB_TEST_DATABASE_URL is required");
const url = new URL(database);
if (
  !["127.0.0.1", "localhost"].includes(url.hostname) ||
  url.pathname !== "/pressay_web_e2e"
)
  throw new Error("Use an isolated local database");
const env = {
  DATABASE_URL: database,
  AUTH_PROVIDER: "better-auth",
  BETTER_AUTH_SECRET: "local-test-auth-secret-at-least-32-characters",
  GOOGLE_CLIENT_ID: "local-test",
  GOOGLE_CLIENT_SECRET: "local-test",
  BETTER_AUTH_URL: "http://127.0.0.1:31972",
  BETTER_AUTH_TRUSTED_ORIGINS: "http://127.0.0.1:31972,http://localhost:31972",
  BETTER_AUTH_PASSKEY_RP_ID: "localhost",
  PRESSAY_API_URL: "http://127.0.0.1:31973/v1",
  PRESSAY_INTERNAL_JWT_SECRET: "local-test-proxy-secret-at-least-32-characters",
  NEXT_DIST_DIR: ".next-account",
};
Object.assign(process.env, env);
export default defineConfig({
  testDir: "./tests",
  testMatch: "account-auth.spec.ts",
  workers: 1,
  timeout: 60000,
  use: { baseURL: "http://127.0.0.1:31972" },
  webServer: [
    {
      command: "node tests/fixtures/cloud-server.mjs",
      url: "http://127.0.0.1:31973/health",
      reuseExistingServer: false,
    },
    {
      command:
        "bun tests/fixtures/auth-setup.ts && pnpm dev --hostname 127.0.0.1 --port 31972",
      env,
      url: "http://127.0.0.1:31972/fr",
      timeout: 120000,
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
