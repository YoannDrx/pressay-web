import { ContentPage } from "@/components/content-page";
import type { Locale } from "@/lib/content";

export function SecurityPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const cards = fr ? [
    ["Local signifie local", "Le modèle de transcription tourne sur ton Mac ou ton PC. Aucune voix ne passe par un serveur Pressay."],
    ["BYOK est direct", "Ta clé reste chiffrée sur ton ordinateur (Trousseau sur Mac, DPAPI de ton compte Windows sur PC) et les requêtes vont directement au fournisseur choisi."],
    ["Contexte consenti", "Le manifeste cloud montre chaque source et son contenu exact avant envoi."],
    ["Cible prouvée", "Application, fenêtre, champ et sélection sont revérifiés avant toute écriture."],
    ["Repli récupérable", "Si l’insertion échoue, le résultat reste copié. Si elle réussit, ton ancien presse-papiers revient."],
    ["Suppression réelle", "Historique, Inbox et compte produit disposent de parcours d’export et de suppression."]
  ] : [
    ["Local means local", "The transcription model runs on your Mac or PC. No voice passes through a Pressay server."],
    ["BYOK is direct", "Your key stays encrypted on your computer (Keychain on Mac, your Windows account’s DPAPI on PC) and requests go straight to your chosen provider."],
    ["Consented context", "The cloud manifest shows every source and its exact content before sending."],
    ["Proven target", "App, window, field and selection are checked again before any write."],
    ["Recoverable fallback", "If insertion fails, the result stays copied. If it succeeds, your previous clipboard comes back."],
    ["Real deletion", "History, Inbox and the product account all have export and deletion paths."]
  ];
  return <ContentPage locale={locale} title={fr ? "La confiance vient d’une preuve visible." : "Trust comes from visible proof."} intro={fr ? "Pressay réduit les permissions et montre la frontière exacte entre ton ordinateur, ton fournisseur et la cible d’écriture." : "Pressay minimizes permissions and shows the exact boundary between your computer, your provider and the writing target."}>
    <section className="security-cards">{cards.map(([title, body]) => <article key={title}><h2>{title}</h2><p>{body}</p></article>)}</section>
    <section className="plain-section"><h2>{fr ? "Données jamais collectées par le site" : "Data the site never collects"}</h2><p>{fr ? "Aucune dictée, sélection, clé BYOK ou historique. Les analytics sont absents par défaut et, s’ils sont ajoutés, resteront opt-in et limités à des événements produit sans contenu." : "No dictation, selection, BYOK key or history. Analytics are absent by default and, if added, will remain opt-in and limited to content-free product events."}</p></section>
  </ContentPage>;
}
