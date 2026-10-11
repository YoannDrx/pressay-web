import { oauthProvider } from "@better-auth/oauth-provider";
import { passkey } from "@better-auth/passkey";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { jwt, twoFactor } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { Pool } from "pg";
import { generateAppleClientSecret } from "@/lib/apple";
import { appleDeletionAcknowledged } from "@/lib/account-deletion";
import { secondFactorChangeGuard } from "@/lib/second-factor-guard";
import {
  appleAuthIsConfigured,
  betterAuthIsConfigured,
  betterAuthURL,
  passkeyRelyingPartyID,
  trustedAuthOrigins,
} from "@/lib/auth-env";

const configured = betterAuthIsConfigured();
const appURL = betterAuthURL();
const fallbackDatabaseURL =
  "postgresql://pressay:pressay@127.0.0.1:1/pressay_auth_disabled";
const fallbackSecret = "pressay-disabled-auth-secret-that-is-never-served";
const macOSClientID =
  process.env.PRESSAY_MACOS_OAUTH_CLIENT_ID || "w9ckUgrcFp7H7wNV";
const apiResource =
  process.env.PRESSAY_OAUTH_RESOURCE || "https://api.press-say.app";

const authDatabase = new Pool({
  connectionString: configured ? process.env.DATABASE_URL : fallbackDatabaseURL,
  max: 5,
  idleTimeoutMillis: 20_000,
  // Allow a suspended database to resume before giving up on authentication.
  connectionTimeoutMillis: 15_000,
});
authDatabase.on("error", () => {
  // pg removes the failed idle client. Handle the event without logging user data
  // or terminating every in-flight request in this server process.
  console.error("[auth] idle_database_connection_failed");
});

