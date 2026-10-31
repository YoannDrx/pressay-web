import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import { money, platformLabel } from "@/lib/admin-format";
import { metricsSummary } from "@/lib/admin-metrics";
import { AdminDownload } from "@/components/admin-download";
import { ADMIN_LOCALE, adminMessages, fill } from "@/lib/admin-i18n";
import { metricsMessages } from "@/lib/admin-messages/metrics";
import {
  exportRange,
  metricDayOptions,
  metricExportDatasets,
  metricMonthOptions,
  metricPeriod,
  monthLabel,
  percent,
} from "@/lib/admin-analytics";
import type {
  AdminAdvancedMetrics,
  AdminMetrics,
} from "@/lib/operations-contract";

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const period = metricPeriod(await searchParams);
  const [{ data: m, error }, advanced] = await Promise.all([
    adminData<AdminMetrics>("admin/metrics"),
    adminData<AdminAdvancedMetrics>(
      `admin/metrics/advanced?months=${period.months}&days=${period.days}`,
    ),
  ]);
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
      <AdvancedMetrics data={advanced.data} period={period} />
    </>
  );
}

function AdvancedMetrics({
  data,
  period,
}: {
  data: AdminAdvancedMetrics | null;
  period: { months: number; days: number };
}) {
  const t = adminMessages(metricsMessages);
  const locale = ADMIN_LOCALE;
  const lastChurn = data?.churn.at(-2);
  return (
    <section className="admin-advanced" aria-labelledby="advanced-metrics">
      <form className="admin-filters admin-period" method="get">
        <label>
          {t.period.label}
          <select name="months" defaultValue={String(period.months)}>
            {metricMonthOptions.map((count) => (
              <option key={count} value={count}>
                {fill(t.period.months, { count })}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.period.days}
          <select name="days" defaultValue={String(period.days)}>
            {metricDayOptions.map((count) => (
              <option key={count} value={count}>
                {fill(t.period.daysOption, { count })}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-small" type="submit">
          {t.period.apply}
        </button>
      </form>
      {!data ? (
        <p className="account-error" role="alert">
          {t.unavailable}
        </p>
      ) : (
        <>
          <p className="admin-search-kind">
            {data.historyStartedAt
              ? fill(t.history.since, { date: adminDate(data.historyStartedAt) })
              : t.history.empty}
          </p>
          <h2 id="advanced-metrics">{t.churn.title}</h2>
          <p>{t.churn.detail}</p>
          {lastChurn ? (
            <p className="admin-churn-last">
              {t.churn.last} ({monthLabel(lastChurn.month, locale)}) :{" "}
              <strong>
                {percent(lastChurn.churned, lastChurn.paying_start, locale)}
              </strong>
            </p>
          ) : null}
          <AdminTable
            headers={t.churn.headers}
            rows={data.churn.map((row) => [
              monthLabel(row.month, locale),
              row.paying_start,
              row.new_paying,
              row.churned,
              percent(row.churned, row.paying_start, locale),
            ])}
          />
          <h2>{t.cohorts.title}</h2>
          <p>{t.cohorts.detail}</p>
          <AdminTable
            headers={t.cohorts.headers}
            rows={data.cohorts.map((row) => [
              monthLabel(row.month, locale),
              row.signups,
              row.converted,
              percent(row.converted, row.signups, locale),
              `${row.converted_30d} · ${percent(row.converted_30d, row.signups, locale)}`,
              row.trials,
            ])}
          />
          <h2>{t.trials.title}</h2>
          <p>{t.trials.detail}</p>
          <AdminTable
            headers={t.trials.headers}
            rows={data.trials.map((row) => [
              monthLabel(row.month, locale),
              row.started,
              row.converted,
              row.ended,
              row.running,
              percent(row.converted, row.converted + row.ended, locale),
            ])}
          />
          <h2>{fill(t.downloads.title, { days: data.days })}</h2>
          <div className="admin-grid-two">
            <div>
              <h3>{t.downloads.platforms}</h3>
              <AdminTable
                headers={[t.downloads.headers.platform, t.downloads.headers.count]}
                rows={data.downloads.platforms.map((row) => [
                  platformLabel(row.platform),
                  row.count,
                ])}
              />
            </div>
            <div>
              <h3>{t.downloads.versions}</h3>
              <AdminTable
                headers={[
                  t.downloads.headers.platform,
                  t.downloads.headers.version,
                  t.downloads.headers.count,
                ]}
                rows={data.downloads.versions.map((row) => [
                  platformLabel(row.platform),
                  row.app_version,
                  row.count,
                ])}
              />
            </div>
            <div>
              <h3>{t.downloads.sources}</h3>
              <AdminTable
                headers={[t.downloads.headers.source, t.downloads.headers.count]}
                rows={data.downloads.sources.map((row) => [row.source, row.count])}
              />
            </div>
            <div>
              <h3>{t.downloads.campaigns}</h3>
              <AdminTable
                headers={[t.downloads.headers.campaign, t.downloads.headers.count]}
                rows={data.downloads.campaigns.map((row) => [
                  row.campaign,
                  row.count,
                ])}
              />
            </div>
          </div>
        </>
      )}
      <h2>{t.exports.title}</h2>
      <p>{t.exports.detail}</p>
      <div className="admin-exports">
        {metricExportDatasets.map((dataset) => (
          <AdminDownload
            key={dataset}
            href={`/api/admin/export/${dataset}.csv?${exportRange(dataset)}=${
              exportRange(dataset) === "months" ? period.months : period.days
            }`}
            label={t.exports[dataset]}
            messages={t.exports}
          />
        ))}
      </div>
    </section>
  );
}
