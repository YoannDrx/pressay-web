import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content-page";
import { supportEmail, supportMailto } from "@/lib/contact";
import type { Locale } from "@/lib/content";
import { consumerMediator, hostingProvider, vatRegime } from "@/lib/legal";
import { localizedMetadata } from "@/lib/page-metadata";

const legalPages = ["legal", "privacy", "terms", "cookies", "support", "withdrawal"] as const;
type LegalPage = typeof legalPages[number];
type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

// Only the known legal pages exist; anything else is a 404, never a render.
export const dynamicParams = false;
export function generateStaticParams() { return ["fr", "en"].flatMap((locale) => legalPages.map((legal) => ({ locale, legal }))); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; legal: string }> }): Promise<Metadata> {
  const { locale, legal } = await params;
  if (!(locale === "fr" || locale === "en") || !legalPages.includes(legal as LegalPage)) return {};
  const page = documentFor(locale, legal as LegalPage);
  return localizedMetadata({ locale, path: `/${legal}`, title: page.title, description: page.intro });
}

export default async function LegalPageRoute({ params }: { params: Promise<{ locale: string; legal: string }> }) {
  const { locale, legal } = await params;
  if (!(locale === "fr" || locale === "en") || !legalPages.includes(legal as LegalPage)) notFound();
  const lang = locale as Locale;
  const page = documentFor(lang, legal as LegalPage);
  return <ContentPage locale={lang} eyebrow={`LEGAL / ${legal.toUpperCase()}`} title={page.title} intro={page.intro}>
    <div className="legal-layout">
      <aside className="legal-toc"><strong>{lang === "fr" ? "Dans cette page" : "On this page"}</strong>{page.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.title}>{String(index + 1).padStart(2, "0")} · {section.title}</a>)}</aside>
      <article className="legal-document">
        <div className="legal-notice"><strong>{lang === "fr" ? "En bref" : "In short"}</strong><p>{page.summary}</p></div>
        {legal === "privacy" ? <PrivacyTable locale={lang} /> : null}
        {page.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}
        {legal === "support" ? <SupportLinks locale={lang} /> : null}
        {legal === "withdrawal" ? <><WithdrawalForm locale={lang} /><WithdrawalActions locale={lang} /></> : null}
        <footer className="legal-updated">{lang === "fr" ? "Dernière mise à jour : 11 octobre 2026." : "Last updated: October 11, 2026."}</footer>
      </article>
    </div>
  </ContentPage>;
}

