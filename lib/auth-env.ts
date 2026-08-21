const DEFAULT_APP_URL = "https://press-say.app";

export type IdentityProvider = "better-auth" | "clerk" | "disabled";

export function betterAuthURL(): string {
  return (process.env.BETTER_AUTH_URL || DEFAULT_APP_URL).replace(/\/+$/, "");
}

export function betterAuthIsConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
}

export function appleAuthIsConfigured(): boolean {
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  );
}

export function clerkIsConfigured(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}

export function identityProvider(): IdentityProvider {
  const requested = process.env.AUTH_PROVIDER?.trim().toLowerCase();
  if (requested === "better-auth") {
    return betterAuthIsConfigured() ? "better-auth" : "disabled";
  }
  if (requested === "clerk") {
    return clerkIsConfigured() ? "clerk" : "disabled";
  }
  if (betterAuthIsConfigured()) return "better-auth";
  if (clerkIsConfigured()) return "clerk";
  return "disabled";
}

export function trustedAuthOrigins(): string[] {
  const configured = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  const developmentOrigins = process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:3000", "http://localhost:31971"];
  return Array.from(new Set([
    betterAuthURL(),
    "https://appleid.apple.com",
    ...developmentOrigins,
    ...configured
  ]));
}

export function passkeyRelyingPartyID(): string {
  return process.env.BETTER_AUTH_PASSKEY_RP_ID
    || new URL(betterAuthURL()).hostname;
}
