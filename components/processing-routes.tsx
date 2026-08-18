"use client";

import { useState } from "react";
import type { Locale } from "@/lib/content";

const routes = {
  local: {
    label: "Local",
    detailFr: "Audio → modèle local → texte. Rien ne quitte le Mac.",
    detailEn: "Audio → local model → text. Nothing leaves your Mac.",
    badgeFr: "Par défaut",
    badgeEn: "Default",
  },
  apple: {
    label: "Apple Intelligence",
    detailFr:
      "Réécriture et intentions sur les Mac compatibles, sans fallback silencieux.",
    detailEn:
      "Rewriting and intents on compatible Macs, with no silent fallback.",
    badgeFr: "Sur appareil",
    badgeEn: "On device",
  },
  byok: {
    label: "BYOK",
    detailFr:
      "Votre clé reste dans le Trousseau et la Voice Bar affiche le fournisseur choisi.",
    detailEn:
      "Your key stays in Keychain and the Voice Bar names the selected provider.",
    badgeFr: "Votre clé",
    badgeEn: "Your key",
  },
  cloud: {
    label: "Pressay Cloud",
    detailFr:
      "Route Pro facultative, explicite et soumise à quota. Jamais un fallback.",
    detailEn:
      "Optional, explicit, quota-bound Pro route. Never used as a fallback.",
    badgeFr: "Opt-in",
    badgeEn: "Opt-in",
  },
} as const;

type RouteId = keyof typeof routes;

export function ProcessingRoutes({ locale }: { locale: Locale }) {
  const [active, setActive] = useState<RouteId>("local");
  const fr = locale === "fr";
  const selected = routes[active];

  return (
    <section className="route-map-section" aria-labelledby="route-map-title">
      <div className="shell route-map-layout">
        <div className="route-map-copy" data-reveal>
          <span className="mono-label">ROUTES / EXPLICIT BY DESIGN</span>
          <h2 id="route-map-title">
            {fr ? "Une voix. Quatre routes visibles." : "One voice. Four visible routes."}
          </h2>
          <p>
            {fr
              ? "La barre vocale montre où le traitement a lieu avant qu’il commence. Le local est toujours le point de départ."
              : "The Voice Bar shows where processing happens before it starts. Local is always the starting point."}
          </p>
        </div>

        <div className="route-console" data-route={active} data-reveal>
          <div className="route-console-signal" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="route-console-core">
            <span>VOICE</span>
            <strong>{selected.label}</strong>
            <small>{fr ? selected.badgeFr : selected.badgeEn}</small>
          </div>
          <div className="route-console-output">
            <span>TEXT</span>
            <p>{fr ? selected.detailFr : selected.detailEn}</p>
          </div>
          <div className="route-selector" role="group" aria-label={fr ? "Route de traitement" : "Processing route"}>
            {(Object.entries(routes) as [RouteId, (typeof routes)[RouteId]][]).map(
              ([id, route]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={active === id}
                  onClick={() => setActive(id)}
                >
                  <i aria-hidden="true" />
                  {route.label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
