import type { PublicProcessingRoute } from "@/lib/public-release-capabilities";

export const processingRouteContent = {
  local: {
    label: "Local",
    detailFr: "Audio → modèle local → texte. Rien ne quitte le Mac.",
    detailEn: "Audio → local model → text. Nothing leaves your Mac.",
    badgeFr: "Par défaut",
    badgeEn: "Default",
  },
  apple: {
    label: "Apple Intelligence",
    detailFr: "Réécriture et intentions sur les Mac compatibles, sans fallback silencieux.",
    detailEn: "Rewriting and intents on compatible Macs, with no silent fallback.",
    badgeFr: "Sur appareil",
    badgeEn: "On device",
  },
  byok: {
    label: "BYOK",
    detailFr: "Votre clé reste dans le Trousseau et la Voice Bar affiche le fournisseur choisi.",
    detailEn: "Your key stays in Keychain and the Voice Bar names the selected provider.",
    badgeFr: "Votre clé",
    badgeEn: "Your key",
  },
  cloud: {
    label: "Pressay Cloud",
    detailFr: "Route Pro facultative, explicite et soumise à quota. Jamais un fallback.",
    detailEn: "Optional, explicit, quota-bound Pro route. Never used as a fallback.",
    badgeFr: "Opt-in",
    badgeEn: "Opt-in",
  },
} as const satisfies Record<PublicProcessingRoute, {
  label: string;
  detailFr: string;
  detailEn: string;
  badgeFr: string;
  badgeEn: string;
}>;
