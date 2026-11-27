export type Locale = "fr" | "en";
export type Platform = "macos" | "windows";

export const locales: Locale[] = ["fr", "en"];

/** Shared chrome strings (header, footer, download labels). */
export const copy = {
  fr: {
    nav: { how: "Fonctionnement", translate: "Traduction", security: "Sécurité", pricing: "Tarifs", download: "Télécharger", account: "Mon compte" },
    download: { macos: "Télécharger pour macOS", windows: "Télécharger pour Windows" },
    tagline: "Appuie. Parle. C’est écrit.",
  },
  en: {
    nav: { how: "How it works", translate: "Translation", security: "Security", pricing: "Pricing", download: "Download", account: "My account" },
    download: { macos: "Download for macOS", windows: "Download for Windows" },
    tagline: "Press. Speak. It’s written.",
  },
} satisfies Record<Locale, Record<string, unknown>>;

/** Default shortcuts of the desktop app (pressay/src-tauri/src/settings.rs). */
export const shortcuts: Record<Locale, Record<Platform, { dictate: string[]; translate: string[] }>> = {
  fr: {
    macos: { dictate: ["⌥ Option", "Espace"], translate: ["⌥ Option", "⇧ Maj", "Espace"] },
    windows: { dictate: ["Ctrl", "Win"], translate: ["Ctrl", "Maj", "Win"] },
  },
  en: {
    macos: { dictate: ["⌥ Option", "Space"], translate: ["⌥ Option", "⇧ Shift", "Space"] },
    windows: { dictate: ["Ctrl", "Win"], translate: ["Ctrl", "Shift", "Win"] },
  },
};

export const systemRequirements: Record<Locale, Record<Platform, string>> = {
  fr: { macos: "macOS 14 ou plus récent · Apple Silicon", windows: "Windows 10 (22H2) ou 11 · x64 et ARM64" },
  en: { macos: "macOS 14 or later · Apple Silicon", windows: "Windows 10 (22H2) or 11 · x64 and ARM64" },
};

export const plans = [
  {
    code: "free",
    name: "Free",
    detailFr: "Sans compte obligatoire",
    detailEn: "No account required",
    featuresFr: ["Dictée locale illimitée, hors ligne", "Dicter et traduire vers l’anglais, en local", "Modes Fidèle et Propre", "Raccourci, Voice Bar et insertion dans l’app ouverte", "Commandes vocales de base et dictionnaire", "Historique local facultatif"],
    featuresEn: ["Unlimited offline local dictation", "Dictate and translate into English, locally", "Faithful and Clean modes", "Shortcut, Voice Bar and insertion in the open app", "Basic voice commands and dictionary", "Optional local history"],
  },
  {
    code: "pro",
    name: "Pro",
    detailFr: "69 € / an · aucun essai automatique",
    detailEn: "€69 / year · no automatic trial",
    // Mirrors the Pro column of the desktop capability matrix
    // (pressay/src-tauri/src/capabilities.rs).
    featuresFr: ["Tout Free, plus :", "Modes de réécriture (Message, Email, Prompt, Commit, Ticket…) et modes personnalisés", "Dicter et traduire vers n’importe quelle langue", "Profils par application", "Correction vocale du dernier résultat", "BYOK (ta propre clé) et Apple Intelligence sur Mac", "Synchronisation chiffrée entre tes appareils", "Quota Pressay Cloud inclus", "Jusqu’à 3 appareils (Mac ou PC)"],
    featuresEn: ["Everything in Free, plus:", "Rewrite modes (Message, Email, Prompt, Commit, Ticket…) and custom modes", "Dictate and translate into any language", "Per-app profiles", "Voice correction of the last result", "BYOK (your own key) and Apple Intelligence on Mac", "Encrypted sync between your devices", "Pressay Cloud allowance included", "Up to 3 devices (Mac or PC)"],
  },
] as const;

/**
 * Factual price comparison shared by the landing and the pricing page.
 * Prices were read on each vendor's official page on `checkedOn`.
 */
