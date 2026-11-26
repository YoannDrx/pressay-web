/* eslint-disable @next/next/no-html-link-for-pages -- Public marketing navigation intentionally uses full document links so route prefetch cannot compete with the landing LCP. */
import type { Locale } from "@/lib/content";
import { copy } from "@/lib/content";
import { headers } from "next/headers";
import { identityProvider } from "@/lib/auth-env";
import { localizedPath } from "@/lib/locale-path";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const nav = copy[locale].nav;
  const fr = locale === "fr";
  const alternate = fr ? "en" : "fr";
  const currentPath = (await headers()).get("x-pressay-path") ?? `/${locale}`;
  const identityEnabled = identityProvider() !== "disabled";
  const links = [
    [`/${locale}#how`, nav.how],
    [`/${locale}#translate`, nav.translate],
    [`/${locale}/pricing`, nav.pricing],
    [`/${locale}/security`, nav.security],
  ] as const;
  return (
    <header className="site-header">
      <div className="site-header-inner shell">
        <a className="site-brand" href={`/${locale}`} aria-label={fr ? "Pressay, accueil" : "Pressay, home"}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, nothing to optimize */}
          <img src="/logo.svg" alt="" width={30} height={30} />
          <span>pressay</span>
        </a>
        <nav className="site-nav" aria-label={fr ? "Navigation principale" : "Primary navigation"}>
          {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="site-header-actions">
          <span className="language-switch" role="group" aria-label={fr ? "Choisir la langue" : "Choose language"}>
            <a aria-current={fr ? "true" : undefined} href={localizedPath(currentPath, "fr")} hrefLang="fr" lang="fr">FR</a>
            <a aria-current={fr ? undefined : "true"} href={localizedPath(currentPath, "en")} hrefLang="en" lang="en">EN</a>
          </span>
          {/* A plain link keeps public pages free of the auth client and of any
              session request; /account sends signed-out visitors to sign-in. */}
          {identityEnabled ? <a className="header-link" href="/account">{nav.account}</a> : null}
          <a className="button button-primary button-small" href={`/${locale}/download`}>{nav.download}</a>
          <details className="mobile-menu">
            <summary aria-label={fr ? "Ouvrir le menu" : "Open menu"}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14" /></svg>
            </summary>
            <div>
              {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
              {identityEnabled ? <a href="/account">{nav.account}</a> : null}
              <a href={localizedPath(currentPath, alternate)} hrefLang={alternate} lang={alternate}>
                {alternate === "en" ? "English" : "Français"}
              </a>
              <a className="button button-primary" href={`/${locale}/download`}>{nav.download}</a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
