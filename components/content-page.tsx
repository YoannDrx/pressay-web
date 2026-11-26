import { SiteFrame } from "@/components/site-frame";
import type { Locale } from "@/lib/content";

/** Public text page: a title block, then the page body, inside the site frame. */
export function ContentPage({ locale, title, intro, children }: { locale: Locale; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <SiteFrame locale={locale}>
      <main id="main" className="content-main">
        <header className="content-hero shell">
          <h1>{title}</h1>
          {intro ? <p className="lede">{intro}</p> : null}
        </header>
        <div className="content-body shell">{children}</div>
      </main>
    </SiteFrame>
  );
}
