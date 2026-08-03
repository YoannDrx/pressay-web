import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content-page";
import type { Locale } from "@/lib/content";

const legalPages = ["privacy", "terms", "support"] as const;
export function generateStaticParams() { return ["fr", "en"].flatMap((locale) => legalPages.map((legal) => ({ locale, legal }))); }

export default async function LegalPage({ params }: { params: Promise<{ locale: string; legal: string }> }) {
  const { locale, legal } = await params;
  if (!(["fr", "en"] as string[]).includes(locale) || !(legalPages as readonly string[]).includes(legal)) notFound();
  const lang = locale as Locale;
  const fr = lang === "fr";
  const content = {
    privacy: { title: fr ? "Politique de confidentialité" : "Privacy policy", body: fr ? "Le site ne collecte aucune dictée, sélection, clé API ou historique. L’app conserve ses données localement et n’envoie au fournisseur choisi que les données affichées dans le manifeste de consentement. Les données de compte et facturation sont limitées à l’identité, aux appareils, aux entitlements et aux identifiants Stripe nécessaires au service." : "The website collects no dictation, selection, API key or history. The app stores its data locally and only sends the chosen provider data shown in the consent manifest. Account and billing data is limited to identity, devices, entitlements and Stripe identifiers required for the service." },
    terms: { title: fr ? "Conditions d’utilisation" : "Terms of use", body: fr ? "Pressay Free est fourni sans garantie de disponibilité permanente. Les plans Pro donnent accès uniquement aux fonctions effectivement indiquées au moment de l’achat. Lifetime BYOK exclut le cloud géré, la synchronisation hébergée et Teams. Les achats et remboursements suivent les conditions affichées par Stripe et le droit applicable." : "Pressay Free is provided without a guarantee of permanent availability. Pro plans grant access only to features actually listed at purchase time. Lifetime BYOK excludes managed cloud, hosted sync and Teams. Purchases and refunds follow the terms shown by Stripe and applicable law." },
    support: { title: "Support", body: fr ? "Pour un bug, joins la version de Pressay, macOS, l’application cible et les étapes de reproduction — jamais une clé API ni le contenu d’une dictée sensible." : "For a bug, include the Pressay version, macOS version, target app and reproduction steps — never an API key or sensitive dictation content." }
  }[legal as typeof legalPages[number]];
  return <ContentPage locale={lang} eyebrow={`LEGAL / ${legal.toUpperCase()}`} title={content.title}><section className="legal-copy"><p>{content.body}</p>{legal === "support" ? <a className="button" href="mailto:support@press-say.app">support@press-say.app</a> : null}<p><small>{fr ? "Dernière mise à jour : 3 août 2026." : "Last updated: August 3, 2026."}</small></p></section></ContentPage>;
}
