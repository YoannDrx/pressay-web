import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessClaimForm, DeleteAccountButton, DeviceRevokeButton, ReferralAttributor, ReferralCard } from "@/components/account-actions";
import { PortalButton } from "@/components/portal-button";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";

type Entitlement = { effectivePlan: string; effectiveSource: string; status: string; grantEnd: string | null; subscriptionEnd: string | null; offlineValidUntil: string; deviceLimit: number; timeline: Array<{ source: string; plan: string; endsAt: string | null }> };
type Account = { account: { id: string; email: string; display_name: string | null; created_at: string } };
type Device = { id: string; platform: string; app_version: string; architecture: string; distribution_channel: string; last_seen_at: string };
type ReferralReward = { id: string; side: string; reward_kind: string; status: string; applied_at: string | null; reversed_at: string | null; guestPassLink?: string };
type Referral = { link: string; signups: number; conversions: number; rewards: ReferralReward[] };

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!commercialIsConfigured()) return <AccountUnavailable />;
  const bootstrap = await pressayAPI("accounts/bootstrap", { method: "POST" });
  if (bootstrap.status === 401) redirect("/sign-in?redirect_url=/account");
  if (!bootstrap.ok && bootstrap.status !== 409) return <AccountError />;
  const [meResponse, entitlementResponse, devicesResponse, referralResponse] = await Promise.all([
    pressayAPI("me"), pressayAPI("entitlements"), pressayAPI("devices"), pressayAPI("referrals/me")
  ]);
  const me = await meResponse.json() as Account;
  const entitlement = await entitlementResponse.json() as Entitlement;
  const devices = await devicesResponse.json() as { devices: Device[] };
  const referral = referralResponse.ok ? await referralResponse.json() as Referral : null;
  return <main className="account-page"><ReferralAttributor /><header className="account-header"><Link className="brand" href="/fr"><span>pressay</span></Link><div><span className="mono-label">ACCOUNT / PRIVACY FIRST</span><h1>Bonjour{me.account.display_name ? ` ${me.account.display_name}` : ""}.</h1><p>{me.account.email}</p></div><Link className="button button-small" href="/fr">Retour au site</Link></header>
    <section className="account-grid">
      <article className="account-card account-plan"><span className="mono-label">DROIT EFFECTIF</span><div className="account-plan-name"><h2>{entitlement.effectivePlan}</h2><span>{entitlement.status}</span></div><p>Source : {entitlement.effectiveSource}. Le grant complète Stripe sans écraser l’abonnement.</p><dl><dt>Fin du grant</dt><dd>{date(entitlement.grantEnd)}</dd><dt>Fin de l’abonnement</dt><dd>{date(entitlement.subscriptionEnd)}</dd><dt>Grâce hors ligne</dt><dd>{date(entitlement.offlineValidUntil)}</dd></dl><div className="account-actions"><PortalButton>Gérer la facturation</PortalButton><Link className="button" href="/user-profile">Sécurité du compte</Link><Link className="button" href="/fr/pricing">Changer d’offre</Link></div></article>
      <article className="account-card"><span className="mono-label">APPAREILS / {devices.devices.length} SUR {entitlement.deviceLimit}</span><h2>Tes Mac.</h2><div className="account-device-list">{devices.devices.map((device) => <div key={device.id}><div><strong>Pressay {device.app_version}</strong><small>{device.architecture} · {device.distribution_channel} · vu {date(device.last_seen_at)}</small></div><DeviceRevokeButton id={device.id} /></div>)}</div>{!devices.devices.length ? <p>Aucun appareil enregistré.</p> : null}</article>
      {referral ? <ReferralCard link={referral.link} signups={referral.signups} conversions={referral.conversions} rewards={referral.rewards} /> : <article className="account-card"><span className="mono-label">PARRAINAGE</span><h2>Programme en préparation.</h2><p>Les liens ne sont pas encore émis : le checkout et les obligations Stripe/Tax doivent d’abord être validés. Rien à configurer de ton côté avant l’ouverture.</p></article>}
      <article className="account-card"><span className="mono-label">CODE D’ACCÈS</span><h2>Tu as reçu un code ?</h2><p>Il ne remplace ni ne raccourcit un abonnement Stripe. Le code est consommé uniquement s’il améliore réellement ton accès ; une réduction Stripe utilise un code promotionnel au checkout.</p><AccessClaimForm /></article>
    </section>
    <section className="account-privacy"><strong>Ce que Pressay ne reçoit jamais</strong><p>Audio, dictée, historique local, texte sélectionné, fichiers, presse-papiers, prompts privés et clé BYOK restent absents de ce compte.</p><Link href="/fr/privacy">Lire la politique de confidentialité →</Link><DeleteAccountButton /></section>
  </main>;
}
function AccountUnavailable() { return <main className="auth-page"><div className="auth-placeholder"><h1>Compte bientôt disponible.</h1><p>Le site public reste téléchargeable sans compte. La bêta commerciale ouvrira après validation staging.</p><Link className="button" href="/fr">Retour</Link></div></main>; }
function AccountError() { return <main className="auth-page"><div className="auth-placeholder"><h1>Compte indisponible.</h1><p>La création du compte n’a pas abouti. Réessaie avec le request ID affiché par le support.</p><Link className="button" href="/fr/support">Support</Link></div></main>; }
function date(value: string | null) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "Aucune"; }
