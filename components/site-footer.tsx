import type { Locale } from "@/lib/content";

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="site-footer">
      <div>
        <a className="brand" href={`/${locale}`}>
          <span className="brand-logo" aria-hidden="true" />
          <span>pressay</span>
        </a>
        <p>
          {locale === "fr"
            ? "Appuie. Parle. C’est écrit."
            : "Press. Speak. It’s written."}
        </p>
      </div>
      <div className="footer-links">
        <a href={`/${locale}/privacy`}>
          {locale === "fr" ? "Confidentialité" : "Privacy"}
        </a>
        <a href={`/${locale}/terms`}>
          {locale === "fr" ? "Conditions" : "Terms"}
        </a>
        <a href={`/${locale}/legal`}>
          {locale === "fr" ? "Mentions légales" : "Legal notice"}
        </a>
        <a href={`/${locale}/cookies`}>Cookies</a>
        <a href={`/${locale}/withdrawal`}>
          {locale === "fr" ? "Rétractation" : "Withdrawal"}
        </a>
        <a href={`/${locale}/support`}>Support</a>
      </div>
      <small>
        © {new Date().getFullYear()} YoDev ·{" "}
        {locale === "fr"
          ? "Pressay est édité et développé par YoDev"
          : "Pressay is published and developed by YoDev"}{" "}
        · macOS 14+
      </small>
    </footer>
  );
}
