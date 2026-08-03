export type Locale = "fr" | "en";

export const locales: Locale[] = ["fr", "en"];

export const copy = {
  fr: {
    nav: { product: "Produit", security: "Sécurité", pricing: "Tarifs", download: "Télécharger", signIn: "Connexion" },
    eyebrow: "DICTÉE CONTRÔLABLE POUR macOS",
    title: "Maintiens Fn. Parle. C’est écrit.",
    intro: "Pressay écrit et transforme ta voix partout sur macOS. Tu vois la cible, tu choisis le contexte et ton presse-papiers revient exactement comme avant.",
    download: "Télécharger pour macOS",
    seePricing: "Voir les tarifs",
    proofs: [
      ["Partout", "Mail, Slack, navigateur, IDE et terminal."],
      ["Local ou BYOK", "WhisperKit sur ton Mac, ou ta propre clé API."],
      ["Réversible", "Cible vérifiée, aperçu éditable, presse-papiers préservé."]
    ],
    demoTitle: "La cible reste visible.",
    demoBody: "Pressay capture l’application et le champ au début, puis les revérifie juste avant l’insertion. Si la preuve n’est plus valable, le texte est copié — jamais collé ailleurs.",
    modesTitle: "Une voix. Le bon format.",
    modesBody: "Fidèle pour garder tes mots. Propre pour retirer les hésitations. Message, Email, Prompt, Commit ou Ticket quand la forme compte.",
    securityTitle: "Le contexte n’est jamais implicite.",
    securityBody: "Avant un traitement cloud, Pressay montre les sources, le nombre de caractères et le contenu autorisé. Les champs sécurisés sont refusés avant même d’ouvrir le micro.",
    pricingTitle: "Commence gratuitement. Passe Pro quand tes workflows le demandent.",
    faqTitle: "Questions fréquentes"
  },
  en: {
    nav: { product: "Product", security: "Security", pricing: "Pricing", download: "Download", signIn: "Sign in" },
    eyebrow: "CONTROLLED DICTATION FOR macOS",
    title: "Hold Fn. Speak. It’s written.",
    intro: "Pressay writes and transforms your voice anywhere on macOS. You can see the target, choose the context, and get your clipboard back exactly as it was.",
    download: "Download for macOS",
    seePricing: "See pricing",
    proofs: [
      ["Everywhere", "Mail, Slack, browsers, IDEs and terminals."],
      ["Local or BYOK", "WhisperKit on your Mac, or your own API key."],
      ["Reversible", "Verified target, editable preview, preserved clipboard."]
    ],
    demoTitle: "The target stays visible.",
    demoBody: "Pressay captures the app and field up front, then verifies both again before insertion. If proof is no longer valid, the text is copied — never pasted somewhere else.",
    modesTitle: "One voice. The right shape.",
    modesBody: "Faithful keeps your words. Clean removes hesitation. Message, Email, Prompt, Commit or Ticket handle the format when it matters.",
    securityTitle: "Context is never implicit.",
    securityBody: "Before cloud processing, Pressay shows every source, character count and authorized payload. Secure fields are rejected before the microphone even opens.",
    pricingTitle: "Start free. Go Pro when your workflows need it.",
    faqTitle: "Frequently asked questions"
  }
} satisfies Record<Locale, Record<string, unknown>>;

export const plans = [
  {
    code: "free",
    name: "Free",
    monthly: "0 €",
    detailFr: "Sans compte obligatoire",
    detailEn: "No account required",
    featuresFr: ["Dictée locale/BYOK illimitée", "Modes Fidèle, Propre et Message", "Historique chiffré 24 h", "Export et suppression toujours gratuits"],
    featuresEn: ["Unlimited local/BYOK dictation", "Faithful, Clean and Message modes", "24-hour encrypted history", "Export and deletion always free"]
  },
  {
    code: "pro_byok",
    name: "Pro BYOK",
    monthly: "7,99 € / mois",
    detailFr: "69 € / an · essai 14 jours sans carte",
    detailEn: "€69 / year · 14-day trial, no card",
    featuresFr: ["Tous les modes et modes personnalisés", "Profils par application", "Historique enrichi 30 jours", "Voice Inbox et outils développeur livrés", "Jusqu’à 3 Mac"],
    featuresEn: ["All modes and custom modes", "Per-app profiles", "30-day enriched history", "Delivered Voice Inbox and developer tools", "Up to 3 Macs"]
  },
  {
    code: "lifetime_byok",
    name: "Lifetime BYOK",
    monthly: "149 €",
    detailFr: "Offre Founding, paiement unique",
    detailEn: "Founding offer, one-time payment",
    featuresFr: ["Même périmètre local/BYOK que Pro", "Aucun abonnement", "Cloud géré, sync hébergée et Teams exclus"],
    featuresEn: ["Same local/BYOK scope as Pro", "No subscription", "Managed cloud, hosted sync and Teams excluded"]
  }
] as const;
