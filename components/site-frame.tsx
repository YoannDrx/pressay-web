import "@/app/styles/site/index.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/content";
import { siteFontClasses } from "@/lib/fonts";

/** Public page frame: design tokens, fonts, skip link, header and footer. */
export function SiteFrame({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div className={`site ${siteFontClasses}`}>
      <a className="skip-link" href="#main">
        {locale === "fr" ? "Aller au contenu" : "Skip to content"}
      </a>
      <SiteHeader locale={locale} />
      {children}
      <SiteFooter locale={locale} />
    </div>
  );
}
