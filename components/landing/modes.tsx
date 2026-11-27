import { ArrowGlyph } from "@/components/landing/glyphs";
import type { LandingCopy, Locale } from "@/lib/content";

export function Modes({ locale, text }: { locale: Locale; text: LandingCopy["modes"] }) {
  return (
    <section className="section modes" id="modes" aria-labelledby="modes-title">
      <div className="shell modes-layout">
        <div className="section-head modes-head">
          <h2 id="modes-title">{text.title}</h2>
          <p>{text.body}</p>
          <p className="modes-note">{text.note}</p>
          <a className="text-arrow" href={`/${locale}/pricing`}>{text.link}<ArrowGlyph /></a>
        </div>
        <div className="modes-sheet">
          <div className="modes-spoken">
            <span>{text.spokenLabel}</span>
            <p>{text.spoken}</p>
          </div>
          <dl className="modes-list" aria-label={text.outputLabel}>
            {text.rows.map((row) => (
              <div key={row.name}>
                <dt>{row.name} <span className="plan-tag" data-plan={row.plan}>{row.plan}</span></dt>
                <dd>{row.output}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
