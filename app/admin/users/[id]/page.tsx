import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { AdminActionForm } from "@/components/admin-action-form";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import { readAdminIdentity, type AdminIdentity } from "@/lib/admin-identity";
import {
  describeUserAgent,
  money,
  paymentNeedsAction,
  platformLabel,
  stripeDashboardURL,
} from "@/lib/admin-format";
import type { AdminUserDetail } from "@/lib/operations-contract";

const sourceLabels: Record<string, string> = {
  none: "Aucune",
  trial: "Accès historique",
  stripe: "Stripe",
  app_store: "App Store",
  support: "Accès offert",
};
const subscriptionStatus: Record<string, string> = {
  trialing: "Essai",
  active: "Actif",
  past_due: "Impayé",
  grace: "Délai de grâce Apple",
  paused: "En pause",
  canceled: "Résilié",
  expired: "Expiré",
  refunded: "Remboursé",
};
const financialKinds: Record<string, string> = {
  invoice_paid: "Facture payée",
  invoice_failed: "Paiement échoué",
  invoice_voided: "Facture annulée",
  refund: "Remboursement",
  dispute: "Litige",
};
const providerLabels: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  credential: "Mot de passe",
};

function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="admin-definitions admin-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function ExternalId({ id, href }: { id: string | null; href: string | null }) {
  if (!id) return <>—</>;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer noopener">
      <code>{id}</code> ↗
    </a>
  ) : (
    <code>{id}</code>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // The Cloud checks the owner role and the ten-minute step-up, then audits
  // both the record read and the identity read before anything is shown.
  const { data: d, error } = await adminData<AdminUserDetail>(
    `admin/users/${encodeURIComponent(id)}?include=identity`,
  );
  const identity = d ? await readAdminIdentity(d) : null;
  const stripeMode = d?.billingCustomer?.stripeMode;
  const activeDevices = d?.devices.filter((v) => !v.revokedAt) ?? [];
  return (
    <>
      <Link href="/admin/users">← Utilisateurs</Link>
      <AdminHeading
        eyebrow="COMPTE / FICHE CLIENT"
        title={d?.account.email ?? "Utilisateur"}
        detail={id}
      />
      {error}
      {d ? (
        <>
          {d.account.status !== "active" ? (
            <div className="account-error" role="status">
              {d.account.status === "deleting"
                ? `Suppression demandée le ${adminDate(d.account.deletionRequestedAt)}`
                : "Compte supprimé"}
              {d.deletion
                ? ` · tâche ${d.deletion.state}, ${d.deletion.attempts} tentative(s)${d.deletion.last_error_code ? `, dernière erreur ${d.deletion.last_error_code}` : ""}${d.deletion.state === "completed" ? "" : `, prochaine ${adminDate(d.deletion.next_attempt_at)}`}`
                : ""}
            </div>
          ) : null}
          {d.subscriptions.some((s) => paymentNeedsAction(s.status)) ? (
            <div className="account-error" role="status">
              Paiement à régulariser sur un abonnement.
            </div>
          ) : null}
          <section className="admin-grid-two admin-detail">
            <article className="admin-panel">
              <h2>Compte</h2>
              <Facts
                items={[
                  ["Compte Cloud", <code key="a">{d.account.accountId}</code>],
                  [
                    "Identité (site)",
                    d.account.authUserId ? (
                      <code key="u">{d.account.authUserId}</code>
                    ) : (
                      "—"
                    ),
                  ],
                  ["Statut", d.account.status],
                  ["Inscription", adminDate(d.account.createdAt)],
                ]}
              />
            </article>
            <article className="admin-panel">
              <h2>Offre effective</h2>
              <Facts
                items={[
                  [
                    "Offre",
                    d.account.entitlement.tier === "pro"
                      ? d.account.entitlement.sandbox
                        ? "Pro Sandbox Apple (non payé)"
                        : "Pro"
                      : "Free",
                  ],
                  [
                    "Source",
                    sourceLabels[d.account.entitlement.source] ??
                      d.account.entitlement.source,
                  ],
                  ["Valable jusqu’au", adminDate(d.account.entitlement.validUntil)],
                  [
                    "Hors ligne jusqu’au",
                    adminDate(d.account.entitlement.offlineGraceUntil),
                  ],
                  ["Révision", d.account.entitlement.revision],
                ]}
              />
            </article>
            <article className="admin-panel">
              <h2>Identifiants de facturation</h2>
              <Facts
                items={[
                  [
                    "Client Stripe",
                    <ExternalId
                      key="cus"
                      id={d.billingCustomer?.stripeCustomerId ?? null}
                      href={stripeDashboardURL(
                        d.billingCustomer?.stripeCustomerId,
                        stripeMode,
                      )}
                    />,
                  ],
                  ["Mode Stripe", stripeMode === "live" ? "Production" : "Test"],
                  [
                    "Transaction Apple d’origine",
                    <ExternalId
                      key="apple"
                      id={
                        d.billingCustomer?.appStoreOriginalTransactionId ?? null
                      }
                      href={null}
                    />,
                  ],
                ]}
              />
            </article>
            <IdentityPanel identity={identity} />
          </section>

          <h2>Abonnements</h2>
          <AdminTable
            headers={[
              "Fournisseur",
              "Identifiant",
              "Statut",
              "Périodicité",
              "Période",
              "Essai jusqu’au",
              "Fin de période",
              "Grâce jusqu’au",
              "Environnement",
            ]}
            rows={d.subscriptions.map((s) => [
              s.provider === "stripe" ? "Stripe" : "App Store",
              <ExternalId
                key="sub"
                id={s.provider_subscription_id ?? null}
                href={
                  s.provider === "stripe"
                    ? stripeDashboardURL(s.provider_subscription_id, stripeMode)
                    : null
                }
              />,
              <span
                key="status"
                className={paymentNeedsAction(s.status) ? "admin-danger" : ""}
              >
                {subscriptionStatus[s.status] ?? s.status}
              </span>,
              s.billing_interval === "year" ? "Annuel" : "Mensuel",
              `${adminDate(s.current_period_starts_at)} → ${adminDate(s.current_period_ends_at)}`,
              adminDate(s.trial_ends_at),
              s.cancel_at_period_end ? "Résiliation programmée" : "Renouvellement",
              adminDate(s.grace_ends_at),
              s.apple_environment === "Sandbox" ? "Sandbox (non payé)" : "Production",
            ])}
          />

          <h2>Paiements, remboursements et litiges</h2>
          <AdminTable
            headers={["Date", "Événement", "Montant", "Statut", "Objet Stripe"]}
            rows={(d.financialEvents ?? []).map((f) => [
              adminDate(f.provider_occurred_at),
              <span
                key="kind"
                className={
                  ["invoice_failed", "refund", "dispute"].includes(f.kind)
                    ? "admin-danger"
                    : ""
                }
              >
                {financialKinds[f.kind] ?? f.kind}
                {f.full_reversal ? " (total)" : ""}
              </span>,
              money(f.amount_minor, f.currency),
              f.status,
              <ExternalId
                key="obj"
                id={f.provider_object_id}
                href={stripeDashboardURL(f.provider_object_id, stripeMode)}
              />,
            ])}
          />

          <h2>
            Appareils ({activeDevices.length} / 3 actifs, {d.devices.length} au
            total)
          </h2>
          <AdminTable
            headers={[
              "Nom",
              "Plateforme",
              "Version",
              "Identifiant",
              "Ajouté",
              "Dernier contact",
              "État",
            ]}
            rows={d.devices.map((v) => [
              v.displayName,
              platformLabel(v.platform, v.appVariant),
              v.appVersion,
              <code key="id">{v.id}</code>,
              adminDate(v.createdAt),
              adminDate(v.lastSeenAt),
              v.revokedAt ? `Révoqué le ${adminDate(v.revokedAt)}` : "Actif",
            ])}
          />

          <h2>Usage Cloud (12 mois)</h2>
          <AdminTable
            headers={["Mois", "Transcription", "Transformations"]}
            rows={(d.usageHistory ?? []).map((u) => [
              u.period_start.slice(0, 7),
              `${Math.ceil(u.transcription_seconds_used / 60)} min`,
              u.transformations_used,
            ])}
          />

          <h2>Consentements au paiement</h2>
          <AdminTable
            headers={["Date", "Version des conditions", "Exécution immédiate"]}
            rows={(d.legalAcceptances ?? []).map((l) => [
              adminDate(l.accepted_at),
              l.terms_version,
              l.immediate_performance_consent ? "Acceptée" : "Non",
            ])}
          />

          <h2>Accès offerts</h2>
          <AdminTable
            headers={["Origine", "Début", "Fin", "État", "Action"]}
            rows={d.grants.map((g) => [
              g.source,
              adminDate(g.starts_at),
              adminDate(g.ends_at),
              g.revoked_at ? "Révoqué" : "Accordé",
              !g.revoked_at ? (
                <AdminActionForm
                  key={g.id}
                  endpoint={`/api/pressay/admin/grants/${g.id}/revoke`}
                  title="Révoquer cet accès"
                  submitLabel="Révoquer"
                  fields={[{ name: "reason", label: "Motif", required: true }]}
                  confirmMessage="Retirer cet accès offert ? Les abonnements payants seront conservés."
                />
              ) : (
                "—"
              ),
            ])}
          />

          <h2>Parrainages</h2>
          <AdminTable
            headers={["Parrain", "Filleul", "Statut", "Date"]}
            rows={d.referrals.map((r) => [
              <Link key="from" href={`/admin/users/${r.referrer_id}`}>
                {r.referrer_id === d.account.accountId ? "Ce compte" : r.referrer_id}
              </Link>,
              <Link key="to" href={`/admin/users/${r.referee_id}`}>
                {r.referee_id === d.account.accountId ? "Ce compte" : r.referee_id}
              </Link>,
              r.status,
              adminDate(r.attributed_at),
            ])}
          />

          <h2>Journal d’audit de ce compte</h2>
          <AdminTable
            headers={["Date", "Action", "Cible", "Motif", "Résultat", "Requête"]}
            rows={(d.audit ?? []).map((a) => [
              adminDate(a.created_at),
              a.action,
              a.target_id === d.account.accountId ? "Compte" : a.target_id,
              a.reason,
              a.result,
              <code key="req">{a.request_id}</code>,
            ])}
          />
          {d.auditReads ? (
            <p>
              Consultations de cette fiche journalisées :{" "}
              {d.auditReads.count}
              {d.auditReads.lastAt
                ? `, la dernière le ${adminDate(d.auditReads.lastAt)}`
                : ""}
              .
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function IdentityPanel({ identity }: { identity: AdminIdentity | null }) {
  if (!identity) return null;
  if (identity.status !== "ok")
    return (
      <article className="admin-panel">
        <h2>Connexion au site</h2>
        <p>
          {identity.status === "step_up_required"
            ? "Valide ton code Authenticator pour afficher les méthodes de connexion."
            : identity.status === "not_configured"
              ? "Identité du site non configurée sur cet environnement."
              : "Identité du site temporairement indisponible."}
        </p>
      </article>
    );
  if (!identity.exists)
    return (
      <article className="admin-panel">
        <h2>Connexion au site</h2>
        <p>Aucune identité sur le site pour ce compte (supprimée ou jamais créée ici).</p>
      </article>
    );
  return (
    <article className="admin-panel">
      <h2>Connexion au site</h2>
      <Facts
        items={[
          [
            "Méthodes liées",
            identity.providers.length
              ? identity.providers
                  .map((p) => providerLabels[p.providerId] ?? p.providerId)
                  .join(", ")
              : "Aucune",
          ],
          [
            "Passkeys",
            identity.passkeys.length
              ? identity.passkeys
                  .map(
                    (p) =>
                      `${p.name ?? "Sans nom"}${p.backedUp ? " (synchronisée)" : ""}`,
                  )
                  .join(", ")
              : "Aucune",
          ],
          ["Code Authenticator", identity.twoFactorEnabled ? "Activé" : "Non"],
          ["E-mail vérifié", identity.emailVerified ? "Oui" : "Non"],
          ["Dernière connexion", adminDate(identity.lastSignInAt)],
          ["Sessions web actives", identity.sessions.length],
          ["Apps de bureau autorisées", identity.desktopAuthorizations],
          ["Identité créée", adminDate(identity.createdAt)],
        ]}
      />
      {identity.sessions.length ? (
        <ul className="admin-session-list">
          {identity.sessions.map((s) => (
            <li key={s.createdAt + s.updatedAt}>
              {describeUserAgent(s.userAgent)} · ouverte{" "}
              {adminDate(s.createdAt)} · active {adminDate(s.updatedAt)}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
