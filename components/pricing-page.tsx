import { ContentPage } from "@/components/content-page";
import { Pricing } from "@/components/pricing";
import type { Locale } from "@/lib/content";
import { publicReleaseCapabilities } from "@/lib/public-release-capabilities";

export function PricingPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const release = publicReleaseCapabilities();
  const intro = release.proScopeValidated
    ? fr
      ? "Free reste illimité en local et sans compte. Pro ajoute les workflows avancés et les routes validées affichées avant traitement."
      : "Free stays unlimited locally and without an account. Pro adds advanced workflows and validated routes shown before processing."
    : fr
      ? "Free reste illimité en local et sans compte. Pro ajoute les modes de réécriture, les profils par application, BYOK, Apple Intelligence, la synchronisation chiffrée et Pressay Cloud ; les abonnements ouvriront après leur validation."
      : "Free stays unlimited locally and without an account. Pro adds rewrite modes, per-app profiles, BYOK, Apple Intelligence, encrypted sync and Pressay Cloud; subscriptions open once they are validated.";
  return (
    <ContentPage
      locale={locale}
      eyebrow="FREE / PRO"
      title={
        fr
          ? "Le local reste gratuit. Pro va plus loin."
          : "Local stays free. Pro goes further."
      }
      intro={intro}
    >
      <Pricing locale={locale} />
      <section className="comparison">
        <h2>{fr ? "Comparaison factuelle" : "Factual comparison"}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{fr ? "Produit" : "Product"}</th>
                <th>Free</th>
                <th>{fr ? "Pro mensuel" : "Pro monthly"}</th>
                <th>{fr ? "Annuel" : "Annual"}</th>
                <th>{fr ? "À vie" : "Lifetime"}</th>
                <th>{fr ? "Angle" : "Focus"}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="our-row">
                <th>Pressay</th>
                <td>{fr ? "Local illimité" : "Unlimited local"}</td>
                <td>{fr ? "7,99 €" : "€7.99"}</td>
                <td>{fr ? "69 €" : "€69"}</td>
                <td>—</td>
                <td>
                  {fr
                    ? "Voice OS local, routes visibles"
                    : "Local Voice OS, visible routes"}
                </td>
              </tr>
              <tr>
                <th>Superwhisper</th>
                <td>
                  {fr
                    ? "Whisper local illimité, sans IA"
                    : "Unlimited local Whisper, no AI"}
                </td>
                <td>$8.49</td>
                <td>$84.99</td>
                <td>$249.99</td>
                <td>
                  {fr
                    ? "Modèles, modes, multiplateforme"
                    : "Models, modes, cross-platform"}
                </td>
              </tr>
              <tr>
                <th>Wispr Flow</th>
                <td>
                  {fr ? "2 000 mots/semaine" : "2,000 words/week"}
                </td>
                <td>$15</td>
                <td>$12/mo</td>
                <td>—</td>
                <td>
                  {fr ? "Équipes, prise de notes" : "Teams, notetaker"}
                </td>
              </tr>
              <tr>
                <th>MacWhisper</th>
                <td>{fr ? "Transcription locale" : "Local transcription"}</td>
                <td>—</td>
                <td>—</td>
                <td>64 €</td>
                <td>
                  {fr
                    ? "Fichiers, réunions, workflows"
                    : "Files, meetings, workflows"}
                </td>
              </tr>
              <tr>
                <th>VoiceInk</th>
                <td>{fr ? "20 transcriptions/jour" : "20 transcriptions/day"}</td>
                <td>$9</td>
                <td>$50</td>
                <td>—</td>
                <td>
                  {fr
                    ? "Local Free, streaming Deepgram Pro"
                    : "Local Free, Deepgram Pro streaming"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="source-note">
          {fr
            ? "Prix relevés sur les pages officielles le 31 octobre 2026 ; annuel Wispr Flow affiché par mois. Les devises et taxes peuvent varier."
            : "Prices checked on the official pages on October 31, 2026; Wispr Flow annual shown per month. Currency and taxes may vary."}{" "}
          <a href="https://superwhisper.com/docs/get-started/sw-pro">
            Superwhisper
          </a>{" "}
          · <a href="https://wisprflow.ai/pricing">Wispr Flow</a> ·{" "}
          <a href="https://www.macwhisper.com/">MacWhisper</a> ·{" "}
          <a href="https://www.voice-ink.com/">VoiceInk</a>
        </p>
      </section>
      <section className="plain-section">
        <h2>{fr ? "Pas de promesse silencieuse" : "No silent promise"}</h2>
        <p>
          {release.commercialOfferReady
            ? fr
              ? "Pro se résilie à tout moment depuis ton espace compte ; l’accès reste actif jusqu’à la fin de la période payée. La dictée locale gratuite reste disponible sans compte. Aucun abonnement à vie n’est proposé."
              : "Cancel Pro at any time from your account; access continues until the end of the paid period. Free local dictation remains available without an account. No lifetime subscription is offered."
            : fr
              ? "Les offres payantes ouvriront prochainement. La dictée locale gratuite reste disponible sans compte. Aucun abonnement à vie n’est proposé."
              : "Paid plans are coming soon. Free local dictation remains available without an account. No lifetime subscription is offered."}
        </p>
      </section>
    </ContentPage>
  );
}
