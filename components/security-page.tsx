import { ContentPage } from "@/components/content-page";
import type { Locale } from "@/lib/content";

export function SecurityPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const cards = fr ? [
    ["Local signifie local", "Le modèle de transcription tourne sur le Mac. Aucune voix ne passe par un serveur Pressay."],
    ["BYOK est direct", "Ta clé reste dans le Trousseau et les requêtes vont directement au fournisseur choisi."],
    ["Contexte consenti", "Le manifeste cloud montre chaque source et son contenu exact avant envoi."],
    ["Cible prouvée", "Application, fenêtre, champ et sélection sont revérifiés avant toute écriture."],
    ["Repli récupérable", "Si l’insertion échoue, le résultat reste copié. Si elle réussit, ton ancien presse-papiers revient."],
    ["Suppression réelle", "Historique, Inbox et compte produit disposent de parcours d’export et de suppression."]
  ] : [
    ["Local means local", "The transcription model runs on the Mac. No voice passes through a Pressay server."],
    ["BYOK is direct", "Your key stays in Keychain and requests go straight to your chosen provider."],
    ["Consented context", "The cloud manifest shows every source and its exact content before sending."],
    ["Proven target", "App, window, field and selection are checked again before any write."],
    ["Recoverable fallback", "If insertion fails, the result stays copied. If it succeeds, your previous clipboard comes back."],
    ["Real deletion", "History, Inbox and the product account all have export and deletion paths."]
  ];
  return <ContentPage locale={locale} eyebrow="SECURITY / VISIBLE CONTRACT" title={fr ? "La confiance vient d’une preuve visible." : "Trust comes from visible proof."} intro={fr ? "Pressay réduit les permissions et montre la frontière exacte entre ton Mac, ton fournisseur et la cible d’écriture." : "Pressay minimizes permissions and shows the exact boundary between your Mac, provider and writing target."}>
    <section className="security-cards">{cards.map(([title, body], i) => <article key={title}><span>0{i + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</section>
    <section className="plain-section"><h2>{fr ? "Données jamais collectées par le site" : "Data the site never collects"}</h2><p>{fr ? "Aucune dictée, sélection, clé BYOK ou historique. Les analytics sont absents par défaut et, s’ils sont ajoutés, resteront opt-in et limités à des événements produit sans contenu." : "No dictation, selection, BYOK key or history. Analytics are absent by default and, if added, will remain opt-in and limited to content-free product events."}</p></section>
  </ContentPage>;
}
