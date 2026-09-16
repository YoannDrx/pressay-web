import Link from "next/link";
import { accountLocale } from "@/lib/account-locale";
import {
  accountResource,
  type AccountMe,
  type Usage,
  type Billing,
  type Devices,
  type Referrals,
  type Resource,
} from "@/lib/account-data";
import {
  AccountMutation,
  AccessCodeForm,
  ReferralLink,
} from "./account-controls";
import { AccountSecurity } from "./account-security";
import { ReferralAttributor } from "./account-actions";
export async function AccountSection({
  section = "overview",
}: {
  section?: string;
}) {
  const locale = await accountLocale();
  const fr = locale === "fr";
  const date = (v: string | null) =>
    v
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
          new Date(v),
        )
      : "—";
  if (section === "security")
    return (
      <>
        <h1>{fr ? "Sécurité du compte" : "Account security"}</h1>
        <AccountSecurity initialSessions={[]} locale={locale} />
        <section className="account-privacy">
          <h2>{fr ? "Confidentialité" : "Privacy"}</h2>
          <p>
            {fr
              ? "Ce compte contient tes droits et ton utilisation Cloud. Il ne contient ni audio, ni dictée, ni historique local."
              : "This account contains your access and Cloud usage. It contains no audio, dictation or local history."}
          </p>
          <Link href={`/${locale}/privacy`}>
            {fr ? "Politique de confidentialité" : "Privacy policy"}
          </Link>
          <AccountMutation
            endpoint="delete-account"
            method="DELETE"
            locale={locale}
            label={fr ? "Supprimer mon compte" : "Delete my account"}
            confirm={
              fr
                ? "Supprimer définitivement ton compte et révoquer tes accès Cloud ? Un abonnement Apple doit être annulé dans les réglages Apple."
                : "Permanently delete your account and revoke Cloud access? Apple subscriptions must be cancelled in Apple settings."
            }
          />
        </section>
      </>
    );
  if (section === "devices") {
    const r = await accountResource<Devices>("devices");
    return (
      <>
        <h1>{fr ? "Tes appareils" : "Your devices"}</h1>
        {r.data ? (
          <article className="account-card">
            <p>
              {r.data.devices.length} / {r.data.limit} Mac
            </p>
            {!r.data.devices.length ? (
              <p>
                {fr
                  ? "Connecte Pressay sur ton Mac pour le retrouver ici. La connexion au site ne consomme pas de place."
                  : "Sign in to Pressay on your Mac to see it here. Website sign-in does not use a device slot."}
              </p>
            ) : null}
            <div className="account-device-list">
              {r.data.devices.map((d) => (
                <div key={d.id}>
                  <div>
                    <strong>{d.displayName}</strong>
                    <small>
                      {d.appVersion} ·{" "}
                      {d.appVariant === "mas"
                        ? "Mac App Store"
                        : fr
                          ? "Version directe"
                          : "Direct download"}{" "}
                      · {fr ? "Dernier contact" : "Last contact"}{" "}
                      {date(d.lastSeenAt)}
                    </small>
                  </div>
                  <AccountMutation
                    endpoint={`/api/pressay/devices/${d.id}`}
                    method="DELETE"
                    locale={locale}
                    label={fr ? "Révoquer" : "Revoke"}
                    confirm={
                      fr
                        ? "Révoquer l’accès Cloud de ce Mac ?"
                        : "Revoke this Mac’s Cloud access?"
                    }
                  />
                </div>
              ))}
            </div>
          </article>
        ) : (
          <ResourceError resource={r} locale={locale} />
        )}
      </>
    );
  }
  if (section === "referrals") {
    const r = await accountResource<Referrals>("referrals/me");
    return (
      <>
        <h1>
          {fr ? "Parrainage et invitations" : "Referrals and invitations"}
        </h1>
        <ReferralAttributor />
        <section className="account-grid">
          <article className="account-card">
            <h2>{fr ? "Partage Pressay" : "Share Pressay"}</h2>
            {r.data ? (
              <>
                <p>
                  {fr
                    ? "Après le premier paiement Stripe de ton filleul, chacun reçoit un avantage équivalent à 30 jours Pro. Les abonnements Apple sont exclus de ce programme."
                    : "After your friend’s first Stripe payment, each of you receives a reward equivalent to 30 days of Pro. Apple subscriptions are excluded."}
                </p>
                <p>
                  {fr
                    ? "Abonné Stripe : crédit sur une prochaine facture (une mensualité ou 30/365 du tarif annuel). Sans abonnement : 30 jours Pro."
                    : "Stripe subscriber: credit on a future invoice (one monthly payment or 30/365 of the annual price). Without a subscription: 30 days of Pro."}
                </p>
                <ReferralLink link={r.data.link} locale={locale} />
                <dl>
                  <dt>{fr ? "Inscrits" : "Sign-ups"}</dt>
                  <dd>{r.data.signups}</dd>
                  <dt>{fr ? "Premiers paiements" : "First payments"}</dt>
                  <dd>{r.data.conversions}</dd>
                </dl>
                {r.data.rewards.map((reward) => (
                  <p key={reward.id}>
                    {rewardLabel(reward.status, fr)}
                    {reward.amount_minor
                      ? ` · ${(reward.amount_minor / 100).toFixed(2)} €`
                      : ""}
                  </p>
                ))}
              </>
            ) : (
              <ResourceError resource={r} locale={locale} />
            )}
          </article>
          <article className="account-card">
            <h2>{fr ? "Tu as reçu un code ?" : "Received an access code?"}</h2>
            <p>
              {fr
                ? "Active ton accès offert. Un code ne raccourcit jamais un abonnement existant."
                : "Activate your gift. A code never shortens an existing subscription."}
            </p>
            <AccessCodeForm locale={locale} />
          </article>
        </section>
      </>
    );
  }
  const [me, billing, usage] = await Promise.all([
    accountResource<AccountMe>("me"),
    accountResource<Billing>("billing/status"),
    accountResource<Usage>("usage"),
  ]);
  return (
    <>
      <h1>
        {section === "billing"
          ? fr
            ? "Ton abonnement"
            : "Your subscription"
          : fr
            ? "Ton espace Pressay"
            : "Your Pressay account"}
      </h1>
      <ReferralAttributor />
      <section className="account-grid">
        <article className="account-card">
          <h2>
            {me.data
              ? `Pressay ${me.data.entitlement.tier === "pro" ? "Pro" : "Free"}`
              : fr
                ? "Ton offre"
                : "Your plan"}
          </h2>
          {me.data ? (
            <>
              <p>{me.data.email}</p>
              <p>{sourceLabel(me.data.entitlement.source, fr)}</p>
              <dl>
                <dt>{fr ? "Accès jusqu’au" : "Access until"}</dt>
                <dd>{date(me.data.entitlement.validUntil)}</dd>
                <dt>
                  {fr ? "Accès hors ligne jusqu’au" : "Offline access until"}
                </dt>
                <dd>{date(me.data.entitlement.offlineGraceUntil)}</dd>
              </dl>
            </>
          ) : (
            <ResourceError resource={me} locale={locale} />
          )}
          {billing.data ? (
            <>
              <p>
                {billing.data.cancelAtPeriodEnd
                  ? fr
                    ? "Renouvellement annulé"
                    : "Renewal cancelled"
                  : statusLabel(billing.data.status, fr)}{" "}
                {date(billing.data.currentPeriodEndsAt)}
              </p>
              {billing.data.provider === "stripe" ? (
                <AccountMutation
                  endpoint="/api/portal"
                  locale={locale}
                  label={fr ? "Gérer la facturation" : "Manage billing"}
                />
              ) : billing.data.provider === "app_store" ? (
                <a
                  className="button"
                  href="https://apps.apple.com/account/subscriptions"
                >
                  {fr ? "Gérer chez Apple" : "Manage with Apple"}
                </a>
              ) : (
                <Link className="button" href={`/${locale}/pricing`}>
                  {fr ? "Voir les offres" : "View plans"}
                </Link>
              )}
            </>
          ) : (
            <ResourceError resource={billing} locale={locale} />
          )}
        </article>
        <article className="account-card">
          <h2>{fr ? "Utilisation Cloud" : "Cloud usage"}</h2>
          {usage.data ? (
            <>
              <dl>
                <dt>{fr ? "Transcription" : "Transcription"}</dt>
                <dd>
                  {Math.ceil(usage.data.transcription.usedSeconds / 60)} /{" "}
                  {Math.floor(usage.data.transcription.limitSeconds / 60)} min
                </dd>
                <dt>{fr ? "Transformations" : "Transformations"}</dt>
                <dd>
                  {usage.data.transformations.used} /{" "}
                  {usage.data.transformations.limit}
                </dd>
              </dl>
              <p>
                {fr
                  ? "Compteurs du mois en cours. La dictée locale est illimitée et ne figure pas dans ces statistiques."
                  : "Current calendar month. Local dictation is unlimited and is not included in these statistics."}
              </p>
            </>
          ) : (
            <ResourceError resource={usage} locale={locale} />
          )}
        </article>
      </section>
      <div className="account-section-links">
        <Link className="button" href="/account/devices">
          {fr ? "Mes Mac" : "My Macs"}
        </Link>
        <Link className="button" href="/account/referrals">
          {fr ? "Invitations et parrainage" : "Invitations and referrals"}
        </Link>
      </div>
    </>
  );
}
export function ResourceError({
  resource,
  locale,
}: {
  resource: Resource<unknown>;
  locale: "fr" | "en";
}) {
  const fr = locale === "fr";
  const label =
    resource.code === "referrals_disabled"
      ? fr
        ? "Le programme de parrainage n’est pas encore ouvert. Les codes d’accès offerts restent utilisables."
        : "The referral program is not open yet. Gift access codes can still be redeemed."
      : resource.status === 401
        ? fr
          ? "La session doit être actualisée."
          : "Your session needs refreshing."
        : resource.status === 403
          ? fr
            ? "Cet accès n’est pas autorisé."
            : "This access is not authorized."
          : resource.status === 404
            ? fr
              ? "Cette fonctionnalité est temporairement indisponible."
              : "This feature is temporarily unavailable."
            : fr
              ? "Impossible de charger cette section. Réessaie dans quelques instants."
              : "Unable to load this section. Please try again shortly.";
  return (
    <div className="account-error" role="status">
      <p>{label}</p>
      {resource.requestId ? (
        <small>
          {fr ? "Référence support" : "Support reference"} :{" "}
          {resource.requestId}
        </small>
      ) : null}
    </div>
  );
}
function sourceLabel(source: string, fr: boolean) {
  return (
    (
      {
        stripe: fr ? "Abonnement direct Stripe" : "Direct Stripe subscription",
        app_store: fr
          ? "Abonnement Mac App Store"
          : "Mac App Store subscription",
        support: fr ? "Accès offert par Pressay" : "Access granted by Pressay",
        trial: fr ? "Accès historique" : "Legacy access",
      } as Record<string, string>
    )[source] ??
    (fr
      ? "Dictée locale gratuite, sans compte ni réseau."
      : "Free local dictation, without an account or network.")
  );
}
function statusLabel(status: string | null, fr: boolean) {
  return (
    (
      {
        active: fr ? "Actif" : "Active",
        past_due: fr ? "Paiement à régulariser" : "Payment overdue",
        canceled: fr ? "Résilié" : "Cancelled",
        expired: fr ? "Expiré" : "Expired",
        refunded: fr ? "Remboursé" : "Refunded",
        trialing: fr ? "Accès temporaire" : "Temporary access",
      } as Record<string, string>
    )[status ?? ""] ?? ""
  );
}
function rewardLabel(status: string, fr: boolean) {
  return (
    (
      {
        pending: fr ? "Récompense en attente" : "Reward pending",
        processing: fr ? "En cours" : "Processing",
        applied: fr ? "Récompense appliquée" : "Reward applied",
        failed: fr ? "Traitement à reprendre" : "Processing failed",
        cancelled: fr ? "Annulée ou non éligible" : "Cancelled or ineligible",
        review: fr ? "À vérifier par le support" : "Support review required",
      } as Record<string, string>
    )[status] ?? status
  );
}
