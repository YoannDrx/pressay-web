import { ContentPage } from "@/components/content-page";
import { Pricing } from "@/components/pricing";
import type { Locale } from "@/lib/content";

export function PricingPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  return <ContentPage locale={locale} eyebrow="PRICING / AUG 2026" title={fr ? "Le local reste gratuit. Pro va plus loin." : "Local stays free. Pro goes further."} intro={fr ? "Free reste illimité en local et sans compte. Pro déverrouille les commandes avancées, Apple Intelligence, BYOK, la synchronisation chiffrée et un quota Cloud explicite." : "Free stays unlimited locally and without an account. Pro unlocks advanced commands, Apple Intelligence, BYOK, encrypted sync and an explicit Cloud allowance."}>
    <Pricing locale={locale} />
    <section className="comparison"><h2>{fr ? "Comparaison factuelle" : "Factual comparison"}</h2><div className="table-scroll"><table><thead><tr><th>Produit</th><th>Free</th><th>Pro mensuel</th><th>Annuel</th><th>Lifetime</th><th>{fr ? "Angle" : "Focus"}</th></tr></thead><tbody>
      <tr className="our-row"><th>Pressay</th><td>{fr ? "Local illimité" : "Unlimited local"}</td><td>7,99 €</td><td>69 €</td><td>—</td><td>{fr ? "Voice OS local, routes visibles" : "Local Voice OS, visible routes"}</td></tr>
      <tr><th>Superwhisper</th><td>{fr ? "Cloud limité" : "Limited cloud"}</td><td>$8.49</td><td>$84.99</td><td>$249.99</td><td>{fr ? "Modèles, modes, multiplateforme" : "Models, modes, cross-platform"}</td></tr>
      <tr><th>Wispr Flow</th><td>{fr ? "2 000 mots/sem. desktop" : "2,000 words/week desktop"}</td><td>$15</td><td>$12/mo</td><td>—</td><td>{fr ? "Cloud, commandes, équipes" : "Cloud, commands, teams"}</td></tr>
      <tr><th>MacWhisper</th><td>{fr ? "Transcription locale" : "Local transcription"}</td><td>—</td><td>—</td><td>64 €</td><td>{fr ? "Fichiers, réunions, workflows" : "Files, meetings, workflows"}</td></tr>
      <tr><th>VoiceInk</th><td>{fr ? "20 dictées/jour" : "20 dictations/day"}</td><td>$9</td><td>$50</td><td>—</td><td>{fr ? "Local Free, streaming Deepgram Pro" : "Local Free, Deepgram Pro streaming"}</td></tr>
    </tbody></table></div><p className="source-note">{fr ? "Prix officiels observés le 3 août 2026. Les devises et taxes peuvent varier." : "Official prices checked on August 3, 2026. Currency and taxes may vary."} <a href="https://superwhisper.com/docs/get-started/sw-pro">Superwhisper</a> · <a href="https://wisprflow.ai/pricing">Wispr Flow</a> · <a href="https://www.macwhisper.com/">MacWhisper</a> · <a href="https://www.voice-ink.com/">VoiceInk</a></p></section>
    <section className="plain-section"><h2>{fr ? "Pas de promesse silencieuse" : "No silent promise"}</h2><p>{fr ? "Le checkout reste fermé tant que Stripe, StoreKit, les quotas, la suppression de compte et les deux matrices de remboursement ne sont pas validés. Aucun lifetime n’est proposé au lancement." : "Checkout stays closed until Stripe, StoreKit, quotas, account deletion and both refund matrices are validated. No lifetime plan is offered at launch."}</p></section>
  </ContentPage>;
}