export const comparison = {
  checkedOn: { fr: "31 octobre 2026", en: "October 31, 2026" },
  sources: [
    ["Superwhisper", "https://superwhisper.com/docs/get-started/sw-pro"],
    ["Wispr Flow", "https://wisprflow.ai/pricing"],
    ["MacWhisper", "https://www.macwhisper.com/"],
    ["VoiceInk", "https://www.voice-ink.com/"],
  ],
  rows: [
    { name: "Pressay", ours: true, free: { fr: "Dictée locale illimitée", en: "Unlimited local dictation" }, monthly: { fr: "7,99 €", en: "€7.99" }, annual: { fr: "69 €", en: "€69" }, lifetime: "—", focus: { fr: "Dictée locale sur Mac et PC, traduction", en: "Local dictation on Mac and PC, translation" } },
    { name: "Superwhisper", ours: false, free: { fr: "Whisper local illimité, sans IA", en: "Unlimited local Whisper, no AI" }, monthly: { fr: "$8.49", en: "$8.49" }, annual: { fr: "$84.99", en: "$84.99" }, lifetime: "$249.99", focus: { fr: "Modèles, modes, multiplateforme", en: "Models, modes, cross-platform" } },
    { name: "Wispr Flow", ours: false, free: { fr: "2 000 mots/semaine", en: "2,000 words/week" }, monthly: { fr: "$15", en: "$15" }, annual: { fr: "$12/mois", en: "$12/mo" }, lifetime: "—", focus: { fr: "Équipes, prise de notes", en: "Teams, notetaker" } },
    { name: "MacWhisper", ours: false, free: { fr: "Transcription locale", en: "Local transcription" }, monthly: { fr: "—", en: "—" }, annual: { fr: "—", en: "—" }, lifetime: "64 €", focus: { fr: "Fichiers, réunions, workflows", en: "Files, meetings, workflows" } },
    { name: "VoiceInk", ours: false, free: { fr: "20 transcriptions/jour", en: "20 transcriptions/day" }, monthly: { fr: "$9", en: "$9" }, annual: { fr: "$50", en: "$50" }, lifetime: "—", focus: { fr: "Local Free, streaming Deepgram Pro", en: "Local Free, Deepgram Pro streaming" } },
  ],
} as const;

type LandingFlags = { windowsAvailable: boolean; remoteRoutesPublished: boolean };

