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
        <CheckoutButton plan={plan.code} interval={plan.code === "pro_byok" ? "annual" : "lifetime"}>
          {locale === "fr" ? (plan.code === "pro_byok" ? "Essayer Pro" : "Devenir Founding") : (plan.code === "pro_byok" ? "Try Pro" : "Become Founding")}
        </CheckoutButton>}
    </article>)}
  </div>;
}
