import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";
import type { Locale } from "@/lib/content";
import { plans } from "@/lib/content";

export function Pricing({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const checkoutEnabled = process.env.COMMERCIAL_CHECKOUT_ENABLED === "true";
  return <><div className={`pricing-grid${compact ? " compact" : ""}`}>
    {plans.map((plan) => <article className={`price-card ${plan.code === "pro_byok" ? "featured" : ""}`} key={plan.code}>
      <div>
        <span className="mono-label">{plan.code.replaceAll("_", " / ")}</span>
        <h3>{plan.name}</h3>
        <strong>{plan.monthly}</strong>
        <p>{locale === "fr" ? plan.detailFr : plan.detailEn}</p>
      </div>
      <ul>
        {(locale === "fr" ? plan.featuresFr : plan.featuresEn).map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      {plan.code === "free" ?
        <Link className="button full" href={`/${locale}/download`}>{locale === "fr" ? "Télécharger" : "Download"}</Link> :
        !checkoutEnabled ?
          <span className="button button-disabled full" aria-disabled="true">{locale === "fr" ? "Ouverture prochaine" : "Coming soon"}</span> :
        <div className="price-actions">
          <CheckoutButton plan="pro_byok" interval="annual" locale={locale}>
            {locale === "fr" ? "Choisir Pro annuel — 69 €/an" : "Choose annual Pro — €69/year"}
          </CheckoutButton>
          <CheckoutButton plan="pro_byok" interval="monthly" variant="secondary" locale={locale}>
            {locale === "fr" ? "Ou 7,99 €/mois" : "Or €7.99/month"}
          </CheckoutButton>
        </div>}
    </article>)}
  </div><p className="pricing-legal-note">{locale === "fr" ? "Prix, taxes applicables et renouvellement affichés avant commande. Les offres payantes ouvriront après validation fiscale et des obligations de vente à distance." : "Final price, applicable taxes and renewal are shown before purchase. Paid plans will open after tax and distance-selling requirements are validated."}</p></>;
}
