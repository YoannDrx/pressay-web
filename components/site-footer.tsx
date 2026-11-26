import type { Locale } from "@/lib/content";
import { copy } from "@/lib/content";

export function SiteFooter({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const links = [
    [`/${locale}/download`, fr ? "Télécharger" : "Download"],
    [`/${locale}/pricing`, fr ? "Tarifs" : "Pricing"],
    [`/${locale}/security`, fr ? "Sécurité" : "Security"],
    [`/${locale}/support`, "Support"],
    [`/${locale}/privacy`, fr ? "Confidentialité" : "Privacy"],
    [`/${locale}/terms`, fr ? "Conditions" : "Terms"],
    [`/${locale}/legal`, fr ? "Mentions légales" : "Legal notice"],
    [`/${locale}/cookies`, "Cookies"],
    [`/${locale}/withdrawal`, fr ? "Rétractation" : "Withdrawal"],
  ] as const;
  return (
    <footer className="site-footer">
      <div className="site-footer-inner shell">
        <div>
          <a className="site-brand" href={`/${locale}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, nothing to optimize */}
            <img src="/logo.svg" alt="" width={30} height={30} />
            <span>pressay</span>
          </a>
          <p>{copy[locale].tagline}</p>
        </div>
        <nav className="footer-links" aria-label={fr ? "Liens du site" : "Site links"}>
          {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="footer-legal">
          <small>
            © {new Date().getFullYear()} YoDev ·{" "}
            {fr ? "Pressay est édité et développé par YoDev" : "Pressay is published and developed by YoDev"}
          </small>
          <small>macOS 14+ · Windows 10/11</small>
        </div>
      </div>
    </footer>
  );
}
