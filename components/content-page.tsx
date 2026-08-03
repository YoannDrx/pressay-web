import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/content";

export function ContentPage({ locale, eyebrow, title, intro, children }: { locale: Locale; eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return <><SiteHeader locale={locale} /><main className="content-main"><header className="content-hero shell"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{intro ? <p className="lede">{intro}</p> : null}</header><div className="content-body shell">{children}</div></main><SiteFooter locale={locale} /></>;
}
