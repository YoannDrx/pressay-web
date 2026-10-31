export type SiteLocale = "fr" | "en";

/** Cookie holding the last language the visitor chose or read. */
export const localeCookie = "pressay_locale";

// Crawlers and link-preview fetchers must always see the x-default page, so a
// shared or indexed URL never depends on the fetcher's headers.
const automatedAgent =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|validator|curl\/|wget\//i;

export function isAutomatedAgent(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && automatedAgent.test(userAgent));
}

/**
 * First supported language in an Accept-Language header, honouring q-values
 * (`de-DE,en;q=0.8,fr;q=0.5` -> "en"). Null when neither French nor English
 * is accepted.
 */
export function acceptedLocale(header: string | null | undefined): SiteLocale | null {
  if (!header) return null;
  const ranges = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params
        .map((param) => param.trim().match(/^q=([0-9.]+)$/i)?.[1])
        .find((value) => value !== undefined);
      const quality = q === undefined ? 1 : Number(q);
      return { language: tag.trim().toLowerCase().split("-")[0], quality, index };
    })
    .filter(({ quality }) => Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  for (const { language } of ranges)
    if (language === "fr" || language === "en") return language;
  return null;
}

/**
 * Language for a locale-less entry point such as `/`: an explicit cookie
 * wins, then the browser languages; robots and unknown languages get the
 * fallback (the x-default French site).
 */
export function preferredLocale({
  cookie,
  acceptLanguage,
  userAgent,
  fallback = "fr",
}: {
  cookie?: string | null;
  acceptLanguage?: string | null;
  userAgent?: string | null;
  fallback?: SiteLocale;
}): SiteLocale {
  if (cookie === "fr" || cookie === "en") return cookie;
  if (isAutomatedAgent(userAgent)) return fallback;
  return acceptedLocale(acceptLanguage) ?? fallback;
}
