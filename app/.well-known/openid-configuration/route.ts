import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";
import { betterAuthIsConfigured } from "@/lib/auth-env";

const metadata = oauthProviderOpenIdConfigMetadata(auth);

export const GET = betterAuthIsConfigured()
  ? metadata
  : () => Response.json({ error: "identity_provider_not_configured" }, { status: 503 });
