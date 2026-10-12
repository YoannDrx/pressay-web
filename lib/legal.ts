/**
 * Owner-maintained legal facts, kept in one place so publishing them does not
 * require editing page copy.
 */

/**
 * Consumer mediator (art. L612-1 Code de la consommation). REQUIRED before any
 * paid launch. Fill in after joining a mediation body (for example CM2C or
 * Medicys); while it is null the terms say so explicitly and the paid launch
 * stays blocked.
 */
export const consumerMediator: {
  name: string;
  address: string;
  website: string;
} | null = null;

/**
 * VAT regime of the publisher. "franchise" displays the mandatory
 * "TVA non applicable, art. 293 B du CGI" wording; "standard" displays prices
 * including VAT. Confirm with the accountant before the paid launch.
 */
export const vatRegime: "standard" | "franchise" = "standard";

/** Hosting provider (LCEN art. 6-III). */
export const hostingProvider = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, USA",
  website: "https://vercel.com",
} as const;

export function priceTaxNote(locale: "fr" | "en"): string {
  if (vatRegime === "franchise")
    return locale === "fr"
      ? "TVA non applicable, art. 293 B du CGI. Prix nets, renouvellement automatique jusqu’à résiliation."
      : "VAT not applicable (French General Tax Code, art. 293 B). Net prices, renewing until cancelled.";
  return locale === "fr"
    ? "Prix TTC, toutes taxes comprises, en euros. Renouvellement automatique jusqu’à résiliation, rappelé avant commande."
    : "Prices in euros including VAT. Subscriptions renew until cancelled; renewal terms are shown again before purchase.";
}
