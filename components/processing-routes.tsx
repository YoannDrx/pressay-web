import type { Locale } from "@/lib/content";
import type { PublicProcessingRoute } from "@/lib/public-release-capabilities";
import { processingRouteContent } from "@/lib/processing-route-content";

export function ProcessingRoutes({ locale, enabledRoutes }: { locale: Locale; enabledRoutes: PublicProcessingRoute[] }) {
  const fr = locale === "fr";
  const visibleRoutes = (enabledRoutes.length ? enabledRoutes : ["local"] as PublicProcessingRoute[])
    .map((id) => [id, processingRouteContent[id]] as const);
  const initialRoute = visibleRoutes[0];
  const scriptData = Object.fromEntries(visibleRoutes.map(([id, route]) => [id, {
    label: route.label,
    badge: fr ? route.badgeFr : route.badgeEn,
    detail: fr ? route.detailFr : route.detailEn,
  }]));

  return <section className="route-map-section" aria-labelledby="route-map-title">
    <div className="shell route-map-layout">
      <div className="route-map-copy" data-reveal>
        <span className="mono-label">ROUTES / EXPLICIT BY DESIGN</span>
        <h2 id="route-map-title">{visibleRoutes.length === 1
          ? fr ? "Une voix. Une route validée." : "One voice. One validated route."
          : fr ? "Une voix. Des routes visibles." : "One voice. Visible routes."}</h2>
        <p>{fr ? "La barre vocale montre où le traitement a lieu avant qu’il commence. Le local est toujours le point de départ." : "The Voice Bar shows where processing happens before it starts. Local is always the starting point."}</p>
      </div>
      <div className="route-console" data-route={initialRoute[0]} data-reveal>
        <div className="route-console-signal" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="route-console-core"><span>VOICE</span><strong>{initialRoute[1].label}</strong><small>{fr ? initialRoute[1].badgeFr : initialRoute[1].badgeEn}</small></div>
        <div className="route-console-output"><span>TEXT</span><p>{fr ? initialRoute[1].detailFr : initialRoute[1].detailEn}</p></div>
        <div className="route-selector" role="group" aria-label={fr ? "Route de traitement" : "Processing route"}>
          {visibleRoutes.map(([id, route], index) => <button type="button" key={id} data-route-id={id} aria-pressed={index === 0}><i aria-hidden="true" />{route.label}</button>)}
        </div>
      </div>
    </div>
    {visibleRoutes.length > 1 ? <script dangerouslySetInnerHTML={{ __html: routeScript(scriptData) }} /> : null}
  </section>;
}

function routeScript(routes: Record<string, { label: string; badge: string; detail: string }>): string {
  const serialized = JSON.stringify(routes).replaceAll("<", "\\u003c");
  return `(() => {
    const section = document.currentScript.closest(".route-map-section");
    const consoleElement = section && section.querySelector(".route-console");
    if (!consoleElement) return;
    const routes = ${serialized};
    const label = consoleElement.querySelector(".route-console-core strong");
    const badge = consoleElement.querySelector(".route-console-core small");
    const detail = consoleElement.querySelector(".route-console-output p");
    consoleElement.querySelectorAll("[data-route-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.routeId;
        const route = routes[id];
        if (!route) return;
        consoleElement.dataset.route = id;
        label.textContent = route.label;
        badge.textContent = route.badge;
        detail.textContent = route.detail;
        consoleElement.querySelectorAll("[data-route-id]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
      });
    });
  })();`;
}
