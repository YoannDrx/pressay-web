/* eslint-disable @next/next/no-html-link-for-pages -- Public checkout disclosures intentionally use full document links and do not prefetch legal routes. */
import type { Locale } from "@/lib/content";
import { plans } from "@/lib/content";
import { publicReleaseCapabilities } from "@/lib/public-release-capabilities";

export function Pricing({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const release = publicReleaseCapabilities();
  return <><div className={`pricing-grid${compact ? " compact" : ""}`}>
    {plans.map((plan) => {
      const features = plan.code === "pro" && !release.proScopeValidated
        ? locale === "fr"
          ? ["Périmètre final publié après validation", "Activation après confirmation de paiement", "Free local reste inchangé"]
          : ["Final scope published after validation", "Activation follows payment confirmation", "Local Free remains unchanged"]
        : locale === "fr" ? plan.featuresFr : plan.featuresEn;
      return <article className={`price-card ${plan.code === "pro" ? "featured" : ""}`} key={plan.code}>
      <div>
        <span className="mono-label">{plan.code.replaceAll("_", " / ")}</span>
        <h3>{plan.name}</h3>
        <strong>{plan.monthly}</strong>
        <p>{locale === "fr" ? plan.detailFr : plan.detailEn}</p>
      </div>
      <ul>
        {features.map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      {plan.code === "free" ?
        <a className="button full" href={`/${locale}/download`}>{locale === "fr" ? "Télécharger" : "Download"}</a> :
        !release.commercialOfferReady ?
          <span className="button button-disabled full" aria-disabled="true">{locale === "fr" ? "Ouverture prochaine" : "Coming soon"}</span> :
        <CommercialCheckout locale={locale} />}
    </article>;
    })}
  </div><p className="pricing-legal-note">{locale === "fr" ? "Prix, taxes applicables et renouvellement affichés avant commande. Les offres payantes ouvriront après validation fiscale et des obligations de vente à distance." : "Final price, applicable taxes and renewal are shown before purchase. Paid plans will open after tax and distance-selling requirements are validated."}</p>{release.commercialOfferReady ? <CheckoutScript /> : null}</>;
}

function CommercialCheckout({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  return <div className="price-actions checkout-surface" data-locale={locale}>
    <div className="checkout-consents">
      <label><input type="checkbox" data-checkout-consent="terms" />{fr ? <>J’accepte les <a href="/fr/terms">conditions</a>.</> : <>I accept the <a href="/en/terms">terms</a>.</>}</label>
      <label><input type="checkbox" data-checkout-consent="immediate" />{fr ? <>Je demande l’exécution immédiate avant la fin du délai de rétractation, selon les <a href="/fr/withdrawal">modalités expliquées ici</a>.</> : <>I request immediate performance before the withdrawal period ends, under the <a href="/en/withdrawal">terms explained here</a>.</>}</label>
    </div>
    <button className="button button-primary full" type="button" data-checkout-interval="annual" disabled>{fr ? "Choisir Pro annuel — 69 €/an" : "Choose annual Pro — €69/year"}</button>
    <button className="button button-secondary full" type="button" data-checkout-interval="monthly" disabled>{fr ? "Ou 7,99 €/mois" : "Or €7.99/month"}</button>
    <small className="form-error" role="alert" hidden />
  </div>;
}

function CheckoutScript() {
  return <script dangerouslySetInnerHTML={{ __html: `(() => {
    document.querySelectorAll(".checkout-surface").forEach((surface) => {
      const terms = surface.querySelector("[data-checkout-consent='terms']");
      const immediate = surface.querySelector("[data-checkout-consent='immediate']");
      const buttons = Array.from(surface.querySelectorAll("[data-checkout-interval]"));
      const error = surface.querySelector(".form-error");
      const refresh = () => buttons.forEach((button) => { button.disabled = !(terms.checked && immediate.checked); });
      terms.addEventListener("change", refresh);
      immediate.addEventListener("change", refresh);
      buttons.forEach((button) => button.addEventListener("click", async () => {
        buttons.forEach((candidate) => { candidate.disabled = true; });
        error.hidden = true;
        try {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: "pro_byok", interval: button.dataset.checkoutInterval, acceptedTerms: true, immediatePerformanceConsent: true, termsVersion: "2026-08-10" })
          });
          if (response.status === 401) {
            window.location.assign("/sign-in?redirect_url=" + encodeURIComponent(window.location.href));
            return;
          }
          const payload = await response.json();
          if (response.ok && payload.url) {
            window.location.assign(payload.url);
            return;
          }
          error.textContent = payload.error || "Checkout unavailable";
        } catch {
          error.textContent = surface.dataset.locale === "fr" ? "Paiement temporairement indisponible" : "Checkout temporarily unavailable";
        }
        error.hidden = false;
        refresh();
      }));
    });
  })();` }} />;
}
