import type { AdminMetrics } from "./operations-contract";

/** Sum of amounts per currency, currencies in alphabetical order. */
function byCurrency(rows: { currency: string; value: number }[]) {
  const totals = new Map<string, number>();
  for (const row of rows)
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.value);
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amountMinor]) => ({ currency, amountMinor }));
}

/**
 * Headline numbers of the metrics screen. Paying subscribers are Production
 * subscriptions that are not trials; Sandbox (App Review, TestFlight) is
 * counted apart and never as revenue.
 */
export function metricsSummary(metrics: AdminMetrics) {
  const production = metrics.subscribers.filter(
    (row) => row.environment === "Production",
  );
  const count = (rows: AdminMetrics["subscribers"]) =>
    rows.reduce((sum, row) => sum + row.count, 0);
  return {
    paying: count(production.filter((row) => row.status !== "trialing")),
    trials: count(production.filter((row) => row.status === "trialing")),
    sandbox: count(
      metrics.subscribers.filter((row) => row.environment === "Sandbox"),
    ),
    payingByProvider: {
      stripe: count(
        production.filter(
          (row) => row.provider === "stripe" && row.status !== "trialing",
        ),
      ),
      app_store: count(
        production.filter(
          (row) => row.provider === "app_store" && row.status !== "trialing",
        ),
      ),
    },
    mrr: byCurrency(
      metrics.mrr.map((row) => ({ currency: row.currency, value: row.mrr_minor })),
    ),
    arr: byCurrency(
      metrics.mrr.map((row) => ({ currency: row.currency, value: row.arr_minor })),
    ),
    estimated: metrics.mrr.reduce(
      (sum, row) => sum + row.estimated_subscriptions,
      0,
    ),
    signups30d: metrics.signups.reduce((sum, day) => sum + day.count, 0),
    signupsPeak: Math.max(1, ...metrics.signups.map((day) => day.count)),
    activeGrants: metrics.grants.reduce((sum, row) => sum + row.count, 0),
    downloads30d: metrics.downloads.reduce((sum, row) => sum + row.last_30d, 0),
  };
}