/** Every string of the landing page, in the visitor's language. */
export function landingCopy(locale: Locale, { windowsAvailable, remoteRoutesPublished }: LandingFlags) {
  return locale === "fr" ? {
    hero: {
      title: ["Là où tu peux écrire,", "tu peux parler."],
      lede: "Appuie sur un raccourci, parle, relâche : le texte s’écrit dans l’app ouverte. La transcription tourne sur ton Mac ou ton PC, hors ligne et sans compte.",
      free: "Gratuit, dictée locale illimitée",
      also: { macos: "Aussi pour Windows 10 et 11", windows: "Aussi pour macOS 14+" },
      windowsSoon: "Windows arrive bientôt",
      demoLabel: "Démonstration : on maintient le raccourci, on parle, et la phrase s’écrit dans le champ de texte, sur Mac puis sur PC.",
      status: { idle: "Prêt", listening: "Écoute…", written: "Écrit" },
      local: "Local",
      scenes: [
        { platform: "macos", app: "Mail", field: "À : Camille · Objet : Point produit", text: "Salut Camille, on peut décaler le point produit à jeudi 10 h ? Je t’envoie la maquette avant." },
        { platform: "windows", app: "Teams", field: "# design", text: "La nouvelle maquette est en ligne. Vos retours avant vendredi midi, merci !" },
      ],
    },
    how: {
      title: "Appuie, parle, c’est écrit.",
      intro: "Pas de fenêtre à ouvrir ni de texte à copier. Pressay se glisse entre ta voix et le champ où se trouve ton curseur.",
      steps: [
        { title: "Appuie", body: "Maintiens le raccourci. Il se change dans les réglages." },
        { title: "Parle", body: "À ton rythme, dans ta langue. La Voice Bar montre que le micro écoute, et où le texte sera traité." },
        { title: "C’est écrit", body: "Relâche : le texte arrive là où tu écrivais. Mail, Slack, ton éditeur de code, un formulaire web." },
      ],
      onMac: "Sur Mac",
      onPc: "Sur PC",
      waveLabel: "Ta voix",
      written: "Point produit jeudi 10 h.",
    },
    translate: {
      title: "Dicte en français, envoie en anglais.",
      body: "Un second raccourci traduit pendant que tu dictes. Tu parles français, le texte arrive en anglais, prêt à partir.",
      said: "Tu dis",
      written: "Pressay écrit",
      spoken: "Bonjour à tous, je confirme la démo de mardi. On vous envoie le lien d’ici ce soir.",
      result: "Hi everyone, I’m confirming Tuesday’s demo. We’ll send you the link by tonight.",
      free: { title: "Vers l’anglais", body: "Gratuit et local, sur ton ordinateur." },
      pro: { title: "Vers n’importe quelle langue", body: "Espagnol, allemand, japonais… avec Pro." },
    },
    modes: {
      title: "Une voix, la bonne forme.",
      body: "Choisis un mode avant de parler. Fidèle garde tes mots, Propre retire les hésitations, les autres réécrivent pour l’usage.",
      spokenLabel: "Ce que tu dis",
      spoken: "euh donc pour demain faut qu’on, enfin, qu’on décale le point produit à dix heures et que Léa envoie la maquette avant",
      outputLabel: "Ce que Pressay écrit",
      rows: [
        { name: "Fidèle", plan: "Free", output: "Donc pour demain, faut qu’on décale le point produit à dix heures et que Léa envoie la maquette avant." },
        { name: "Propre", plan: "Free", output: "Pour demain, il faut décaler le point produit à 10 h et que Léa envoie la maquette avant." },
        { name: "Message", plan: "Pro", output: "On décale le point produit à 10 h demain ? Léa, tu peux envoyer la maquette avant ?" },
        { name: "Email", plan: "Pro", output: "Bonjour à tous, le point produit de demain passe à 10 h. Léa, peux-tu envoyer la maquette avant la réunion ? Merci." },
        { name: "Prompt", plan: "Pro", output: "Rédige un message à l’équipe : point produit décalé à 10 h demain, Léa envoie la maquette avant." },
      ],
      note: "Avec Pro, les modes de réécriture passent par ta propre clé (BYOK) ou Apple Intelligence sur Mac, et tu peux créer les tiens.",
      link: "Voir ce que Pro inclut",
    },
    privacy: {
      title: "Ta voix reste sur ton ordinateur.",
      body: "Le modèle de transcription est téléchargé une fois, puis tourne sur ton Mac ou ton PC. Rien ne part vers nos serveurs pour dicter.",
      flow: ["Ton micro", "Modèle local", "Le champ où tu écris"],
      flowLabel: "Trajet de ta voix en local",
      points: [
        { title: "Hors ligne", body: "La dictée fonctionne sans connexion, sans compte et sans quota." },
        {
          title: "Distant, seulement si tu le choisis",
          body: remoteRoutesPublished
            ? "Les routes distantes validées restent explicites et ne remplacent jamais le local en silence."
            : "Les autres routes restent fermées tant qu’elles ne sont pas validées de bout en bout.",
        },
        { title: "Rien à collecter", body: "Le site ne reçoit ni dictée, ni historique, ni clé API. Pas d’analytics par défaut." },
      ],
      routesLabel: "Routes de traitement disponibles",
      link: "Lire le modèle de sécurité",
    },
    apps: {
      title: "Dans toutes tes apps, sur Mac et sur PC.",
      body: "Pressay écrit là où se trouve ton curseur. Si une app refuse l’insertion, le texte reste copié pour que tu le colles.",
      listLabel: "Applications compatibles",
      groups: { write: "Écrire", chat: "Discuter", code: "Coder", browse: "Naviguer et demander à une IA" },
    },
    compare: {
      title: "Comparer avant de choisir.",
      body: "Prix publics des outils de dictée les plus cités, relevés sur leurs pages officielles.",
    },
    pricing: {
      title: "Gratuit en local. Pro quand tu veux plus.",
      body: "La dictée locale reste illimitée. Pro ajoute la réécriture, la traduction vers toutes les langues et la synchro entre tes appareils.",
      link: "Comparer les offres en détail",
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        ["Pressay envoie-t-il ma voix sur un serveur ?", remoteRoutesPublished
          ? "Pas en local : le modèle tourne sur ton Mac ou ton PC. Toute route distante demande un choix explicite."
          : "Non. La transcription publiée aujourd’hui tourne entièrement sur ton Mac ou ton PC."],
        ["Faut-il un compte ou une connexion ?", "Non. La dictée locale fonctionne hors ligne, sans compte et sans quota. Le compte sert seulement à Pro."],
        ["Comment marche « Dicter et traduire » ?", "C’est un second raccourci : ⌥ Option + ⇧ Maj + Espace sur Mac, Ctrl + Maj + Win sur PC. Tu parles dans ta langue, le texte s’écrit en anglais, gratuitement et en local. Vers les autres langues, c’est avec Pro."],
        ["Pressay marche-t-il sur Windows ?", windowsAvailable
          ? "Oui, sur Windows 10 (22H2) et Windows 11, avec un PC x64 ou ARM (Snapdragon). Sur Mac, il faut macOS 14 ou plus récent et une puce Apple Silicon."
          : "Bientôt. Pressay pour Windows arrive ; la version actuelle tourne sur macOS 14+ avec Apple Silicon."],
        ["Mon abonnement couvre-t-il Mac et PC ?", windowsAvailable
          ? "Oui. Un abonnement Pro couvre jusqu’à 3 appareils au total, Mac ou PC."
          : "Oui. Un abonnement Pro couvrira jusqu’à 3 appareils au total, Mac ou PC, dès que la version Windows sera disponible."],
        ["Pourquoi Pressay demande-t-il l’Accessibilité sur Mac ?", "Pressay l’utilise pour vérifier l’app et le champ cibles, puis y insérer le résultat. Sans cette autorisation, le texte est copié pour que tu le colles toi-même."],
        ["Que devient mon presse-papiers ?", "Après une insertion réussie, Pressay restaure tout ce qu’il contenait avant la dictée. Si tu copies autre chose entre-temps, ta copie gagne."],
      ] as Array<[string, string]>,
    },
    cta: {
      title: "Essaie avec ta voix.",
      body: "Gratuit, sans compte. Installe, appuie sur le raccourci, parle.",
      detected: "Ton système",
      soon: "Pressay pour Windows arrive bientôt.",
    },
  } : {
    hero: {
      title: ["Wherever you can type,", "you can speak."],
      lede: "Press a shortcut, speak, let go: the text lands in the app you are using. Transcription runs on your Mac or PC, offline and without an account.",
      free: "Free, unlimited local dictation",
      also: { macos: "Also for Windows 10 and 11", windows: "Also for macOS 14+" },
      windowsSoon: "Windows is coming soon",
      demoLabel: "Demonstration: hold the shortcut, speak, and the sentence writes itself into the text field, on a Mac and then on a PC.",
      status: { idle: "Ready", listening: "Listening…", written: "Written" },
      local: "Local",
      scenes: [
        { platform: "macos", app: "Mail", field: "To: Sam · Subject: Product review", text: "Hi Sam, can we move the product review to Thursday at 10? I’ll send you the mockup before." },
        { platform: "windows", app: "Teams", field: "# design", text: "The new mockup is live. Feedback before Friday noon, please!" },
      ],
    },
    how: {
      title: "Press, speak, it’s written.",
      intro: "No window to open, no text to copy. Pressay sits between your voice and the field where your cursor is.",
      steps: [
        { title: "Press", body: "Hold the shortcut. You can change it in the settings." },
        { title: "Speak", body: "At your own pace, in your language. The Voice Bar shows that the microphone is listening, and where the text is processed." },
        { title: "It’s written", body: "Let go: the text lands where you were typing. Mail, Slack, your code editor, a web form." },
      ],
      onMac: "On Mac",
      onPc: "On PC",
      waveLabel: "Your voice",
      written: "Product review Thursday at 10.",
    },
    translate: {
      title: "Speak your language, send it in English.",
      body: "A second shortcut translates while you dictate. You speak French, Spanish or German, the text lands in English, ready to send.",
      said: "You say",
      written: "Pressay writes",
      spoken: "Bonjour à tous, je confirme la démo de mardi. On vous envoie le lien d’ici ce soir.",
      result: "Hi everyone, I’m confirming Tuesday’s demo. We’ll send you the link by tonight.",
      free: { title: "Into English", body: "Free and local, on your computer." },
      pro: { title: "Into any language", body: "Spanish, German, Japanese… with Pro." },
    },
    modes: {
      title: "One voice, the right shape.",
      body: "Pick a mode before you speak. Faithful keeps your words, Clean removes hesitations, the others rewrite for the job.",
      spokenLabel: "What you say",
      spoken: "uh so for tomorrow we need to, well, move the product review to ten and have Lea send the mockup before",
      outputLabel: "What Pressay writes",
      rows: [
        { name: "Faithful", plan: "Free", output: "So for tomorrow we need to move the product review to ten and have Lea send the mockup before." },
        { name: "Clean", plan: "Free", output: "For tomorrow, we need to move the product review to 10 and have Lea send the mockup before." },
        { name: "Message", plan: "Pro", output: "Can we move tomorrow’s product review to 10? Lea, could you send the mockup before?" },
        { name: "Email", plan: "Pro", output: "Hi all, tomorrow’s product review moves to 10am. Lea, could you send the mockup before the meeting? Thanks." },
        { name: "Prompt", plan: "Pro", output: "Write a message to the team: product review moved to 10am tomorrow, Lea sends the mockup before." },
      ],
      note: "With Pro, rewrite modes run through your own key (BYOK) or Apple Intelligence on Mac, and you can create your own.",
      link: "See what Pro includes",
    },
    privacy: {
      title: "Your voice stays on your computer.",
      body: "The transcription model is downloaded once, then runs on your Mac or PC. Nothing goes to our servers to dictate.",
      flow: ["Your microphone", "Local model", "The field you type in"],
      flowLabel: "Path of your voice in Local mode",
      points: [
        { title: "Offline", body: "Dictation works without a connection, an account or a quota." },
        {
          title: "Remote only when you choose it",
          body: remoteRoutesPublished
            ? "Validated remote routes stay explicit and never silently replace Local."
            : "Other routes stay closed until their end-to-end validation is complete.",
        },
        { title: "Nothing to collect", body: "The site never receives dictation, history or API keys. No analytics by default." },
      ],
      routesLabel: "Available processing routes",
      link: "Read the security model",
    },
    apps: {
      title: "In all your apps, on Mac and on PC.",
      body: "Pressay writes where your cursor is. If an app refuses the insertion, the text stays copied so you can paste it.",
      listLabel: "Compatible applications",
      groups: { write: "Write", chat: "Chat", code: "Code", browse: "Browse and ask an AI" },
    },
    compare: {
      title: "Compare before you choose.",
      body: "Public prices of the most cited dictation tools, read on their official pages.",
    },
    pricing: {
      title: "Free locally. Pro when you want more.",
      body: "Local dictation stays unlimited. Pro adds rewriting, translation into every language and sync between your devices.",
      link: "Compare plans in detail",
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        ["Does Pressay send my voice to a server?", remoteRoutesPublished
          ? "Not in Local mode: the model runs on your Mac or PC. Every remote route requires an explicit choice."
          : "No. The transcription published today runs entirely on your Mac or PC."],
        ["Do I need an account or a connection?", "No. Local dictation works offline, without an account or quota. The account is only for Pro."],
        ["How does “Dictate and translate” work?", "It is a second shortcut: ⌥ Option + ⇧ Shift + Space on Mac, Ctrl + Shift + Win on PC. You speak your language and the text is written in English, free and local. Other target languages come with Pro."],
        ["Does Pressay work on Windows?", windowsAvailable
          ? "Yes, on Windows 10 (22H2) and Windows 11, with an x64 or ARM (Snapdragon) PC. On Mac, you need macOS 14 or later and Apple Silicon."
          : "Soon. Pressay for Windows is on its way; the current version runs on macOS 14+ with Apple Silicon."],
        ["Does my subscription cover both Mac and PC?", windowsAvailable
          ? "Yes. One Pro subscription covers up to 3 devices in total, Mac or PC."
          : "Yes. One Pro subscription will cover up to 3 devices in total, Mac or PC, as soon as the Windows version is available."],
        ["Why does Pressay need Accessibility on Mac?", "Pressay uses it to verify the target app and field, then insert the result. Without it, the text is copied so you can paste it yourself."],
        ["What happens to my clipboard?", "After a successful insertion, Pressay restores everything it held before dictation. If you copy something else in the meantime, your copy wins."],
      ] as Array<[string, string]>,
    },
    cta: {
      title: "Try it with your voice.",
      body: "Free, no account. Install, press the shortcut, speak.",
      detected: "Your system",
      soon: "Pressay for Windows is coming soon.",
    },
  };
}

export type LandingCopy = ReturnType<typeof landingCopy>;
