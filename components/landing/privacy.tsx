import { ArrowGlyph } from "@/components/landing/glyphs";
import type { LandingCopy, Locale } from "@/lib/content";
import { processingRouteContent } from "@/lib/processing-route-content";
import type { PublicProcessingRoute } from "@/lib/public-release-capabilities";

export function Privacy({ locale, text, routes }: { locale: Locale; text: LandingCopy["privacy"]; routes: PublicProcessingRoute[] }) {
  const fr = locale === "fr";
  // Only routes validated end to end are listed; Local always comes first.
  const visible: PublicProcessingRoute[] = routes.length ? routes : ["local"];
  return (
    <section className="section privacy" id="privacy" aria-labelledby="privacy-title">
      <div className="shell">
        <div className="section-head">
          <h2 id="privacy-title">{text.title}</h2>
          <p>{text.body}</p>
        </div>
        <figure className="privacy-boundary">
          <figcaption>{fr ? "Ton Mac ou ton PC" : "Your Mac or PC"}</figcaption>
          <ol aria-label={text.flowLabel}>
            {text.flow.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </figure>
        <ul className="privacy-routes" aria-label={text.routesLabel}>
          {visible.map((id) => {
            const route = processingRouteContent[id];
            return (
              <li key={id} data-route={id}>
                <strong>{route.label}</strong>
                <span>{fr ? route.badgeFr : route.badgeEn}</span>
                <p>{fr ? route.detailFr : route.detailEn}</p>
              </li>
            );
          })}
        </ul>
        <dl className="privacy-points">
          {text.points.map((point) => (
            <div key={point.title}>
              <dt>{point.title}</dt>
              <dd>{point.body}</dd>
            </div>
          ))}
        </dl>
        <a className="text-arrow" href={`/${locale}/security`}>{text.link}<ArrowGlyph /></a>
      </div>
    </section>
  );
}
