import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable } from "@/components/admin-data";
import { money } from "@/lib/admin-format";
import { metricsSummary } from "@/lib/admin-metrics";
import type { AdminMetrics } from "@/lib/operations-contract";

const providers: Record<string, string> = { stripe: "Stripe", app_store: "App Store" };
const statuses: Record<string, string> = {
  trialing: "Essai",
  active: "Actif",
  past_due: "Impayé (grâce)",
  grace: "Délai de grâce Apple",
};
const grantSources: Record<string, string> = {
  support: "Offert par le support",
  invitation: "Invitation",
  referral: "Parrainage",
  legacy: "Historique",
};
const amounts = (rows: { currency: string; amountMinor: number }[]) =>
  rows.length ? rows.map((row) => money(row.amountMinor, row.currency)).join(" + ") : "0";

export default async function Page() {
  const { data: m, error } = await adminData<AdminMetrics>("admin/metrics");
  const s = m ? metricsSummary(m) : null;
  return (
    <>
      <AdminHeading
        eyebrow="PRESSAY / INDICATEURS"
        title="Indicateurs"
        detail="Abonnés, revenus récurrents, inscriptions, activité et téléchargements. Agrégats uniquement, sans donnée personnelle."
      />
      {error}
      {m && s ? (
        <>
          <section className="admin-kpis">
            {[
              ["MRR (Stripe + App Store)", amounts(s.mrr)],
              ["ARR", amounts(s.arr)],
              [
                "Abonnés payants",
                `${s.paying} · ${s.payingByProvider.stripe} Stripe · ${s.payingByProvider.app_store} App Store`,
              ],
              ["Essais en cours", s.trials],
              [
                "Actifs 7 j · 30 j",
                `${m.activeAccounts.active_7d} · ${m.activeAccounts.active_30d}`,
              ],
              ["Inscriptions 30 j", s.signups30d],
              ["Accès offerts actifs", s.activeGrants],
              [
                "Encaissé ce mois",
                m.collectedThisMonth.length
                  ? m.collectedThisMonth
                      .map((row) => money(row.paid_minor, row.currency))
                      .join(" + ")
                  : "0",
              ],
            ].map(([label, value]) => (
              <article key={String(label)}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>
          <p>
            MRR : abonnements Production payants maintenant (actifs, impayés en
            délai de grâce), annuels divisés par 12, au prix facturé au client
            (taxes comprises, avant commissions Stripe et Apple). Essais et
            Sandbox Apple exclus.
            {s.estimated
              ? ` ${s.estimated} abonnement(s) antérieur(s) à l’enregistrement des prix sont estimés au tarif catalogue.`
              : ""}
            {s.sandbox ? ` Sandbox Apple actif (non payé) : ${s.sandbox}.` : ""}
          </p>

          <h2>Revenus récurrents par source</h2>
          <AdminTable
            headers={["Source", "Devise", "Abonnements", "MRR", "ARR", "Estimés"]}
            rows={m.mrr.map((row) => [
              providers[row.provider] ?? row.provider,
              row.currency.toUpperCase(),
              row.subscriptions,
              money(row.mrr_minor, row.currency),
              money(row.arr_minor, row.currency),
              row.estimated_subscriptions,
            ])}
          />

          <h2>Abonnements en cours</h2>
          <AdminTable
            headers={["Source", "Périodicité", "Statut", "Environnement", "Nombre"]}
            rows={m.subscribers.map((row) => [
              providers[row.provider] ?? row.provider,
              row.billing_interval === "year" ? "Annuel" : "Mensuel",
              statuses[row.status] ?? row.status,
              row.environment === "Sandbox" ? "Sandbox (non payé)" : "Production",
              row.count,
            ])}
          />

          <h2>Inscriptions par jour (30 jours, UTC)</h2>
          <div className="admin-panel">
            <div className="admin-bars">
              {m.signups.map((day) => (
                <div key={day.day}>
                  <span>{day.day.slice(5)}</span>
                  <i
                    style={{
                      width: `${(day.count / s.signupsPeak) * 100}%`,
                      minWidth: day.count ? 4 : 0,
                    }}
                  />
                  <strong>{day.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <h2>Encaissements du mois</h2>
          <AdminTable
            headers={["Devise", "Factures payées", "Encaissé", "Remboursé"]}
            rows={m.collectedThisMonth.map((row) => [
              row.currency.toUpperCase(),
              row.invoices,
              money(row.paid_minor, row.currency),
              money(row.refunded_minor, row.currency),
            ])}
          />
          <p>Stripe uniquement : Apple ne transmet pas les encaissements.</p>

          <h2>Accès offerts actifs</h2>
          <AdminTable
            headers={["Origine", "Comptes"]}
            rows={m.grants.map((row) => [grantSources[row.source] ?? row.source, row.count])}
          />

          <h2>Téléchargements ({s.downloads30d} sur 30 jours)</h2>
          <AdminTable
            headers={["Plateforme", "Version", "7 jours", "30 jours"]}
            rows={m.downloads.map((row) => [
              row.platform === "windows" ? "Windows" : "Mac",
              row.app_version,
              row.last_7d,
              row.last_30d,
            ])}
          />
        </>
      ) : null}
    </>
  );
}
