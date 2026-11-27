import { CheckGlyph } from "@/components/landing/glyphs";
import { Keys, Wave } from "@/components/landing/keys";
import { shortcuts, type LandingCopy, type Locale } from "@/lib/content";

export function HowItWorks({ locale, text }: { locale: Locale; text: LandingCopy["how"] }) {
  const [press, speak, written] = text.steps;
  return (
    <section className="section how" id="how" aria-labelledby="how-title">
      <div className="shell">
        <div className="section-head">
          <h2 id="how-title">{text.title}</h2>
          <p>{text.intro}</p>
        </div>
        <ol className="how-steps">
          <li>
            <div className="how-visual how-keys">
              <span>{text.onMac}</span><Keys keys={shortcuts[locale].macos.dictate} />
              <span>{text.onPc}</span><Keys keys={shortcuts[locale].windows.dictate} />
            </div>
            <h3>{press.title}</h3>
            <p>{press.body}</p>
          </li>
          <li>
            <div className="how-visual how-wave" aria-hidden="true">
              <Wave count={28} />
              <span>{text.waveLabel}</span>
            </div>
            <h3>{speak.title}</h3>
            <p>{speak.body}</p>
          </li>
          <li>
            <div className="how-visual how-written" aria-hidden="true">
              <p>{text.written}<i /></p>
              <CheckGlyph />
            </div>
            <h3>{written.title}</h3>
            <p>{written.body}</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
