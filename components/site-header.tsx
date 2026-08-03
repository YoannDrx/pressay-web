import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/content";
import { copy } from "@/lib/content";

export function SiteHeader({ locale }: { locale: Locale }) {
  const nav = copy[locale].nav;
  const alternate = locale === "fr" ? "en" : "fr";
  return <header className="site-header">
    <Link className="brand" href={`/${locale}`} aria-label="Pressay — accueil">
      <Image src="/logo.svg" width={34} height={34} alt="" priority />
      <span>pressay</span>
    </Link>
    <nav aria-label="Navigation principale">
      <Link href={`/${locale}#product`}>{nav.product}</Link>
      <Link href={`/${locale}/security`}>{nav.security}</Link>
      <Link href={`/${locale}/pricing`}>{nav.pricing}</Link>
    </nav>
    <div className="nav-actions">
      <Link className="language" href={`/${alternate}`} hrefLang={alternate}>{alternate.toUpperCase()}</Link>
      <Link className="text-link" href="/sign-in">{nav.signIn}</Link>
      <Link className="button button-small" href={`/${locale}/download`}>{nav.download}</Link>
    </div>
  </header>;
}
