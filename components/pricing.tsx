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
        plan.code === "pro_byok" ?
          <div className="price-actions">
            <CheckoutButton plan="pro_byok" interval="annual" locale={locale}>
              {locale === "fr" ? "Démarrer l’essai — puis 69 €/an" : "Start trial — then €69/year"}
            </CheckoutButton>
            <CheckoutButton plan="pro_byok" interval="monthly" variant="secondary" locale={locale}>
              {locale === "fr" ? "Ou 7,99 €/mois" : "Or €7.99/month"}
            </CheckoutButton>
          </div> :
          <CheckoutButton plan="lifetime_byok" interval="lifetime" locale={locale}>
            {locale === "fr" ? "Acheter — 149 € paiement unique" : "Buy — €149 one-time"}
          </CheckoutButton>}
    </article>)}
  </div><p className="pricing-legal-note">{locale === "fr" ? "Prix finaux affichés avant commande. TVA non applicable, article 293 B du CGI. Les offres payantes ouvriront après validation des obligations de vente à distance." : "Final prices are shown before purchase. French VAT exemption under article 293 B. Paid plans will open after distance-selling obligations are validated."}</p></>;
}