export const authOptions = {
  appName: "Pressay",
  baseURL: appURL,
  basePath: "/api/auth",
  secret: configured ? process.env.BETTER_AUTH_SECRET : fallbackSecret,
  database: authDatabase,
  trustedOrigins: trustedAuthOrigins(),
  // Errors raised before the OAuth state is known (expired state cookie,
  // cancelled consent without state) land on the sign-in page, which explains
  // them, instead of Better Auth's bare /api/auth/error page.
  onAPIError: { errorURL: `${appURL}/sign-in` },
  socialProviders: {
    google: {
      clientId:
        process.env.GOOGLE_CLIENT_ID || "disabled.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "disabled",
    },
    ...(appleAuthIsConfigured()
      ? {
          apple: async () => ({
            clientId: process.env.APPLE_CLIENT_ID as string,
            clientSecret: await generateAppleClientSecret(),
            appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER,
          }),
        }
      : {}),
  },
  account: {
    modelName: "auth_accounts",
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "apple"],
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },
  user: {
    modelName: "auth_users",
    deleteUser: {
      enabled: true,
      beforeDelete: async (user, request) => {
        // The provider also exposes /delete-user. Always enqueue Cloud cleanup first,
        // including calls made directly to that endpoint.
        const { pressayAPI } = await import("@/lib/pressay-api");
        const acknowledged = appleDeletionAcknowledged(request);
        const result = await pressayAPI(
          acknowledged ? "me?acknowledgeAppleSubscription=true" : "me",
          { method: "DELETE" },
        );
        if (result.status === 409) {
          const payload = await result.json().catch(() => null);
          const code =
            typeof payload?.error === "string"
              ? payload.error
              : payload?.error?.code;
          if (code === "apple_subscription_active")
            throw new APIError("CONFLICT", {
              code: "APPLE_SUBSCRIPTION_ACTIVE",
              message: "An Apple subscription is still active",
            });
        }
        if (!result.ok && result.status !== 404)
          throw new APIError("SERVICE_UNAVAILABLE", {
            message: "Account cleanup is temporarily unavailable",
          });
        // Cloud cleanup is queued: revoke Sign in with Apple (best effort)
        // and remove passkeys, authenticators and OAuth grants before Better
        // Auth deletes the sessions, accounts and user row.
        const { purgeIdentityDependents } = await import(
          "@/lib/identity-deletion-store"
        );
        await purgeIdentityDependents(user.id);
      },
    },
  },
  session: {
    modelName: "auth_sessions",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 10,
    // A short signed cache avoids one database read per navigation refresh.
    // Sensitive endpoints (deletion, second factor) bypass it.
    cookieCache: { enabled: true, maxAge: 60 },
  },
  verification: {
    modelName: "auth_verifications",
    storeIdentifier: "hashed",
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "auth_rate_limits",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/social": { window: 60, max: 10 },
      "/sign-in/passkey": { window: 60, max: 10 },
      "/two-factor/verify-totp": { window: 60, max: 10 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
      "/two-factor/disable": { window: 60, max: 10 },
      "/two-factor/generate-backup-codes": { window: 60, max: 10 },
      "/delete-user": { window: 60, max: 10 },
    },
  },
  advanced: {
    cookiePrefix: "pressay_auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      // Sign in with Apple returns through a cross-site form_post. Scope this
      // exception to the short-lived signed OAuth state cookie; session
      // cookies keep Better Auth's SameSite=Lax default.
      state: {
        attributes: {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        },
      },
    },
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },
  disabledPaths: ["/token"],
  plugins: [
    secondFactorChangeGuard(),
    twoFactor({
      issuer: "Pressay",
      allowPasswordless: true,
      twoFactorCookieMaxAge: 10 * 60,
      trustDeviceMaxAge: 30 * 24 * 60 * 60,
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 8,
        durationSeconds: 15 * 60,
      },
      schema: {
        twoFactor: { modelName: "auth_two_factors" },
      },
    }),
    passkey({
      rpID: passkeyRelyingPartyID(),
      rpName: "Pressay",
      origin: trustedAuthOrigins(),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      schema: {
        passkey: { modelName: "auth_passkeys" },
      },
    }),
    jwt({
      disableSettingJwtHeader: true,
      jwt: {
        issuer: appURL,
        audience: apiResource,
        expirationTime: "15m",
      },
      jwks: {
        rotationInterval: 60 * 60 * 24 * 30,
        gracePeriod: 60 * 60 * 24 * 45,
        keyPairConfig: { alg: "EdDSA", crv: "Ed25519" },
      },
      schema: {
        jwks: { modelName: "auth_jwks" },
      },
    }),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/oauth/consent",
      scopes: ["openid", "profile", "email", "offline_access"],
      resources: configured
        ? [
            {
              identifier: apiResource,
              name: "Pressay API",
              accessTokenTtl: 15 * 60,
              refreshTokenTtl: 30 * 24 * 60 * 60,
              allowedScopes: ["openid", "profile", "email", "offline_access"],
            },
          ]
        : [],
      resourceSeedMode: "insertOnly",
      cachedResources: new Set([apiResource]),
      enforcePerClientResources: true,
      cachedTrustedClients: new Set([macOSClientID]),
      accessTokenExpiresIn: 15 * 60,
      refreshTokenExpiresIn: 30 * 24 * 60 * 60,
      grantTypes: ["authorization_code", "refresh_token"],
      allowDynamicClientRegistration: false,
      allowUnauthenticatedClientRegistration: false,
      silenceWarnings: {
        oauthAuthServerConfig: true,
        openidConfig: true,
      },
      customAccessTokenClaims: ({ user }) => ({
        email: user?.email,
        email_verified: user?.emailVerified === true,
        name: user?.name,
      }),
      schema: {
        oauthClient: { modelName: "auth_oauth_clients" },
        oauthResource: { modelName: "auth_oauth_resources" },
        oauthClientResource: { modelName: "auth_oauth_client_resources" },
        oauthRefreshToken: { modelName: "auth_oauth_refresh_tokens" },
        oauthAccessToken: { modelName: "auth_oauth_access_tokens" },
        oauthConsent: { modelName: "auth_oauth_consents" },
        oauthClientAssertion: { modelName: "auth_oauth_client_assertions" },
      },
    }),
  ],
} satisfies BetterAuthOptions;

function createAuth() {
  return betterAuth(authOptions);
}
type Auth = ReturnType<typeof createAuth>;
let currentAuth: Auth | null = null;

/**
 * Better Auth initializes once per instance and memoizes the result. Its
 * initialization reads the database (OAuth resource seeding), so a suspended
 * Neon branch that times out during a cold start used to leave a rejected
 * promise behind: unhandled when no request awaited it yet (terminating the
 * Node.js process) and permanently failing every later request otherwise.
 * Observe the rejection immediately and let the next request start over.
 */
function authInstance(): Auth {
  if (currentAuth) return currentAuth;
  const created = createAuth();
  currentAuth = created;
  created.$context.catch((error: unknown) => {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "unknown";
    console.error("[auth] initialization_failed", code);
    if (currentAuth === created) currentAuth = null;
  });
  return created;
}

export const auth: Auth = new Proxy({} as Auth, {
  get: (_target, property) => Reflect.get(authInstance(), property),
  has: (_target, property) => Reflect.has(authInstance(), property),
});
