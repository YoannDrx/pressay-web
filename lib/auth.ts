import { oauthProvider } from "@better-auth/oauth-provider";
import { passkey } from "@better-auth/passkey";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { jwt, twoFactor } from "better-auth/plugins";
import { importPKCS8, SignJWT } from "jose";
import { Pool } from "pg";
import {
  appleAuthIsConfigured,
  betterAuthIsConfigured,
  betterAuthURL,
  passkeyRelyingPartyID,
  trustedAuthOrigins
} from "@/lib/auth-env";

const configured = betterAuthIsConfigured();
const appURL = betterAuthURL();
const fallbackDatabaseURL = "postgresql://pressay:pressay@127.0.0.1:1/pressay_auth_disabled";
const fallbackSecret = "pressay-disabled-auth-secret-that-is-never-served";
const macOSClientID = process.env.PRESSAY_MACOS_OAUTH_CLIENT_ID || "w9ckUgrcFp7H7wNV";
const apiResource = process.env.PRESSAY_OAUTH_RESOURCE || "https://api.press-say.app";

async function generateAppleClientSecret(): Promise<string> {
  const clientID = process.env.APPLE_CLIENT_ID;
  const teamID = process.env.APPLE_TEAM_ID;
  const keyID = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientID || !teamID || !keyID || !privateKey) {
    throw new Error("Sign in with Apple is not configured");
  }
  const signingKey = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1_000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyID })
    .setIssuer(teamID)
    .setSubject(clientID)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(signingKey);
}

export const authOptions = {
  appName: "Pressay",
  baseURL: appURL,
  basePath: "/api/auth",
  secret: configured ? process.env.BETTER_AUTH_SECRET : fallbackSecret,
  database: new Pool({
    connectionString: configured ? process.env.DATABASE_URL : fallbackDatabaseURL,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 5_000
  }),
  trustedOrigins: trustedAuthOrigins(),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "disabled.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "disabled"
    },
    ...(appleAuthIsConfigured() ? {
      apple: async () => ({
        clientId: process.env.APPLE_CLIENT_ID as string,
        clientSecret: await generateAppleClientSecret(),
        appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER
      })
    } : {})
  },
  account: {
    modelName: "auth_accounts",
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "apple"],
      allowDifferentEmails: false,
      allowUnlinkingAll: false
    }
  },
  user: { modelName: "auth_users" },
  session: {
    modelName: "auth_sessions",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 10,
    cookieCache: { enabled: false }
  },
  verification: {
    modelName: "auth_verifications",
    storeIdentifier: "hashed"
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
      "/two-factor/verify-backup-code": { window: 60, max: 5 }
    }
  },
  advanced: {
    cookiePrefix: "pressay_auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"]
    }
  },
  disabledPaths: ["/token"],
  plugins: [
    twoFactor({
      issuer: "Pressay",
      allowPasswordless: true,
      twoFactorCookieMaxAge: 10 * 60,
      trustDeviceMaxAge: 30 * 24 * 60 * 60,
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 8,
        durationSeconds: 15 * 60
      },
      schema: {
        twoFactor: { modelName: "auth_two_factors" }
      }
    }),
    passkey({
      rpID: passkeyRelyingPartyID(),
      rpName: "Pressay",
      origin: trustedAuthOrigins(),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required"
      },
      schema: {
        passkey: { modelName: "auth_passkeys" }
      }
    }),
    jwt({
      disableSettingJwtHeader: true,
      jwt: {
        issuer: appURL,
        audience: apiResource,
        expirationTime: "15m"
      },
      jwks: {
        rotationInterval: 60 * 60 * 24 * 30,
        gracePeriod: 60 * 60 * 24 * 45,
        keyPairConfig: { alg: "EdDSA", crv: "Ed25519" }
      },
      schema: {
        jwks: { modelName: "auth_jwks" }
      }
    }),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/oauth/consent",
      scopes: ["openid", "profile", "email", "offline_access"],
      resources: configured ? [{
        identifier: apiResource,
        name: "Pressay API",
        accessTokenTtl: 15 * 60,
        refreshTokenTtl: 30 * 24 * 60 * 60,
        allowedScopes: ["openid", "profile", "email", "offline_access"]
      }] : [],
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
        openidConfig: true
      },
      customAccessTokenClaims: ({ user }) => ({
        email: user?.email,
        email_verified: user?.emailVerified === true,
        name: user?.name
      }),
      schema: {
        oauthClient: { modelName: "auth_oauth_clients" },
        oauthResource: { modelName: "auth_oauth_resources" },
        oauthClientResource: { modelName: "auth_oauth_client_resources" },
        oauthRefreshToken: { modelName: "auth_oauth_refresh_tokens" },
        oauthAccessToken: { modelName: "auth_oauth_access_tokens" },
        oauthConsent: { modelName: "auth_oauth_consents" },
        oauthClientAssertion: { modelName: "auth_oauth_client_assertions" }
      }
    })
  ]
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);
