import assert from "node:assert/strict";
import test from "node:test";
import {
  exportRequest,
  metricPeriod,
  monthLabel,
  percent,
} from "../lib/admin-analytics.ts";
import { fill, missingTranslations } from "../lib/admin-i18n.ts";
import { metricsMessages } from "../lib/admin-messages/metrics.ts";

test("metrics messages exist in French and English", () => {
  assert.deepEqual(missingTranslations(metricsMessages), []);
  assert.deepEqual(
    missingTranslations({ fr: { a: "x", b: { c: "y" } }, en: { a: "x" } }),
    ["en:b.c"],
  );
  assert.equal(fill("{count} mois", { count: 12 }), "12 mois");
});

test("CSV export requests accept one known file and its own bounded parameter", () => {
  const ok = (file: string, query: string) =>
    exportRequest(file, new URLSearchParams(query));
  assert.deepEqual(ok("churn.csv", "months=12"), {
    dataset: "churn",
    query: "months=12",
  });
  assert.deepEqual(ok("downloads.csv", "days=090"), {
    dataset: "downloads",
    query: "days=90",
  });
  for (const [file, query] of [
    ["accounts.csv", "months=12"],
    ["churn.json", "months=12"],
    ["churn.csv", ""],
    ["churn.csv", "days=30"],
    ["churn.csv", "months=12&months=6"],
    ["churn.csv", "months=12&extra=1"],
    ["churn.csv", "months=25"],
    ["churn.csv", "months=0"],
    ["signups.csv", "days=367"],
    ["signups.csv", "days=-1"],
    ["signups.csv", "days=1e2"],
  ])
    assert.equal(ok(file!, query!), null, `${file}?${query}`);
});

test("metric periods only take the offered values", () => {
  assert.deepEqual(metricPeriod({}), { months: 12, days: 30 });
  assert.deepEqual(metricPeriod({ months: "24", days: "7" }), {
    months: 24,
    days: 7,
  });
  assert.deepEqual(metricPeriod({ months: "13", days: ["7", "30"] }), {
    months: 12,
    days: 30,
  });
});

test("rates and months are formatted per language", () => {
  assert.equal(percent(1, 8, "fr"), "12,5 %");
  assert.equal(percent(1, 8, "en"), "12.5%");
  assert.equal(percent(1, 0, "fr"), "—");
  assert.equal(monthLabel("2026-10", "en"), "Oct 2026");
  assert.match(monthLabel("2026-10", "fr"), /^oct\. 2026$/);
});
