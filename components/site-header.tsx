/* eslint-disable @next/next/no-html-link-for-pages -- Public marketing navigation intentionally uses full document links so route prefetch cannot compete with the landing LCP. */
import type { Locale } from "@/lib/content";
import { copy } from "@/lib/content";
import { headers } from "next/headers";
import { identityProvider } from "@/lib/auth-env";
import { localizedPath } from "@/lib/locale-path";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const nav = copy[locale].nav;
  const alternate = locale === "fr" ? "en" : "fr";
  const currentPath = (await headers()).get("x-pressay-path") ?? `/${locale}`;
  const identityEnabled = identityProvider() !== "disabled";
  return (
    <header className="site-header">
      <a className="brand" href={`/${locale}`} aria-label="Pressay — accueil">
        <span className="brand-logo" aria-hidden="true" />
        <span>pressay</span>
      </a>
      <nav
        className="desktop-nav"
        aria-label={
          locale === "fr" ? "Navigation principale" : "Primary navigation"
        }
      >
        <a href={`/${locale}#product`}>{nav.product}</a>
        <a href={`/${locale}/security`}>{nav.security}</a>
        <a href={`/${locale}/pricing`}>{nav.pricing}</a>
      </nav>
      <div className="nav-actions">
        <span
          className="language-switch"
          aria-label={locale === "fr" ? "Choisir la langue" : "Choose language"}
        >
          <a
            className={locale === "fr" ? "active" : ""}
            href={localizedPath(currentPath, "fr")}
            hrefLang="fr"
          >
            FR
          </a>
          <a
            className={locale === "en" ? "active" : ""}
            href={localizedPath(currentPath, "en")}
            hrefLang="en"
          >
            EN
          </a>
        </span>
        {/* A plain link keeps public pages free of the auth client and of any
            session request; /account sends signed-out visitors to sign-in. */}
        {identityEnabled ? (
          <a className="text-link" href="/account">
            {locale === "fr" ? "Mon compte" : "My account"}
          </a>
        ) : null}
        <span className="nav-divider" aria-hidden="true" />
        <a className="button button-small" href={`/${locale}/download`}>
          {nav.download}
        </a>
        <details className="mobile-menu">
          <summary
            aria-label={locale === "fr" ? "Ouvrir le menu" : "Open menu"}
          >
            ☰
          </summary>
          <div>
            <a href={`/${locale}#product`}>{nav.product}</a>
            <a href={`/${locale}/security`}>{nav.security}</a>
            <a href={`/${locale}/pricing`}>{nav.pricing}</a>
            {identityEnabled ? (
              <a href="/account">
                {locale === "fr" ? "Mon compte" : "My account"}
              </a>
            ) : null}
            <a href={localizedPath(currentPath, alternate)} hrefLang={alternate}>
              {alternate.toUpperCase()}
            </a>
            <a className="button button-primary" href={`/${locale}/download`}>
              {nav.download}
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
