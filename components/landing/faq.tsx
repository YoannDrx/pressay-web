import type { LandingCopy } from "@/lib/content";

export function Faq({ text }: { text: LandingCopy["faq"] }) {
  return (
    <section className="section faq" id="faq" aria-labelledby="faq-title">
      <div className="shell faq-layout">
        <h2 id="faq-title">{text.title}</h2>
        <div className="faq-list">
          {text.items.map(([question, answer]) => (
            <details key={question}>
              <summary>
                <span>{question}</span>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 8h10M8 3v10" /></svg>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