function PrivacyTable({ locale }: { locale: Locale }) {
  const rows = locale === "fr" ? [
    ["Compte", "Fournir le compte et sécuriser l’accès", "Contrat", "Better Auth auto-hébergé (Vercel, Neon) ; Google ou Apple selon le moyen de connexion choisi", "Durée du compte + délais légaux"],
    ["Appareils", "Appliquer les limites et révoquer un Mac", "Contrat / sécurité", "Neon", "Durée du compte, puis suppression"],
    ["Paiements", "Abonnement, facture, remboursement", "Contrat / obligation légale", "Stripe (achat direct) ou Apple (achat intégré, lorsqu’il sera proposé), Vercel, Neon", "Durées comptables et fiscales applicables"],
    ["Codes et referrals", "Attribuer et prévenir la fraude", "Contrat / intérêt légitime", "Neon, Stripe si récompense", "Campagne + période de contestation"],
    ["Téléchargement de l’app", "Fournir le DMG et mesurer l’adoption de la release", "Intérêt légitime", "GitHub (hébergement du fichier, reçoit l’adresse IP), Vercel, Neon", "Compteur sans identifiant persistant, 13 mois maximum"],
    ["Modèles locaux", "Télécharger depuis l’app les modèles de transcription", "Contrat", "Hugging Face (hébergement des modèles, reçoit l’adresse IP), Vercel (redirection)", "Aucune conservation par Pressay"],
    ["Support et audit", "Résoudre les demandes et tracer l’administration", "Contrat / sécurité", "YoDev, Neon", "Ticket : 3 ans ; audit : 5 ans"],
  ] : [
    ["Account", "Provide and secure the account", "Contract", "Self-hosted Better Auth (Vercel, Neon); Google or Apple depending on the sign-in method you choose", "Account lifetime plus legal periods"],
    ["Devices", "Apply limits and revoke a Mac", "Contract / security", "Neon", "Account lifetime, then deletion"],
    ["Payments", "Subscription, invoices and refunds", "Contract / legal duty", "Stripe (direct purchase) or Apple (in-app purchase, once offered), Vercel, Neon", "Applicable accounting and tax periods"],
    ["Codes and referrals", "Attribute rewards and prevent fraud", "Contract / legitimate interest", "Neon, Stripe for rewards", "Campaign plus dispute period"],
    ["App download", "Serve the DMG and measure release adoption", "Legitimate interest", "GitHub (file hosting, receives your IP address), Vercel, Neon", "Counter without persistent identifier, up to 13 months"],
    ["Local models", "Download transcription models from the app", "Contract", "Hugging Face (model hosting, receives your IP address), Vercel (redirect)", "Not retained by Pressay"],
    ["Support and audit", "Resolve requests and trace administration", "Contract / security", "YoDev, Neon", "Ticket: 3 years; audit: 5 years"],
  ];
  return <div className="legal-table-wrap"><table><thead><tr>{(locale === "fr" ? ["Traitement", "Finalité", "Base", "Destinataires", "Conservation"] : ["Processing", "Purpose", "Basis", "Recipients", "Retention"]).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function mediatorParagraph(locale: Locale): string {
  const fr = locale === "fr";
  if (!consumerMediator)
    return fr
      ? "Médiation de la consommation : le médiateur compétent sera désigné ici avant l’ouverture des offres payantes ; aucun paiement n’est accepté d’ici là."
      : "Consumer mediation: the competent mediator will be named here before paid plans open; no payment is accepted until then.";
  return fr
    ? `En cas de litige non résolu par une réclamation écrite préalable, vous pouvez recourir gratuitement au médiateur de la consommation : ${consumerMediator.name}, ${consumerMediator.address}, ${consumerMediator.website}.`
    : `If a dispute is not resolved by a prior written complaint, you may refer it free of charge to the consumer mediator: ${consumerMediator.name}, ${consumerMediator.address}, ${consumerMediator.website}.`;
}

const publisherPostal = "YoDev — Yoann Andrieux, 7 allée des Jonquilles, 95130 Franconville, France";

/** Model withdrawal form (annex to art. R221-1 Code de la consommation; Directive 2011/83/EU annex I B). */
function withdrawalFormLines(locale: Locale): string[] {
  return locale === "fr"
    ? [
        "(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)",
        `À l’attention de ${publisherPostal}, ${supportEmail} :`,
        "Je/Nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la prestation de services (*) ci-dessous : abonnement Pressay Pro",
        "Commandé le (*) / reçu le (*) :",
        "Nom du (des) consommateur(s) :",
        "Adresse du (des) consommateur(s) :",
        "Adresse e-mail du compte Pressay :",
        "Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) :",
        "Date :",
        "(*) Rayez la mention inutile.",
      ]
    : [
        "(Complete and return this form only if you wish to withdraw from the contract.)",
        `To ${publisherPostal}, ${supportEmail}:`,
        "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service (*): Pressay Pro subscription",
        "Ordered on (*) / received on (*):",
        "Name of consumer(s):",
        "Address of consumer(s):",
        "Pressay account email:",
        "Signature of consumer(s) (only if this form is notified on paper):",
        "Date:",
        "(*) Delete as appropriate.",
      ];
}

function withdrawalFormText(locale: Locale): string {
  return withdrawalFormLines(locale).join("\n");
}

function WithdrawalForm({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  return <section className="withdrawal-form" aria-labelledby="withdrawal-form-title">
    <h2 id="withdrawal-form-title">{fr ? "Formulaire type de rétractation" : "Model withdrawal form"}</h2>
    <p>{fr ? "Annexe à l’article R221-1 du Code de la consommation. Son utilisation est facultative ; le bouton ci-dessous le prépare dans un e-mail." : "Annex to article R221-1 of the French Consumer Code. Using it is optional; the button below prepares it in an email."}</p>
    <ol>{withdrawalFormLines(locale).map((line) => <li key={line}>{line}</li>)}</ol>
  </section>;
}

function SupportLinks({ locale }: { locale: Locale }) { return <div className="legal-actions"><a className="button button-primary" href={supportMailto("[Pressay] Support")}>{supportEmail}</a><Link className="button" href={`/${locale}/download`}>{locale === "fr" ? "Réinstaller Pressay" : "Reinstall Pressay"}</Link></div>; }
function WithdrawalActions({ locale }: { locale: Locale }) { return <div className="legal-actions"><a className="button button-primary" href={supportMailto(locale === "fr" ? "[Pressay] Rétractation" : "[Pressay] Withdrawal", withdrawalFormText(locale))}>{locale === "fr" ? "Exercer mon droit" : "Exercise my right"}</a><Link className="button" href="/account/security">{locale === "fr" ? "Supprimer mon compte" : "Delete my account"}</Link></div>; }

function documentFor(locale: Locale, page: LegalPage): { title: string; intro: string; summary: string; sections: Section[] } {
  const fr = locale === "fr";
  const commonIdentity = fr
    ? "Pressay est édité et développé par Yoann Andrieux, Entrepreneur individuel, sous la marque YoDev, 7 allée des Jonquilles, 95130 Franconville, France."
    : "Pressay is published and developed by Yoann Andrieux, sole trader, under the YoDev brand, 7 allée des Jonquilles, 95130 Franconville, France.";
  const documents: Record<LegalPage, { title: string; intro: string; summary: string; sections: Section[] }> = {
    legal: fr ? {
      title: "Mentions légales", intro: "L’identité de l’éditeur, de l’hébergeur et les informations commerciales de Pressay.", summary: "Pressay est un logiciel macOS édité en France par YoDev.", sections: [
        { title: "Éditeur", paragraphs: [commonIdentity], bullets: ["SIREN : 803 272 590", "SIRET : 803 272 590 00024", "Activité : programmation informatique — NAF 6201Z", `Contact : ${supportEmail}`, vatRegime === "franchise" ? "TVA non applicable, art. 293 B du CGI." : "Prix affichés toutes taxes comprises (TTC)."] },
        { title: "Direction de la publication", paragraphs: [`Le directeur de la publication est Yoann Andrieux. Les demandes juridiques, de confidentialité et de support peuvent être adressées à ${supportEmail}.`] },
        { title: "Hébergement et prestataires", paragraphs: [`Hébergeur du site, de l’API et de Better Auth : ${hostingProvider.name}, ${hostingProvider.address} — ${hostingProvider.website}.`, "Les données de compte sont hébergées par Neon Inc. (base PostgreSQL). Google intervient lorsque vous choisissez Continuer avec Google, Apple lorsque vous choisissez Se connecter avec Apple. Stripe traite les achats directs lorsqu’ils sont ouverts ; Apple traitera les achats intégrés lorsque l’édition Mac App Store sera proposée. Le fichier d’installation est servi par GitHub et les modèles locaux par Hugging Face. Le contenu vocal n’est pas hébergé par ces prestataires dans les modes local/BYOK de Pressay."] },
        { title: "Propriété intellectuelle", paragraphs: ["La marque, l’interface, les textes, illustrations et composants spécifiques à Pressay appartiennent à YoDev ou sont utilisés sous licence. Les marques d’applications affichées restent la propriété de leurs titulaires et n’impliquent aucun partenariat."] },
        { title: "Signalement", paragraphs: [`Pour signaler un contenu illicite, une vulnérabilité ou une atteinte à des droits, écrivez à ${supportEmail} en donnant l’URL, les faits et un moyen de vous recontacter. N’envoyez jamais de clé API ni de dictée sensible.`] }
      ]
    } : {
      title: "Legal notice", intro: "Publisher, hosting and commercial information for Pressay.", summary: "Pressay is a macOS application published in France by YoDev.", sections: [
        { title: "Publisher", paragraphs: [commonIdentity], bullets: ["SIREN: 803 272 590", "SIRET: 803 272 590 00024", "Business activity: software development — NAF 6201Z", `Contact: ${supportEmail}`, vatRegime === "franchise" ? "VAT not applicable (French General Tax Code, art. 293 B)." : "Prices are shown including VAT."] },
        { title: "Publication director", paragraphs: [`The publication director is Yoann Andrieux. Legal, privacy and support requests may be sent to ${supportEmail}.`] },
        { title: "Hosting and providers", paragraphs: [`Host of the website, API and Better Auth: ${hostingProvider.name}, ${hostingProvider.address} — ${hostingProvider.website}.`, "Account data is hosted by Neon Inc. (PostgreSQL database). Google is involved when you choose Continue with Google, Apple when you choose Sign in with Apple. Stripe processes direct purchases once open; Apple will process in-app purchases once a Mac App Store edition is offered. The installer is served by GitHub and local models by Hugging Face. Voice content is not hosted by these providers in Pressay local/BYOK modes."] },
        { title: "Intellectual property", paragraphs: ["The brand, interface, copy, artwork and Pressay-specific components belong to YoDev or are used under licence. Displayed application marks belong to their owners and do not imply a partnership."] },
        { title: "Reporting", paragraphs: [`To report unlawful content, a vulnerability or a rights issue, email ${supportEmail} with the URL, facts and a contact method. Never send an API key or sensitive dictation.`] }
      ]
    },
    privacy: fr ? {
      title: "Politique de confidentialité", intro: "Ce que Pressay traite, pourquoi, pendant combien de temps — et surtout ce qui reste sur votre Mac.", summary: "Pressay monitore les métadonnées commerciales et techniques nécessaires, jamais le contenu de vos dictées.", sections: [
        { title: "Responsable du traitement", paragraphs: [commonIdentity, `YoDev est responsable des traitements liés au compte, aux paiements, appareils, codes, parrainages, téléchargements, support et audit. Contact RGPD : ${supportEmail}.`] },
        { title: "Données exclues", bullets: ["audio et transcriptions ;", "texte sélectionné, contexte applicatif et presse-papiers ;", "fichiers, captures et replay de session ;", "clé OpenAI/BYOK ;", "prompts personnalisés en clair."] },
        { title: "Pas de télémétrie", paragraphs: ["L’app Pressay n’envoie aucune télémétrie produit. Les seuls échanges réseau sont ceux que vous déclenchez : connexion au compte, téléchargement d’un modèle local, route BYOK ou Pressay Cloud choisie explicitement, vérification de mise à jour et synchronisation si vous l’activez. Si une mesure facultative était ajoutée un jour, elle resterait désactivée sans votre consentement et cette politique serait mise à jour avant."] },
        { title: "Vos droits", paragraphs: [`Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, l’opposition et la portabilité lorsque ces droits s’appliquent. Vous pouvez retirer un consentement sans effet rétroactif. Écrivez à ${supportEmail} ; une preuve d’identité raisonnable peut être demandée.`], bullets: ["Réponse en principe sous un mois ;", "réclamation possible auprès de la CNIL ;", "suppression du compte accessible depuis l’espace compte ;", "conservation séparée des seules pièces imposées par une obligation légale."] },
        { title: "Sécurité et transferts", paragraphs: ["Les accès administratifs sont limités par rôle, les actions sensibles exigent une MFA récente et chaque mutation est auditée. Les prestataires américains peuvent entraîner des transferts encadrés par leurs mécanismes contractuels et décisions d’adéquation applicables. Aucun système n’est infaillible ; un incident significatif sera traité et notifié conformément au droit applicable."] },
        { title: "Mineurs et changements", paragraphs: ["Pressay ne cible pas les enfants. Cette politique peut évoluer avec le produit ; les changements substantiels seront signalés avant leur prise d’effet lorsque cela est nécessaire."] }
      ]
    } : {
      title: "Privacy policy", intro: "What Pressay processes, why, for how long — and what remains on your Mac.", summary: "Pressay monitors necessary commercial and technical metadata, never dictation content.", sections: [
        { title: "Controller", paragraphs: [commonIdentity, `YoDev controls processing for accounts, payments, devices, codes, referrals, downloads, support and audit. Privacy contact: ${supportEmail}.`] },
        { title: "Excluded data", bullets: ["audio and transcriptions;", "selected text, application context and clipboard;", "files, screenshots and session replay;", "OpenAI/BYOK key;", "custom prompts in plaintext."] },
        { title: "No telemetry", paragraphs: ["The Pressay app sends no product telemetry. The only network exchanges are the ones you trigger: account sign-in, local model download, an explicitly chosen BYOK or Pressay Cloud route, update checks and sync if you turn it on. Should an optional measurement ever be added, it would stay off without your consent and this policy would be updated first."] },
        { title: "Your rights", paragraphs: [`You may request access, correction, deletion, restriction, objection and portability where applicable. Consent may be withdrawn without retroactive effect. Email ${supportEmail}; proportionate identity evidence may be requested.`], bullets: ["Response normally within one month;", "complaint available to the French CNIL or your local authority;", "account deletion from the account area;", "separate retention only for records required by law."] },
        { title: "Security and transfers", paragraphs: ["Administrative access is role-based, sensitive actions require recent MFA and every mutation is audited. US providers may involve transfers governed by applicable contractual safeguards and adequacy decisions. No system is infallible; material incidents will be handled and notified as required."] },
        { title: "Children and changes", paragraphs: ["Pressay is not directed at children. This policy may change with the product; material changes will be announced before they take effect where required."] }
      ]
    },
    terms: fr ? {
      title: "Conditions générales d’utilisation et de vente", intro: "Les règles applicables à Pressay Free et Pressay Pro.", summary: "Vous gardez le contrôle de vos données locales ; l’abonnement Pro donne les droits décrits au moment de l’achat.", sections: [
        { title: "Objet et acceptation", paragraphs: [commonIdentity, "Ces conditions régissent le site, l’application Direct, le compte, les téléchargements et les achats. En utilisant le service ou en commandant, vous les acceptez. Il faut disposer de la capacité juridique nécessaire."] },
        { title: "Licence et prérequis", paragraphs: ["YoDev vous accorde une licence personnelle, non exclusive, non cessible et révocable d’utiliser Pressay sur les appareils autorisés. Pressay requiert macOS 14 ou version ultérieure. Certaines fonctions de l’édition Direct nécessitent Microphone et Accessibilité."] },
        { title: "Offres", bullets: ["Free : dictée locale illimitée, hors ligne et sans compte obligatoire ;", "Pro : modes de réécriture et modes personnalisés, profils par application, correction vocale, Apple Intelligence/BYOK, synchronisation chiffrée et quota Cloud explicite, jusqu’à trois Mac ;", "L’offre de lancement est disponible au mois ou à l’année, sans essai automatique ni formule à vie."] },
        { title: "BYOK et coûts tiers", paragraphs: ["Votre clé reste sous votre contrôle. Les frais, quotas, disponibilité et politiques du fournisseur d’IA sont distincts du prix Pressay et restent à votre charge. Pressay ne revend aucun crédit cloud dans les offres BYOK."] },
        { title: "Prix et renouvellement", paragraphs: ["Les prix sont affichés toutes taxes comprises et rappelés avant commande. Aucun essai automatique n’est proposé au lancement. L’abonnement mensuel ou annuel se renouvelle jusqu’à annulation. En cas d’échec, les droits peuvent passer en impayé puis revenir à Free sans supprimer vos données locales."] },
        { title: "Garantie légale de conformité numérique", paragraphs: [`Les consommateurs bénéficient de la garantie légale de conformité applicable aux contenus et services numériques, indépendamment de toute garantie commerciale. En cas de défaut, les remèdes, délais et conditions prévus par le Code de la consommation s’appliquent. Contactez ${supportEmail} avec la référence de commande et une description du défaut, sans joindre de dictée ou de clé API.`] },
        { title: "Annulation, rétractation et remboursements", paragraphs: ["Lorsque l’achat intégré Apple sera proposé, l’abonnement se gérera ou s’annulera dans les réglages de votre compte Apple et un remboursement se demandera sur reportaproblem.apple.com. Pour un achat direct, vous pouvez annuler depuis le portail Stripe ; l’accès demeure jusqu’à la fin de la période payée sauf droit contraire. Aucun remboursement commercial supplémentaire n’est promis au-delà du droit applicable. Pour les consommateurs, le droit de rétractation et l’éventuel consentement à l’exécution immédiate sont détaillés sur la page dédiée."] },
        { title: "Codes, promotions et parrainage", paragraphs: ["Un code peut être limité, expiré, lié à un email ou non cumulable. Il ne modifie pas silencieusement un abonnement actif. Le parrainage v1 récompense les deux parties de 30 jours après le premier paiement d’un abonnement éligible ; auto-parrainage, anciens clients, fraude, remboursement total et chargeback peuvent exclure ou inverser la partie non consommée."] },
        { title: "Usage acceptable et sécurité", bullets: ["Ne pas contourner les limites, partager un compte de manière abusive ou automatiser les claims ;", "ne pas utiliser Pressay pour violer la loi ou les droits de tiers ;", "protéger le Mac, le compte, la clé BYOK et informer rapidement YoDev d’un incident ;", "ne pas désassembler au-delà de ce que la loi autorise."] },
        { title: "Disponibilité et responsabilité", paragraphs: ["YoDev vise un service fiable mais ne garantit pas une disponibilité continue, une transcription parfaite ou la compatibilité avec chaque champ. Relisez les contenus importants. Dans les limites permises, YoDev n’est pas responsable des services tiers, pertes indirectes ou usages non conformes. Les droits impératifs du consommateur restent inchangés."] },
        { title: "Droit applicable et litiges", paragraphs: [`Le droit français s’applique, sans priver un consommateur des protections impératives de son pays. Une réclamation préalable peut être envoyée à ${supportEmail}.`, mediatorParagraph("fr")] }
      ]
    } : {
      title: "Terms of use and sale", intro: "Rules for Pressay Free and Pressay Pro.", summary: "You retain control of local data; the Pro subscription provides the rights described at purchase.", sections: [
        { title: "Scope and acceptance", paragraphs: [commonIdentity, "These terms govern the site, Direct app, account, downloads and purchases. By using or ordering the service, you accept them and confirm you have legal capacity."] },
        { title: "Licence and requirements", paragraphs: ["YoDev grants a personal, non-exclusive, non-transferable and revocable licence to use Pressay on authorised devices. Pressay requires macOS 14+. Some Direct edition features require Microphone and Accessibility."] },
        { title: "Plans", bullets: ["Free: unlimited offline local dictation without a mandatory account;", "Pro: rewrite and custom modes, per-app profiles, voice correction, Apple Intelligence/BYOK, encrypted sync and an explicit Cloud allowance, on up to three Macs;", "The launch offer is monthly or annual, with no automatic trial or lifetime plan."] },
        { title: "BYOK and third-party costs", paragraphs: ["You control your key. Provider fees, quotas, availability and policies are separate from Pressay pricing and remain your responsibility. BYOK plans include no resold cloud credits."] },
        { title: "Price and renewal", paragraphs: ["Prices are shown including applicable taxes and repeated before purchase. No automatic trial is offered at launch. Monthly or annual subscriptions renew until cancelled. Payment failure may move access to past due and then Free without deleting local data."] },
        { title: "Statutory digital conformity", paragraphs: [`Consumers benefit from the statutory conformity guarantee applicable to digital content and services, independently of any commercial warranty. Remedies, periods and conditions provided by applicable consumer law remain available. Contact ${supportEmail} with the order reference and a description of the issue, without attaching dictation or an API key.`] },
        { title: "Cancellation, withdrawal and refunds", paragraphs: ["Once Apple in-app purchase is offered, such subscriptions are managed or cancelled in your Apple account settings and refunds requested at reportaproblem.apple.com. For a direct purchase, cancel through the Stripe portal; access normally continues to the paid period end. No extra commercial refund promise is made beyond applicable law. Consumer withdrawal and consent to immediate performance are explained on the dedicated page."] },
        { title: "Codes, promotions and referrals", paragraphs: ["A code may be limited, expired, email-bound or non-stackable. It never silently alters an active subscription. Referral v1 grants both parties 30 days after the first eligible subscription payment; self-referral, former customers, fraud, total refunds and chargebacks may exclude or reverse unconsumed rewards."] },
        { title: "Acceptable use and security", bullets: ["Do not bypass limits, abuse account sharing or automate claims;", "do not violate law or third-party rights;", "protect your Mac, account and BYOK key and report incidents;", "do not reverse engineer beyond statutory rights."] },
        { title: "Availability and liability", paragraphs: ["YoDev aims for reliability but does not promise continuous availability, perfect transcription or compatibility with every field. Review important output. To the extent permitted, YoDev is not liable for third-party services, indirect loss or misuse. Mandatory consumer rights remain intact."] },
        { title: "Law and disputes", paragraphs: [`French law applies without removing mandatory protections in a consumer’s country. Contact ${supportEmail} first.`, mediatorParagraph("en")] }
      ]
    },
    cookies: fr ? {
      title: "Politique de cookies", intro: "Une liste courte et lisible des cookies nécessaires au fonctionnement du site.", summary: "Pressay n’utilise aucun cookie publicitaire ni fingerprint marketing.", sections: [
        { title: "Cookies strictement nécessaires", bullets: ["Pressay / Better Auth : session, challenge passkey, double authentification et validation forte administrative ;", "pressay_referral : attribution signée, HttpOnly, SameSite=Lax, 30 jours, uniquement après ouverture du programme ;", "préférences de langue ou de sécurité indispensables au parcours."] },
        { title: "Mesure et télémétrie", paragraphs: ["Le site n’utilise ni outil d’analyse ni traceur. Le téléchargement public ne dépose aucun identifiant persistant et l’app n’envoie aucune télémétrie."] },
        { title: "Gestion", paragraphs: ["Vous pouvez effacer les cookies dans votre navigateur. Bloquer les cookies Better Auth empêche la connexion ; bloquer le cookie referral empêche l’attribution ; le téléchargement public reste disponible. Un futur outil non essentiel sera désactivé jusqu’à votre choix."] },
        { title: "Contact", paragraphs: [`Pour toute question ou pour signaler un écart entre cette liste et le comportement observé : ${supportEmail}.`] }
      ]
    } : {
      title: "Cookie policy", intro: "A short, readable list of cookies required by the site.", summary: "Pressay uses no advertising cookie or marketing fingerprint.", sections: [
        { title: "Strictly necessary cookies", bullets: ["Pressay / Better Auth: session, passkey challenge, two-factor authentication and administrative step-up;", "pressay_referral: signed attribution, HttpOnly, SameSite=Lax, 30 days, only after the programme opens;", "language or security preferences required by the journey."] },
        { title: "Measurement and telemetry", paragraphs: ["The site uses no analytics or tracker. Public downloads set no persistent identifier and the app sends no telemetry."] },
        { title: "Controls", paragraphs: ["You may clear cookies in your browser. Blocking Better Auth cookies prevents sign-in; blocking the referral cookie prevents attribution; public download remains available. Any future non-essential tool will remain off until you choose."] },
        { title: "Contact", paragraphs: [`Questions or reports of a mismatch between this list and observed behaviour: ${supportEmail}.`] }
      ]
    },
    support: fr ? {
      title: "Support Pressay", intro: "Installer, diagnostiquer et obtenir de l’aide sans exposer le contenu de vos dictées.", summary: "Envoyez la version, macOS, l’app cible, les étapes et le request ID — jamais votre clé ni une dictée.", sections: [
        { title: "Installation et permissions", bullets: ["macOS 14 ou ultérieur sur Apple Silicon ;", "autoriser le Microphone ;", "pour l’édition Direct, autoriser Accessibilité afin de vérifier la cible et insérer ;", "si une permission reste bloquée, la retirer puis relancer Pressay avant de la redemander."] },
        { title: "Raccourcis et applications", paragraphs: ["Vérifiez que le raccourci n’est pas capturé par macOS ou une autre app. Certains champs sécurisés refusent volontairement l’insertion. Si la cible change, Pressay copie le résultat plutôt que de le coller au mauvais endroit."] },
        { title: "Modèles locaux et BYOK", paragraphs: ["Fast, Polyglot et Precise transcrivent localement après téléchargement du modèle. Les routes BYOK utilisent votre clé stockée dans le Trousseau et appellent directement le fournisseur choisi. Pressay ne peut ni lire ni récupérer cette clé depuis le support."] },
        { title: "Facturation, codes et parrainage", paragraphs: ["Lorsque l’édition Mac App Store sera proposée, ses achats seront gérés par Apple et « Restaurer les achats » permettra de retrouver vos droits. Pour les achats directs, le portail Stripe gère moyen de paiement, factures, changement mensuel/annuel et annulation. Un code gratuit complète le droit effectif sans écraser Stripe. Une récompense de parrainage apparaît après le premier paiement éligible, jamais après une facture à zéro."] },
        { title: "Presse-papiers et récupération", paragraphs: ["Après une insertion réussie, Pressay restaure les formats présents auparavant. Une copie effectuée par vous pendant l’opération gagne. En mode de repli, le résultat reste copié afin que vous puissiez le coller manuellement."] },
        { title: "Export et suppression", paragraphs: ["L’export local et la suppression de l’historique restent disponibles. La suppression du compte concerne l’identité Better Auth, Stripe et Neon selon le parcours prévu, mais ne détruit pas silencieusement vos fichiers locaux sans votre action."] },
        { title: "Diagnostic privacy-safe", bullets: ["Version Pressay et version majeure de macOS ;", "modèle de Mac ou architecture ;", "application et champ cibles ;", "étapes de reproduction ;", "code d’erreur et request ID ;", "ne jamais joindre audio, dictée sensible, clé API, presse-papiers ou fichier privé."] }
      ]
    } : {
      title: "Pressay support", intro: "Install, troubleshoot and get help without exposing dictation content.", summary: "Send version, macOS, target app, steps and request ID — never your key or dictation.", sections: [
        { title: "Installation and permissions", bullets: ["macOS 14+ on Apple Silicon;", "allow Microphone;", "for Direct, allow Accessibility to verify targets and insert;", "if a permission is stuck, remove it, relaunch Pressay and request it again."] },
        { title: "Shortcuts and apps", paragraphs: ["Check that macOS or another app does not capture the shortcut. Secure fields deliberately reject insertion. If the target changes, Pressay copies instead of pasting into the wrong place."] },
        { title: "Local models and BYOK", paragraphs: ["Fast, Polyglot and Precise transcribe locally after downloading a model. BYOK routes store your key in Keychain and call the selected provider directly. Support cannot read or recover that key."] },
        { title: "Billing, codes and referrals", paragraphs: ["Once a Mac App Store edition is offered, its purchases will be managed by Apple and Restore Purchases will recover your access. For direct purchases, Stripe’s portal manages payment method, invoices, monthly/annual switch and cancellation. A free code complements effective access without overwriting Stripe. Referral rewards appear after the first eligible paid invoice, never a zero invoice."] },
        { title: "Clipboard and recovery", paragraphs: ["After successful insertion, Pressay restores previous formats. A copy you make during the operation wins. On fallback, output stays copied for manual paste."] },
        { title: "Export and deletion", paragraphs: ["Local export and history deletion remain available. Account deletion covers the Better Auth identity, Stripe and Neon through the dedicated flow but does not silently destroy local files without your action."] },
        { title: "Privacy-safe diagnostics", bullets: ["Pressay and major macOS version;", "Mac model or architecture;", "target app and field;", "reproduction steps;", "error code and request ID;", "never attach audio, sensitive dictation, API key, clipboard or private file."] }
      ]
    },
    withdrawal: fr ? {
      title: "Rétractation et suppression de compte", intro: "Exercer vos droits de consommateur et comprendre les effets de la suppression.", summary: "Le droit légal s’applique sans garantie commerciale supplémentaire.", sections: [
        { title: "Droit de rétractation", paragraphs: ["Si vous êtes consommateur et achetez à distance, vous disposez en principe de quatorze jours pour vous rétracter, sous réserve des exceptions légales. Le délai et les instructions applicables sont rappelés avant la commande."] },
        { title: "Exécution immédiate", paragraphs: ["Lorsque vous demandez l’accès immédiat à un contenu ou service numérique avant la fin du délai, le checkout doit recueillir les consentements et confirmations exigés par le droit français. En l’absence de preuve valide, Pressay n’oppose pas une renonciation supposée."] },
        { title: "Comment exercer", paragraphs: [`Envoyez avant l’échéance une déclaration dénuée d’ambiguïté à ${supportEmail} avec l’email du compte, la date et la référence de commande, par exemple au moyen du formulaire type ci-dessous (facultatif). N’envoyez aucune donnée bancaire. Un accusé de réception sera conservé.`] },
        { title: "Effets et remboursement", paragraphs: ["Lorsque la rétractation est recevable, le remboursement est effectué selon le moyen d’origine dans le délai légal, sauf accord contraire. L’accès payant peut être retiré ; vos données locales ne sont pas supprimées automatiquement."] },
        { title: "Suppression du compte", paragraphs: ["Depuis l’espace compte, vous pouvez demander la suppression de l’identité, de la relation Stripe et des données commerciales Neon. Les pièces devant être conservées pour obligations comptables, fraude ou défense de droits sont isolées et supprimées à leur échéance."] },
        { title: "Ce qui reste local", paragraphs: ["La suppression du compte ne peut pas effacer à distance l’historique, les modèles ou préférences présents uniquement sur votre Mac. Utilisez les commandes locales de suppression ou désinstallez l’app selon votre intention."] }
      ]
    } : {
      title: "Withdrawal and account deletion", intro: "Exercise consumer rights and understand deletion effects.", summary: "Statutory rights apply without an extra commercial refund promise.", sections: [
        { title: "Withdrawal right", paragraphs: ["If you are a consumer buying at distance, you generally have fourteen days to withdraw, subject to statutory exceptions. The applicable deadline and instructions are shown before purchase."] },
        { title: "Immediate performance", paragraphs: ["When you request immediate access to digital content or services before the period ends, checkout must collect consents and confirmations required by French law. Without valid evidence, Pressay will not rely on an assumed waiver."] },
        { title: "How to exercise", paragraphs: [`Before the deadline, email an unambiguous statement to ${supportEmail} with account email, date and order reference, for example using the model form below (optional). Never send bank data. An acknowledgement will be retained.`] },
        { title: "Effects and refund", paragraphs: ["Where withdrawal is valid, refund is made to the original method within the legal deadline unless agreed otherwise. Paid access may be removed; local data is not automatically deleted."] },
        { title: "Account deletion", paragraphs: ["From the account area, request deletion of identity, Stripe relationship and Neon commercial data. Records required for accounting, fraud or legal defence are isolated and deleted at expiry."] },
        { title: "What remains local", paragraphs: ["Account deletion cannot remotely erase history, models or preferences that exist only on your Mac. Use local deletion controls or uninstall the app as intended."] }
      ]
    }
  };
  return documents[page];
}
