export type Locale = "fr" | "en";

export const locales: Locale[] = ["fr", "en"];

export const copy = {
  fr: {
    nav: { product: "Produit", security: "Sécurité", pricing: "Tarifs", download: "Télécharger", signIn: "Connexion" },
    eyebrow: "DICTÉE CONTRÔLABLE POUR macOS",
    title: "Votre voix, partout où vous écrivez.",
    intro: "Parlez naturellement. Pressay transforme vos idées en texte clair dans toutes vos apps — en local ou avec votre propre clé.",
    download: "Télécharger pour macOS",
    seePricing: "Voir les tarifs",
    proofs: [
      ["Partout", "Mail, Slack, navigateur, IDE et terminal."],
      ["Local par défaut", "Trois modèles locaux, puis Apple Intelligence, BYOK ou Cloud sur choix explicite."],
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
    title: "Your voice, wherever you write.",
    intro: "Speak naturally. Pressay turns your ideas into clear text in every app — locally or with your own key.",
    download: "Download for macOS",
    seePricing: "See pricing",
    proofs: [
      ["Everywhere", "Mail, Slack, browsers, IDEs and terminals."],
      ["Local by default", "Three local models, then Apple Intelligence, BYOK or Cloud by explicit choice."],
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
    featuresFr: ["Dictée locale illimitée", "Raccourci, Voice Bar et insertion", "Dictionnaire de base", "Historique local facultatif"],
    featuresEn: ["Unlimited local dictation", "Shortcut, Voice Bar and insertion", "Basic dictionary", "Optional local history"]
  },
  {
    code: "pro_byok",
    name: "Pro",
    monthly: "7,99 € / mois",
    detailFr: "69 € / an · aucun essai automatique",
    detailEn: "€69 / year · no automatic trial",
    featuresFr: ["Commandes Voice Bar avancées", "Modes et profils par application", "Apple Intelligence et BYOK", "Synchronisation chiffrée", "Quota Pressay Cloud"],
    featuresEn: ["Advanced Voice Bar commands", "Modes and per-app profiles", "Apple Intelligence and BYOK", "Encrypted sync", "Pressay Cloud allowance"]
  }
] as const;
