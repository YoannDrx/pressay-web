import { Keys, Wave } from "@/components/landing/keys";
import { shortcuts, type LandingCopy, type Locale } from "@/lib/content";

export function Translate({ locale, text }: { locale: Locale; text: LandingCopy["translate"] }) {
  const fr = locale === "fr";
  return (
    <section className="section translate" id="translate" aria-labelledby="translate-title">
      <div className="shell">
        <div className="section-head">
          <h2 id="translate-title">{text.title}</h2>
          <p>{text.body}</p>
        </div>
        <figure className="translate-sheet">
          <div className="translate-row translate-said">
            <span className="translate-label">{text.said}<Wave count={9} /></span>
            <p lang="fr">« {text.spoken} »</p>
          </div>
          <div className="translate-shortcut">
            <span><small>Mac</small><Keys keys={shortcuts[locale].macos.translate} /></span>
            <span><small>PC</small><Keys keys={shortcuts[locale].windows.translate} /></span>
          </div>
          <div className="translate-row translate-written">
            <span className="translate-label">{text.written}</span>
            <p lang="en">{text.result}</p>
          </div>
          <figcaption className="sr-only">
            {fr ? "Exemple de dictée traduite : la phrase dite en français s’écrit en anglais." : "Translated dictation example: the sentence spoken in French is written in English."}
          </figcaption>
        </figure>
        <dl className="translate-plans">
          <div>
            <dt>{text.free.title} <span className="plan-tag" data-plan="Free">Free</span></dt>
            <dd>{text.free.body}</dd>
          </div>
          <div>
            <dt>{text.pro.title} <span className="plan-tag" data-plan="Pro">Pro</span></dt>
            <dd>{text.pro.body}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
