import type { PublicProcessingRoute } from "@/lib/public-release-capabilities";

export const processingRouteContent = {
  local: {
    label: "Local",
    detailFr: "Ta voix est transcrite sur ton ordinateur. Rien n’en sort.",
    detailEn: "Your voice is transcribed on your computer. Nothing leaves it.",
    badgeFr: "Par défaut",
    badgeEn: "Default",
  },
  apple: {
    label: "Apple Intelligence",
    detailFr: "Réécriture sur les Mac compatibles, sans bascule silencieuse.",
    detailEn: "Rewriting on compatible Macs, with no silent fallback.",
    badgeFr: "Sur appareil",
    badgeEn: "On device",
  },
  byok: {
    label: "BYOK",
    detailFr: "Ta clé reste chiffrée sur ton ordinateur et la Voice Bar affiche le fournisseur choisi.",
    detailEn: "Your key stays encrypted on your computer and the Voice Bar names the selected provider.",
    badgeFr: "Ta clé",
    badgeEn: "Your key",
  },
  cloud: {
    label: "Pressay Cloud",
    detailFr: "Route Pro facultative, explicite et soumise à quota. Jamais une solution de repli.",
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
