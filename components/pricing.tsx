import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";
import type { Locale } from "@/lib/content";
import { plans } from "@/lib/content";

export function Pricing({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return <div className={`pricing-grid${compact ? " compact" : ""}`}>
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
        plan.code === "pro_byok" ?
          <div className="price-actions">
            <CheckoutButton plan="pro_byok" interval="annual">
              {locale === "fr" ? "Essayer 14 jours — 69 €/an" : "Try 14 days — €69/year"}
            </CheckoutButton>
            <CheckoutButton plan="pro_byok" interval="monthly" variant="secondary">
              {locale === "fr" ? "Ou 7,99 €/mois" : "Or €7.99/month"}
            </CheckoutButton>
          </div> :
          <CheckoutButton plan="lifetime_byok" interval="lifetime">
            {locale === "fr" ? "Devenir Founding — 149 €" : "Become Founding — €149"}
          </CheckoutButton>}
    </article>)}
  </div>;
}
