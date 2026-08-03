import Link from "next/link";
import { Pricing } from "@/components/pricing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/content";
import { copy } from "@/lib/content";

export function LandingPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const isFr = locale === "fr";
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Pressay",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "macOS 14 or later",
      url: `https://press-say.app/${locale}`,
      downloadUrl: "https://press-say.app/download/pressay",
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Pro BYOK monthly", price: "7.99", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Pro BYOK annual", price: "69", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Lifetime BYOK", price: "149", priceCurrency: "EUR" }
      ]
    }).replaceAll("<", "\\u003c") }} />
    <SiteHeader locale={locale} />
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p className="lede">{t.intro}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={`/${locale}/download`}>{t.download}</Link>
            <Link className="button button-ghost" href={`/${locale}/pricing`}>{t.seePricing}</Link>
          </div>
          <p className="fine-print">macOS 14+ · Apple Silicon & Intel · {isFr ? "sans compte pour Free" : "no account for Free"}</p>
        </div>
        <ProductDemo locale={locale} />
      </section>

      <section className="proof-strip" aria-label={isFr ? "Preuves produit" : "Product proofs"}>
        {t.proofs.map(([title, detail], index) => <div key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{detail}</p></div>)}
      </section>

      <section className="feature-section shell" id="product">
        <div className="section-copy"><span className="mono-label">TARGET / PROOF</span><h2>{t.demoTitle}</h2><p>{t.demoBody}</p></div>
        <div className="target-map" aria-label={isFr ? "Contrat de cible" : "Target contract"}>
          <div><i className="dot cobalt" />Mail.app</div><span>→</span><div><i className="dot green" />Compose.Body</div><span>→</span><div><i className="dot green" />Verified</div>
          <small>{isFr ? "La fenêtre et la sélection sont revérifiées avant écriture." : "Window and selection are checked again before writing."}</small>
        </div>
      </section>

      <section className="feature-section reverse shell">
        <div className="mode-stack" aria-hidden="true">
          {["Fidèle", "Propre", "Message", "Prompt / Code"].map((mode, index) => <div style={{ "--index": index } as React.CSSProperties} key={mode}><span>⌘{index + 1}</span>{mode}</div>)}
        </div>
        <div className="section-copy"><span className="mono-label">MODES / OUTPUT</span><h2>{t.modesTitle}</h2><p>{t.modesBody}</p></div>
      </section>

      <section className="security-band">
        <div className="shell security-grid">
          <div><span className="mono-label">CONTEXT / CONSENT</span><h2>{t.securityTitle}</h2><p>{t.securityBody}</p><Link className="inline-arrow" href={`/${locale}/security`}>{isFr ? "Voir le modèle de sécurité" : "See the security model"} →</Link></div>
          <div className="manifest-card"><span>MANIFEST / CLOUD</span><dl><dt>Speech instruction</dt><dd>128 chars</dd><dt>Selected text</dt><dd className="denied">DENIED</dd><dt>App name</dt><dd>Mail</dd><dt>Store response</dt><dd>false</dd></dl></div>
        </div>
      </section>

      <section className="shell pricing-section">
        <div className="section-heading"><span className="mono-label">PRICING / BYOK</span><h2>{t.pricingTitle}</h2></div>
        <Pricing locale={locale} compact />
        <Link className="inline-arrow centered" href={`/${locale}/pricing`}>{isFr ? "Comparer tous les plans et concurrents" : "Compare every plan and competitor"} →</Link>
      </section>

      <section className="faq shell">
        <h2>{t.faqTitle}</h2>
        {(isFr ? [
          ["Pressay envoie-t-il ma voix sur ses serveurs ?", "Non en local/BYOK : WhisperKit reste sur le Mac et les appels BYOK vont directement au fournisseur choisi."],
          ["Pourquoi demander Accessibilité ?", "L’édition Direct l’utilise pour prouver la cible et y insérer le résultat. Companion reste copy-only dans l’App Store."],
          ["Que devient mon presse-papiers ?", "Après une insertion réussie, Pressay restaure tous les items et formats présents avant la dictée. Une copie concurrente de ta part gagne toujours."],
          ["Les utilisateurs actuels paieront-ils ?", "Non. Les installations éligibles reçoivent Pro BYOK à vie via un claim Founding unique."]
        ] : [
          ["Does Pressay send my voice to its own servers?", "No in local/BYOK mode: WhisperKit stays on your Mac and BYOK requests go directly to your chosen provider."],
          ["Why does it need Accessibility?", "The Direct edition uses it to prove the target and insert text. The App Store Companion remains copy-only."],
          ["What happens to my clipboard?", "After a successful insertion, Pressay restores every item and format that existed before dictation. A concurrent copy from you always wins."],
          ["Will existing users have to pay?", "No. Eligible installations receive Pro BYOK for life through a one-time Founding claim."]
        ]).map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
      </section>

      <section className="final-cta"><div><span className="eyebrow">PRESS / SAY</span><h2>{isFr ? "Ta voix. Ta cible. Ton contrôle." : "Your voice. Your target. Your control."}</h2><Link className="button button-light" href={`/${locale}/download`}>{t.download}</Link></div></section>
    </main>
    <SiteFooter locale={locale} />
  </>;
}

function ProductDemo({ locale }: { locale: Locale }) {
  const isFr = locale === "fr";
  return <div className="product-demo" aria-label={isFr ? "Aperçu de Pressay" : "Pressay preview"}>
    <div className="window-bar"><span /><span /><span /><strong>Pressay / Mail</strong><em>VERIFIED</em></div>
    <div className="mail-surface">
      <span>To: équipe@press-say.app</span>
      <strong>{isFr ? "Point lancement" : "Launch update"}</strong>
      <p>{isFr ? "Bonjour, la version candidate est prête pour le dogfood. Le presse-papiers est désormais restitué après chaque insertion réussie." : "Hi, the release candidate is ready for dogfood. The clipboard is now restored after every successful insertion."}<i /></p>
    </div>
    <div className="voice-hud"><kbd>fn</kbd><div className="waveform">{Array.from({ length: 19 }, (_, i) => <i key={i} style={{ "--h": `${16 + ((i * 17) % 38)}%` } as React.CSSProperties} />)}</div><span>{isFr ? "Relâche pour écrire" : "Release to write"}</span></div>
    <div className="context-chip">TARGET <strong>Mail · Body</strong><span>CONTEXT 1 / 3</span></div>
  </div>;
}
