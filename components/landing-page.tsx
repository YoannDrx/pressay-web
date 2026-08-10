import Link from "next/link";
import { AppLogoMarquee } from "@/components/app-logo-marquee";
import { ImmersiveStory, PageRevealEffects } from "@/components/immersive-story";
import { Pricing } from "@/components/pricing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/content";
import { copy } from "@/lib/content";

export function LandingPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const fr = locale === "fr";
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Pressay",
      applicationCategory: "ProductivityApplication", operatingSystem: "macOS 14 or later",
      url: `https://press-say.app/${locale}`, downloadUrl: "https://press-say.app/download/pressay",
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Pro BYOK monthly", price: "7.99", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Pro BYOK annual", price: "69", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Lifetime BYOK", price: "149", priceCurrency: "EUR" }
      ]
    }).replaceAll("<", "\\u003c") }} />
    <PageRevealEffects />
    <SiteHeader locale={locale} />
    <main className="immersive-home">
      <section className="cinema-hero">
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="hero-key key-left" aria-hidden="true"><span>fn</span></div>
        <div className="hero-key key-right" aria-hidden="true"><span>⌘</span></div>
        <div className="cinema-copy">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{fr ? <>Votre voix,<br /><span>partout où vous écrivez.</span></> : <>Your voice,<br /><span>wherever you write.</span></>}</h1>
          <p>{fr ? "Parlez naturellement. Pressay transforme vos idées en texte clair dans Mail, Slack, Cursor et toutes vos apps — en local ou avec votre propre clé." : "Speak naturally. Pressay turns your ideas into clear text in Mail, Slack, Cursor and every app — locally or with your own key."}</p>
          <div className="hero-actions">
            <Link className="button button-primary hero-download" href={`/${locale}/download`}><span>⌘</span>{t.download}</Link>
            <Link className="button button-glass" href="#experience">{fr ? "Voir comment ça marche" : "See how it works"}</Link>
          </div>
          <small>macOS 14+ · Apple Silicon & Intel · {fr ? "Free sans compte" : "Free without an account"}</small>
        </div>
        <div className="hero-voice" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><span>PRESS · SAY</span><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <a className="scroll-invite" href="#experience"><span>{fr ? "Fais défiler pour entrer dans Pressay" : "Scroll to step inside Pressay"}</span><i>↓</i></a>
      </section>

      <div id="experience"><ImmersiveStory locale={locale} /></div>

      <section className="everywhere-section" id="product">
        <div className="shell" data-reveal>
          <span className="mono-label">ONE SHORTCUT / EVERYWHERE</span>
          <h2>{fr ? <>Là où tu peux écrire,<br /><span>tu peux parler.</span></> : <>Wherever you can type,<br /><span>you can speak.</span></>}</h2>
        </div>
        <AppLogoMarquee locale={locale} />
        <div className="workflow-cards shell">
          <article data-reveal><span>MAIL</span><p>{fr ? "Rédige une réponse nette sans quitter le fil." : "Draft a crisp reply without leaving the thread."}</p><div className="mini-mail"><i />{fr ? "Bonjour, voici le point demandé…" : "Hi, here is the update you asked for…"}</div></article>
          <article data-reveal><span>CODE</span><p>{fr ? "Donne plus de contexte à Cursor, Xcode ou ton terminal." : "Give Cursor, Xcode or your terminal richer context."}</p><pre><b>❯</b> {fr ? "Ajoute un test de non-régression…" : "Add a regression test…"}<i /></pre></article>
          <article data-reveal><span>MESSAGE</span><p>{fr ? "Parle librement. Pressay garde ton ton, pas tes hésitations." : "Speak freely. Pressay keeps your tone, not your hesitation."}</p><div className="mini-message">{fr ? "On valide ça demain matin ?" : "Shall we lock this in tomorrow morning?"}</div></article>
        </div>
      </section>

      <section className="modes-planet">
        <div className="planet-glow" aria-hidden="true" />
        <div className="shell modes-layout">
          <div data-reveal><span className="mono-label">MODES / OUTPUT</span><h2>{fr ? "Ta voix ne change pas. Sa forme, oui." : "Your voice stays yours. Its shape adapts."}</h2><p>{t.modesBody}</p><Link className="inline-arrow" href={`/${locale}/pricing`}>{fr ? "Découvrir tous les modes" : "Explore every mode"} →</Link></div>
          <div className="mode-orbit" aria-label={fr ? "Modes Pressay" : "Pressay modes"}>
            <div className="orbit-core"><span>fn</span><small>PRESSAY</small></div>
            {["Fidèle", "Propre", "Message", "Email", "Prompt", "Commit"].map((mode, index) => <div className={`orbit-mode orbit-${index}`} key={mode}><i>0{index + 1}</i>{mode}</div>)}
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="shell trust-intro" data-reveal><span className="mono-label">LOCAL / VISIBLE / REVERSIBLE</span><h2>{fr ? "L’IA qui montre ses mains." : "AI that shows its hands."}</h2><p>{t.securityBody}</p></div>
        <div className="trust-grid shell">
          {(fr ? [
            ["01", "Local d’abord", "WhisperKit peut transcrire entièrement sur ton Mac. Aucune voix sur nos serveurs."],
            ["02", "BYOK direct", "Ta clé reste dans le Trousseau. Les requêtes vont au fournisseur choisi, pas à Pressay."],
            ["03", "Réversible", "Aperçu, annulation locale, copie de secours et export restent sous ton contrôle."],
          ] : [
            ["01", "Local first", "WhisperKit can transcribe entirely on your Mac. No voice reaches our servers."],
            ["02", "Direct BYOK", "Your key stays in Keychain. Requests go to your provider, not through Pressay."],
            ["03", "Reversible", "Preview, local undo, safety copy and export remain under your control."],
          ]).map(([number, title, body]) => <article data-reveal key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
        <Link className="security-link" href={`/${locale}/security`}>{fr ? "Ouvrir le modèle de sécurité" : "Open the security model"}<span>↗</span></Link>
      </section>

      <section className="proof-ribbon" aria-label={fr ? "Preuves Pressay" : "Pressay proofs"}>{t.proofs.map(([title, detail], index) => <div key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{detail}</p></div>)}</section>

      <section className="shell pricing-section immersive-pricing">
        <div className="section-heading" data-reveal><div><span className="mono-label">FREE / PRO BYOK / LIFETIME</span><h2>{t.pricingTitle}</h2></div><p>{fr ? "La dictée locale reste généreuse. Pro débloque les workflows avancés, pas ta propre voix." : "Local dictation stays generous. Pro unlocks advanced workflows, not your own voice."}</p></div>
        <Pricing locale={locale} compact />
        <Link className="inline-arrow centered" href={`/${locale}/pricing`}>{fr ? "Comparer les plans en détail" : "Compare plans in detail"} →</Link>
      </section>

      <section className="faq shell">
        <div data-reveal><span className="mono-label">FAQ / NO FINE PRINT</span><h2>{t.faqTitle}</h2></div>
        {(fr ? [
          ["Pressay envoie-t-il ma voix sur ses serveurs ?", "Non en local/BYOK : WhisperKit reste sur le Mac et les appels BYOK vont directement au fournisseur choisi."],
          ["Pourquoi demander Accessibilité ?", "L’édition Direct l’utilise pour prouver la cible et y insérer le résultat. Companion reste copy-only dans l’App Store."],
          ["Que devient mon presse-papiers ?", "Après une insertion réussie, Pressay restaure tous les items et formats présents avant la dictée. Une copie concurrente de ta part gagne toujours."],
          ["Les utilisateurs actuels paieront-ils ?", "Non. Les installations éligibles reçoivent Pro BYOK à vie via un claim Founding unique."],
        ] : [
          ["Does Pressay send my voice to its own servers?", "No in local/BYOK mode: WhisperKit stays on your Mac and BYOK requests go directly to your chosen provider."],
          ["Why does it need Accessibility?", "The Direct edition uses it to prove the target and insert text. The App Store Companion remains copy-only."],
          ["What happens to my clipboard?", "After a successful insertion, Pressay restores every item and format that existed before dictation. A concurrent copy from you always wins."],
          ["Will existing users have to pay?", "No. Eligible installations receive Pro BYOK for life through a one-time Founding claim."],
        ]).map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
      </section>

      <section className="final-cta immersive-cta"><div className="cta-orb" aria-hidden="true" /><div data-reveal><span className="eyebrow">PRESS / SAY</span><h2>{fr ? <>Parlez.<br />Le clavier suit.</> : <>Speak.<br />The keyboard follows.</>}</h2><p>{fr ? "Votre voix. Votre cible. Votre contrôle." : "Your voice. Your target. Your control."}</p><Link className="button button-light" href={`/${locale}/download`}>{t.download}</Link></div></section>
    </main>
    <SiteFooter locale={locale} />
  </>;
}
