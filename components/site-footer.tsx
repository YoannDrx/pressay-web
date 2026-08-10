import Link from "next/link";
import type { Locale } from "@/lib/content";

export function SiteFooter({ locale }: { locale: Locale }) {
  return <footer className="site-footer">
    <div><span className="brand-word">pressay</span><p>Voice, with a visible contract.</p></div>
    <div className="footer-links">
      <Link href={`/${locale}/privacy`}>{locale === "fr" ? "Confidentialité" : "Privacy"}</Link>
      <Link href={`/${locale}/terms`}>{locale === "fr" ? "Conditions" : "Terms"}</Link>
      <Link href={`/${locale}/legal`}>{locale === "fr" ? "Mentions légales" : "Legal notice"}</Link>
      <Link href={`/${locale}/cookies`}>Cookies</Link>
      <Link href={`/${locale}/withdrawal`}>{locale === "fr" ? "Rétractation" : "Withdrawal"}</Link>
      <Link href={`/${locale}/support`}>Support</Link>
    </div>
    <small>© {new Date().getFullYear()} Yodev · {locale === "fr" ? "Pressay est édité et développé par Yodev" : "Pressay is published and developed by Yodev"} · macOS 14+</small>
  </footer>;
}
