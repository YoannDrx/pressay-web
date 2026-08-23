import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessClaimForm, DeleteAccountButton, DeviceRevokeButton, ReferralAttributor, ReferralCard } from "@/components/account-actions";
import { PortalButton } from "@/components/portal-button";
import {
  legacyAccountView,
  modernAccountView,
  planLabel,
  sourceLabel,
  statusLabel,
  type AccountView,
} from "@/lib/account-view";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";
import { getWebIdentity } from "@/lib/server-identity";

type LegacyEntitlement = { effectivePlan: string; effectiveSource: string; status: string; grantEnd: string | null; subscriptionEnd: string | null; offlineValidUntil: string; deviceLimit: number };
type LegacyAccount = { account: { id: string; email: string; display_name: string | null; created_at: string } };
type LegacyDevice = { id: string; app_version: string; architecture: string; distribution_channel: string; last_seen_at: string };
type ModernAccount = { email: string; entitlement: { tier: "free" | "pro"; source: "none" | "trial" | "stripe" | "app_store" | "support"; validUntil: string | null; offlineGraceUntil: string | null } };
type ModernBilling = { provider: "stripe" | "app_store" | null; status: string | null; currentPeriodEndsAt: string | null };
type ModernDevice = { id: string; displayName: string; appVariant: "direct" | "mas"; appVersion: string; lastSeenAt: string };
type DeviceView = { id: string; name: string; version: string; details: string; lastSeenAt: string };
type ReferralReward = { id: string; side: string; reward_kind: string; status: string; applied_at: string | null; reversed_at: string | null; guestPassLink?: string };
type Referral = { link: string; signups: number; conversions: number; rewards: ReferralReward[] };

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!commercialIsConfigured()) return <AccountUnavailable />;
  const identity = await getWebIdentity();
  if (!identity) redirect("/sign-in?redirect_url=/account");
  let bootstrap = await pressayAPI("accounts/web-bootstrap", { method: "POST" });
  let modern = bootstrap.ok;
  if (bootstrap.status === 404) {
    bootstrap = await pressayAPI("accounts/bootstrap", { method: "POST" });
    modern = false;
  }
  // At this point the browser session is valid. A 401 is an API trust/config
  // failure, not a reason to send the user through Google again in a loop.
  if (bootstrap.status === 401) return <AccountError />;
  if (!bootstrap.ok && bootstrap.status !== 409) return <AccountError />;
  const accountData = modern
    ? await loadModernAccount(identity.name ?? null)
    : await loadLegacyAccount();
  if (!accountData) return <AccountError />;
  const referralResponse = modern ? null : await pressayAPI("referrals/me");
  const referral = referralResponse?.ok ? await referralResponse.json() as Referral : null;
  const { view, devices } = accountData;
  return <main className="account-page">{modern ? null : <ReferralAttributor />}<header className="account-header"><Link className="brand" href="/fr"><span>pressay</span></Link><div><span className="mono-label">COMPTE / CONFIDENTIALITÉ D’ABORD</span><h1>Bonjour{view.displayName ? ` ${view.displayName}` : ""}.</h1><p>{view.email}</p></div><Link className="button button-small" href="/fr">Retour au site</Link></header>
    <section className="account-grid">
      <article className="account-card account-plan"><span className="mono-label">OFFRE ACTIVE</span><div className="account-plan-name"><h2>{planLabel(view.plan)}</h2><span>{statusLabel(view)}</span></div><p>{sourceLabel(view.source)}. La dictée locale reste disponible sans compte ni réseau.</p><dl>{view.accessEndsAt ? <><dt>Accès accordé jusqu’au</dt><dd>{date(view.accessEndsAt)}</dd></> : null}{view.subscriptionEndsAt ? <><dt>Prochaine échéance</dt><dd>{date(view.subscriptionEndsAt)}</dd></> : null}{view.offlineValidUntil ? <><dt>Accès Pro hors ligne jusqu’au</dt><dd>{date(view.offlineValidUntil)}</dd></> : null}</dl><div className="account-actions">{view.canManageBilling ? <PortalButton>Gérer la facturation</PortalButton> : null}<Link className="button" href="/user-profile">Sécurité du compte</Link><Link className="button" href="/fr/pricing">Voir les offres</Link></div></article>
      <article className="account-card"><span className="mono-label">APPAREILS / {devices.length} SUR {view.deviceLimit}</span><h2>Tes Mac.</h2><div className="account-device-list">{devices.map((device) => <div key={device.id}><div><strong>{device.name}</strong><small>{device.version} · {device.details} · vu {date(device.lastSeenAt)}</small></div><DeviceRevokeButton id={device.id} /></div>)}</div>{!devices.length ? <p>Aucun Mac enregistré. La connexion web ne consomme pas de slot appareil.</p> : null}</article>
      {!modern && referral ? <ReferralCard link={referral.link} signups={referral.signups} conversions={referral.conversions} rewards={referral.rewards} /> : <article className="account-card"><span className="mono-label">PARRAINAGE</span><h2>Programme en préparation.</h2><p>Les liens ne sont pas encore émis : le checkout et les obligations Stripe/Tax doivent d’abord être validés. Rien à configurer de ton côté avant l’ouverture.</p></article>}
      {modern ? <article className="account-card"><span className="mono-label">ACCÈS PRO</span><h2>Une offre, sans code obligatoire.</h2><p>Pressay Free fonctionne sans compte. À l’ouverture commerciale, Pro s’activera uniquement après confirmation du paiement Stripe ou du Mac App Store.</p></article> : <article className="account-card"><span className="mono-label">CODE D’ACCÈS</span><h2>Tu as reçu un code ?</h2><p>Il ne remplace ni ne raccourcit un abonnement Stripe. Le code est consommé uniquement s’il améliore réellement ton accès ; une réduction Stripe utilise un code promotionnel au checkout.</p><AccessClaimForm /></article>}
    </section>
    <section className="account-privacy"><strong>Ce que Pressay ne reçoit jamais</strong><p>Audio, dictée, historique local, texte sélectionné, fichiers, presse-papiers, prompts privés et clé BYOK restent absents de ce compte.</p><Link href="/fr/privacy">Lire la politique de confidentialité →</Link><DeleteAccountButton /></section>
  </main>;
}

