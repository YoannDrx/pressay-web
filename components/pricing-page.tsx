import { ContentPage } from "@/components/content-page";
import { Pricing } from "@/components/pricing";
import type { Locale } from "@/lib/content";

export function PricingPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  return <ContentPage locale={locale} eyebrow="PRICING / AUG 2026" title={fr ? "Un Free généreux. Un Pro qui paie le contrôle." : "A generous Free. A Pro that pays for control."} intro={fr ? "Free reste illimité en local/BYOK. Pro déverrouille les workflows avancés sans revendre ton usage ni imposer un cloud Pressay." : "Free stays unlimited for local/BYOK dictation. Pro unlocks advanced workflows without reselling usage or forcing a Pressay cloud."}>
    <Pricing locale={locale} />
    <section className="comparison"><h2>{fr ? "Comparaison factuelle" : "Factual comparison"}</h2><div className="table-scroll"><table><thead><tr><th>Produit</th><th>Free</th><th>Pro mensuel</th><th>Annuel</th><th>Lifetime</th><th>{fr ? "Angle" : "Focus"}</th></tr></thead><tbody>
      <tr className="our-row"><th>Pressay</th><td>{fr ? "Local/BYOK illimité" : "Unlimited local/BYOK"}</td><td>7,99 €</td><td>69 €</td><td>149 €</td><td>{fr ? "Cible, contexte, réversibilité" : "Target, context, reversibility"}</td></tr>
      <tr><th>Superwhisper</th><td>{fr ? "Cloud limité" : "Limited cloud"}</td><td>$8.49</td><td>$84.99</td><td>$249.99</td><td>{fr ? "Modèles, modes, multiplateforme" : "Models, modes, cross-platform"}</td></tr>
      <tr><th>Wispr Flow</th><td>{fr ? "2 000 mots/sem. desktop" : "2,000 words/week desktop"}</td><td>$15</td><td>$12/mo</td><td>—</td><td>{fr ? "Cloud, commandes, équipes" : "Cloud, commands, teams"}</td></tr>
      <tr><th>MacWhisper</th><td>{fr ? "Transcription locale" : "Local transcription"}</td><td>—</td><td>—</td><td>64 €</td><td>{fr ? "Fichiers, réunions, workflows" : "Files, meetings, workflows"}</td></tr>
      <tr><th>VoiceInk</th><td>{fr ? "20 dictées/jour" : "20 dictations/day"}</td><td>$9</td><td>$50</td><td>—</td><td>{fr ? "Local Free, streaming Deepgram Pro" : "Local Free, Deepgram Pro streaming"}</td></tr>
    </tbody></table></div><p className="source-note">{fr ? "Prix officiels observés le 3 août 2026. Les devises et taxes peuvent varier." : "Official prices checked on August 3, 2026. Currency and taxes may vary."} <a href="https://superwhisper.com/docs/get-started/sw-pro">Superwhisper</a> · <a href="https://wisprflow.ai/pricing">Wispr Flow</a> · <a href="https://www.macwhisper.com/">MacWhisper</a> · <a href="https://www.voice-ink.com/">VoiceInk</a></p></section>
    <section className="plain-section"><h2>{fr ? "Ce qui n’est pas vendu" : "What is not being sold"}</h2><p>{fr ? "Pro Cloud, synchronisation hébergée et Teams ne figurent dans aucune offre. Ils ne seront ajoutés qu’après validation des quotas, de la marge, de la suppression de compte et de l’observabilité." : "Managed Cloud, hosted sync and Teams are not included in any offer. They will only be added after quotas, margin, account deletion and observability are proven."}</p></section>
  </ContentPage>;
}
