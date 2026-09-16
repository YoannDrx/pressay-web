import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { AdminActionForm } from "@/components/admin-action-form";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import type { AccountMe, Devices, Usage } from "@/lib/account-data";
type Detail = {
  account: AccountMe;
  devices: Devices["devices"];
  usage: Usage;
  subscriptions: {
    provider: string;
    status: string;
    billing_interval: string;
    current_period_ends_at: string;
    apple_environment: string;
  }[];
  grants: {
    id: string;
    source: string;
    ends_at: string;
    revoked_at: string | null;
  }[];
  referrals: {
    id: string;
    referrer_id: string;
    referee_id: string;
    status: string;
  }[];
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: d, error } = await adminData<Detail>(
    `admin/users/${encodeURIComponent(id)}`,
  );
  return (
    <>
      <Link href="/admin/users">← Utilisateurs</Link>
      <AdminHeading
        eyebrow="COMPTE / DONNÉES SERVEUR"
        title={d?.account.email ?? "Utilisateur"}
        detail={id}
      />
      {error}
      {d ? (
        <>
          <p>
            Offre effective : {d.account.entitlement.tier} ·{" "}
            {d.account.entitlement.source} · jusqu’au{" "}
            {adminDate(d.account.entitlement.validUntil)}
          </p>
          <p>
            Cloud : {Math.ceil(d.usage.transcription.usedSeconds / 60)} minutes
            et {d.usage.transformations.used} transformations ce mois.
          </p>
          <h2>Appareils</h2>
          <AdminTable
            headers={["Nom", "Version", "Canal", "Dernier contact"]}
            rows={d.devices.map((v) => [
              v.displayName,
              v.appVersion,
              v.appVariant,
              adminDate(v.lastSeenAt),
            ])}
          />
          <h2>Abonnements</h2>
          <AdminTable
            headers={[
              "Fournisseur",
              "Statut",
              "Périodicité",
              "Échéance",
              "Environnement",
            ]}
            rows={d.subscriptions.map((s) => [
              s.provider,
              s.status,
              s.billing_interval,
              adminDate(s.current_period_ends_at),
              s.apple_environment,
            ])}
          />
          <h2>Accès offerts</h2>
          <AdminTable
            headers={["Origine", "Fin", "État", "Action"]}
            rows={d.grants.map((g) => [
              g.source,
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
            headers={["Parrain", "Filleul", "Statut"]}
            rows={d.referrals.map((r) => [
              <Link key="from" href={`/admin/users/${r.referrer_id}`}>
                {r.referrer_id}
              </Link>,
              <Link key="to" href={`/admin/users/${r.referee_id}`}>
                {r.referee_id}
              </Link>,
              r.status,
            ])}
          />
        </>
      ) : null}
    </>
  );
}
