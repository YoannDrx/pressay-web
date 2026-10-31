import { AdminHeading } from "@/components/admin-heading";
import Link from "next/link";
import { adminData, AdminTable } from "@/components/admin-data";
import { alertItems } from "@/lib/admin-billing";
import type { AdminAlerts } from "@/lib/operations-contract";
type Overview = {
  catalogueMRRMinor: number;
  users: number;
  new_30d: number;
  active_grants: number;
  referrals: number;
  conversions: number;
  credits_minor: number;
  failed_webhooks: number;
  cloud_seconds: number;
  cloud_transformations: number;
  downloads_7d?: number;
  downloads_30d?: number;
  plans?: { plan: string; count: number }[];
  subscriptions: {
    provider: string;
    billing_interval: string;
    count: number;
  }[];
};
export default async function Page() {
  const [{ data: d, error }, { data: alerts }] = await Promise.all([
    adminData<Overview>("admin/overview"),
    adminData<AdminAlerts>("admin/alerts"),
  ]);
  const attention = alertItems(alerts, d?.failed_webhooks ?? 0);
  return (
    <>
      <AdminHeading
        eyebrow="PRESSAY / OPERATIONS"
        title="Vue d’ensemble"
        detail="Comptes, abonnements et consommation serveur. Le dernier contact d’un appareil n’est pas une mesure de dictée."
      />
      {error}
      {d ? (
        attention.length ? (
          <section className="admin-alerts" role="alert">
            <h2>À traiter</h2>
            <ul>
              {attention.map((item) => (
                <li key={item.key}>
                  {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="admin-alerts-ok">
            Aucun webhook en échec, litige ouvert, impayé ni doublon d’abonnement.
          </p>
        )
      ) : null}
      {d ? (
        <>
          <section className="admin-kpis">
            {[
              ["Comptes actifs", d.users],
              ["Nouveaux sur 30 jours", d.new_30d],
              ["Accès offerts actifs", d.active_grants],
              ["Parrainages convertis", `${d.conversions} / ${d.referrals}`],
              [
                "MRR Stripe au tarif catalogue",
                `${(d.catalogueMRRMinor / 100).toFixed(2)} €`,
              ],
              ["Crédits attribués", `${(d.credits_minor / 100).toFixed(2)} €`],
              [
                "Téléchargements 7 j · 30 j",
                `${d.downloads_7d ?? 0} · ${d.downloads_30d ?? 0}`,
              ],
              [
                "Cloud ce mois",
                `${Math.ceil(d.cloud_seconds / 60)} min · ${d.cloud_transformations} transformations`,
              ],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>
          {d.plans ? (
            <>
              <h2>Comptes actifs par offre</h2>
              <AdminTable
                headers={["Offre", "Comptes"]}
                rows={d.plans.map((p) => [
                  p.plan === "sandbox"
                    ? "Sandbox Apple (non payé)"
                    : p.plan === "pro"
                      ? "Pro (payant ou offert)"
                      : "Free",
                  p.count,
                ])}
              />
            </>
          ) : null}
          <h2>Abonnements payants actifs</h2>
          <AdminTable
            headers={["Fournisseur", "Périodicité", "Abonnements"]}
            rows={d.subscriptions.map((s) => [
              s.provider,
              s.billing_interval === "year" ? "Annuel" : "Mensuel",
              s.count,
            ])}
          />
          <p>
            Le MRR est une estimation au tarif catalogue (annuels divisés par
            12), avant promotions, taxes et impayés ; ce n’est pas le revenu
            encaissé. Apple est exclu de cette estimation. Les crédits
            promotionnels et les accès offerts sont présentés séparément.
            Webhooks en erreur : {d.failed_webhooks}.
          </p>
        </>
      ) : null}
    </>
  );
}