async function loadModernAccount(identityName: string | null): Promise<{ view: AccountView; devices: DeviceView[] } | null> {
  const [meResponse, devicesResponse, billingResponse] = await Promise.all([
    pressayAPI("me"), pressayAPI("devices"), pressayAPI("billing/status")
  ]);
  if (!meResponse.ok || !devicesResponse.ok || !billingResponse.ok) return null;
  const me = await meResponse.json() as ModernAccount;
  const billing = await billingResponse.json() as ModernBilling;
  const devicePayload = await devicesResponse.json() as { devices: ModernDevice[]; limit: number };
  return {
    view: { ...modernAccountView(me, billing, identityName), deviceLimit: devicePayload.limit },
    devices: devicePayload.devices.map((device) => ({
      id: device.id,
      name: device.displayName,
      version: `Pressay ${device.appVersion}`,
      details: device.appVariant === "mas" ? "Mac App Store" : "Version directe",
      lastSeenAt: device.lastSeenAt,
    })),
  };
}

async function loadLegacyAccount(): Promise<{ view: AccountView; devices: DeviceView[] } | null> {
  const [meResponse, entitlementResponse, devicesResponse] = await Promise.all([
    pressayAPI("me"), pressayAPI("entitlements"), pressayAPI("devices")
  ]);
  if (!meResponse.ok || !entitlementResponse.ok || !devicesResponse.ok) return null;
  const me = await meResponse.json() as LegacyAccount;
  const entitlement = await entitlementResponse.json() as LegacyEntitlement;
  const devicePayload = await devicesResponse.json() as { devices: LegacyDevice[] };
  return {
    view: legacyAccountView(me, entitlement),
    devices: devicePayload.devices.map((device) => ({
      id: device.id,
      name: `Pressay ${device.app_version}`,
      version: device.architecture,
      details: device.distribution_channel,
      lastSeenAt: device.last_seen_at,
    })),
  };
}
function AccountUnavailable() { return <main className="auth-page"><div className="auth-placeholder"><h1>Compte bientôt disponible.</h1><p>Le site public reste téléchargeable sans compte. La bêta commerciale ouvrira après validation staging.</p><Link className="button" href="/fr">Retour</Link></div></main>; }
function AccountError() { return <main className="auth-page"><div className="auth-placeholder"><h1>Compte indisponible.</h1><p>La création du compte n’a pas abouti. Réessaie avec le request ID affiché par le support.</p><Link className="button" href="/fr/support">Support</Link></div></main>; }
function date(value: string | null) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "Aucune"; }
