import { CheckoutControls } from "@/components/checkout-controls";
import type { Locale } from "@/lib/content";
import { plans } from "@/lib/content";
import { priceTaxNote, vatRegime } from "@/lib/legal";
import { publicReleaseCapabilities } from "@/lib/public-release-capabilities";

export function Pricing({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const release = publicReleaseCapabilities();
  const fr = locale === "fr";
  const taxSuffix = vatRegime === "franchise" ? "" : fr ? " TTC" : " incl. VAT";
  return <><div className={`pricing-grid${compact ? " compact" : ""}`}>
    {plans.map((plan) => {
      const features = fr ? plan.featuresFr : plan.featuresEn;
      return <article className={`price-card ${plan.code === "pro" ? "featured" : ""}`} key={plan.code}>
      <div>
        <span className="mono-label">{plan.code.replaceAll("_", " / ")}</span>
        <h3>{plan.name}</h3>
        <strong>{plan.code === "pro" ? (fr ? `7,99 €${taxSuffix} / mois` : `€7.99${taxSuffix} / month`) : fr ? "0 €" : "€0"}</strong>
        <p>{plan.code === "pro" ? (fr ? `ou 69 €${taxSuffix} / an · aucun essai automatique` : `or €69${taxSuffix} / year · no automatic trial`) : fr ? plan.detailFr : plan.detailEn}</p>
      </div>
      <ul>
        {features.map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      {plan.code === "pro" && !release.proScopeValidated ? <p className="price-card-note">{fr ? "Ces fonctions sont dans l’app bêta. L’abonnement ouvrira quand chacune aura passé sa validation de bout en bout." : "These features ship in the beta app. Subscriptions open once each one has passed end-to-end validation."}</p> : null}
      {plan.code === "free" ?
        <a className="button full" href={`/${locale}/download`}>{fr ? "Télécharger" : "Download"}</a> :
        !release.commercialOfferReady ?
          <span className="button button-disabled full" aria-disabled="true">{fr ? "Ouverture prochaine" : "Coming soon"}</span> :
        <CheckoutControls locale={locale} />}
    </article>;
    })}
  </div><p className="pricing-legal-note">{priceTaxNote(locale)}</p></>;
}
