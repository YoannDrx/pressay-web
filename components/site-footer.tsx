import Link from "next/link";
import type { Locale } from "@/lib/content";

export function SiteFooter({ locale }: { locale: Locale }) {
  return <footer className="site-footer">
    <div><span className="brand-word">pressay</span><p>Voice, with a visible contract.</p></div>
    <div className="footer-links">
      <Link href={`/${locale}/privacy`}>{locale === "fr" ? "Confidentialité" : "Privacy"}</Link>
      <Link href={`/${locale}/terms`}>{locale === "fr" ? "Conditions" : "Terms"}</Link>
      <Link href={`/${locale}/support`}>Support</Link>
      <a href="https://github.com/YoannDrx/pressay">GitHub</a>
    </div>
    <small>© {new Date().getFullYear()} Yodev · macOS 14+</small>
  </footer>;
}
