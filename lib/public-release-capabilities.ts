import "server-only";

import { commercialDeploymentStatus } from "@/lib/commercial-deployment";

export const publicCapabilityIds = [
  "advanced_voice_bar",
  "app_profiles",
  "apple_intelligence",
  "byok",
  "encrypted_sync",
  "pressay_cloud",
  "account_deletion",
  "stripe_billing",
] as const;

export type PublicCapabilityId = (typeof publicCapabilityIds)[number];
export type PublicProcessingRoute = "local" | "apple" | "byok" | "cloud";

const commercialLaunchRequirements = [
  "advanced_voice_bar",
  "app_profiles",
  "byok",
  "encrypted_sync",
  "pressay_cloud",
  "account_deletion",
  "stripe_billing",
] as const satisfies readonly PublicCapabilityId[];

function validatedCapabilities(): Set<PublicCapabilityId> {
  const allowlist = new Set<string>(publicCapabilityIds);
  return new Set(
    (process.env.PRESSAY_PUBLIC_VALIDATED_CAPABILITIES ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is PublicCapabilityId => allowlist.has(value)),
  );
}

export function publicReleaseCapabilities() {
  const validated = validatedCapabilities();
  const deployment = commercialDeploymentStatus();
  const processingRoutes: PublicProcessingRoute[] = ["local"];
  if (validated.has("apple_intelligence")) processingRoutes.push("apple");
  if (validated.has("byok")) processingRoutes.push("byok");
  if (validated.has("pressay_cloud")) processingRoutes.push("cloud");

  const proScopeValidated = commercialLaunchRequirements.every((capability) =>
    validated.has(capability),
  );

  return {
    processingRoutes,
    advancedVoiceBarValidated: validated.has("advanced_voice_bar"),
    appProfilesValidated: validated.has("app_profiles"),
    byokValidated: validated.has("byok"),
    encryptedSyncValidated: validated.has("encrypted_sync"),
    pressayCloudValidated: validated.has("pressay_cloud"),
    proScopeValidated,
    commercialOfferReady:
      process.env.COMMERCIAL_CHECKOUT_ENABLED === "true" &&
      proScopeValidated &&
      deployment.ready,
  };
}
