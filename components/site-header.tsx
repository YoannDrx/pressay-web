import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/content";
import { copy } from "@/lib/content";

export function SiteHeader({ locale }: { locale: Locale }) {
  const nav = copy[locale].nav;
  const alternate = locale === "fr" ? "en" : "fr";
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return <header className="site-header">
    <Link className="brand" href={`/${locale}`} aria-label="Pressay — accueil">
      <Image src="/logo.svg" width={34} height={34} alt="" priority />
      <span>pressay</span>
    </Link>
    <nav className="desktop-nav" aria-label={locale === "fr" ? "Navigation principale" : "Primary navigation"}>
      <Link href={`/${locale}#product`}>{nav.product}</Link>
      <Link href={`/${locale}/security`}>{nav.security}</Link>
      <Link href={`/${locale}/pricing`}>{nav.pricing}</Link>
    </nav>
    <div className="nav-actions">
      <span className="language-switch" aria-label={locale === "fr" ? "Choisir la langue" : "Choose language"}><Link className={locale === "fr" ? "active" : ""} href="/fr" hrefLang="fr">FR</Link><Link className={locale === "en" ? "active" : ""} href="/en" hrefLang="en">EN</Link></span>
      {clerkEnabled ? <Link className="text-link" href="/sign-in">{nav.signIn}</Link> : null}
      <span className="nav-divider" aria-hidden="true" />
      <Link className="button button-small" href={`/${locale}/download`}>{nav.download}</Link>
      <details className="mobile-menu"><summary aria-label={locale === "fr" ? "Ouvrir le menu" : "Open menu"}>☰</summary><div><Link href={`/${locale}#product`}>{nav.product}</Link><Link href={`/${locale}/security`}>{nav.security}</Link><Link href={`/${locale}/pricing`}>{nav.pricing}</Link>{clerkEnabled ? <Link href="/sign-in">{nav.signIn}</Link> : null}<Link href={`/${alternate}`} hrefLang={alternate}>{alternate.toUpperCase()}</Link><Link className="button button-primary" href={`/${locale}/download`}>{nav.download}</Link></div></details>
    </div>
  </header>;
}
