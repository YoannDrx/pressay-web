import { ComparisonTable } from "@/components/comparison-table";
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
      ? "Free reste illimité en local et sans compte. Pro ajoute les modes de réécriture, la traduction vers toutes les langues, les profils par application, BYOK, Apple Intelligence sur Mac, la synchronisation chiffrée entre tes appareils et Pressay Cloud ; les abonnements ouvriront après leur validation."
      : "Free stays unlimited locally and without an account. Pro adds rewrite modes, translation into every language, per-app profiles, BYOK, Apple Intelligence on Mac, encrypted sync between your devices and Pressay Cloud; subscriptions open once they are validated.";
  return (
    <ContentPage
      locale={locale}
      title={
        fr
          ? "Le local reste gratuit. Pro va plus loin."
          : "Local stays free. Pro goes further."
      }
      intro={intro}
    >
      <Pricing locale={locale} headingLevel={2} />
      <section className="pricing-compare" aria-labelledby="pricing-compare-title">
        <h2 id="pricing-compare-title">{fr ? "Comparaison factuelle" : "Factual comparison"}</h2>
        <ComparisonTable locale={locale} withFocus />
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
