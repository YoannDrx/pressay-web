// Presentation helpers for the advanced metrics screen and its CSV exports.
// No server-only import: covered by `pnpm test:unit`.
import type { AdminLocale } from "./admin-i18n.ts";
import type { MetricExportDataset } from "./operations-contract.ts";

export const metricExportDatasets: readonly MetricExportDataset[] = [
  "churn",
  "cohorts",
  "trials",
  "downloads",
  "signups",
];
export const metricMonthOptions = [6, 12, 24] as const;
export const metricDayOptions = [7, 30, 90] as const;

/** Monthly datasets take `months`, daily ones `days`. */
export function exportRange(
  dataset: MetricExportDataset,
): "months" | "days" {
  return dataset === "downloads" || dataset === "signups" ? "days" : "months";
}

/** Strict reading of `?months=` / `?days=`: only the offered values. */
export function metricPeriod(
  query: Record<string, string | string[] | undefined>,
): { months: number; days: number } {
  const pick = (value: unknown, options: readonly number[], fallback: number) =>
    options.find((option) => String(option) === value) ?? fallback;
  return {
    months: pick(query.months, metricMonthOptions, 12),
    days: pick(query.days, metricDayOptions, 30),
  };
}

/**
 * Validates an export request before it reaches the Cloud: a known file name
 * and exactly the parameter of its dataset, within the Cloud's bounds.
 */
export function exportRequest(
  file: string,
  search: URLSearchParams,
): { dataset: MetricExportDataset; query: string } | null {
  const dataset = metricExportDatasets.find(
    (candidate) => `${candidate}.csv` === file,
  );
  if (!dataset) return null;
  const range = exportRange(dataset);
  const keys = [...search.keys()];
  if (keys.length !== 1 || keys[0] !== range) return null;
  const raw = search.get(range) ?? "";
  if (!/^\d{1,3}$/.test(raw)) return null;
  const value = Number(raw);
  const max = range === "months" ? 24 : 366;
  if (value < 1 || value > max) return null;
  return { dataset, query: `${range}=${value}` };
}

/** "12,5 %" (fr) / "12.5%" (en); "—" when the base is zero. */
export function percent(
  part: number,
  whole: number,
  locale: AdminLocale,
): string {
  if (whole <= 0) return "—";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(part / whole);
}

/** "2026-10" as "oct. 2026" / "Oct 2026". */
export function monthLabel(month: string, locale: AdminLocale): string {
  const [year, index] = month.split("-").map(Number);
  if (!year || !index) return month;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, index - 1, 1)));
}
