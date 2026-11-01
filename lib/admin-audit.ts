import type { AdminAuditDetails } from "./operations-contract";

const detailLabels: Record<string, string> = {
  days: "jours",
  endsAt: "fin",
  grantId: "accès",
  platform: "plateforme",
  changed: "modifié",
  replayed: "rejoué",
  previousStatus: "statut précédent",
  appleAcknowledged: "abonnement Apple confirmé",
  webSessions: "sessions web",
  oauthRefreshTokens: "autorisations d’apps",
  oauthAccessTokens: "jetons d’accès",
  errorCode: "erreur",
};

function detailValue(key: string, value: string | number | boolean | null) {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (key === "endsAt" && typeof value === "string" && !isNaN(Date.parse(value)))
    return new Intl.DateTimeFormat("fr", { dateStyle: "medium" }).format(
      new Date(value),
    );
  if (key === "platform")
    return (
      ({ macos: "Mac", windows: "Windows", ios: "iPhone" } as Record<string, string>)[
        String(value)
      ] ?? String(value)
    );
  return String(value);
}

/** Structured audit details as one readable line ("jours 30 · fin …"). */
export function auditDetails(details?: AdminAuditDetails | null): string {
  if (!details) return "—";
  const parts = Object.entries(details)
    .filter(([key]) => key !== "replayed" || details.replayed === true)
    .map(([key, value]) => `${detailLabels[key] ?? key} ${detailValue(key, value)}`);
  return parts.length ? parts.join(" · ") : "—";
}

export type AuditFilters = {
  action: string;
  target: string;
  from: string;
  to: string;
  reads: "include" | "exclude";
  cursor: string;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Filters of the audit screen from its URL. Values the API would refuse are
 * dropped here so a mistyped filter shows the unfiltered ledger instead of an
 * error. Personal-data reads are hidden unless asked for.
 */
export function auditFilters(
  query: Record<string, string | string[] | undefined>,
): AuditFilters {
  const one = (key: string) => {
    const value = query[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const action = one("action").toLowerCase();
  const from = one("from");
  const to = one("to");
  const cursor = one("cursor");
  return {
    action: /^[a-z0-9_.]{0,80}$/.test(action) ? action : "",
    target: one("target").slice(0, 120),
    from: DAY.test(from) ? from : "",
    to: DAY.test(to) ? to : "",
    reads: one("reads") === "include" ? "include" : "exclude",
    cursor: /^\d{1,19}$/.test(cursor) ? cursor : "",
  };
}

/** Query string for `GET /v1/admin/audit-log`, empty filters omitted. */
export function auditSearchParams(
  filters: AuditFilters,
  cursor = filters.cursor,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ["action", "target", "from", "to"] as const)
    if (filters[key]) params.set(key, filters[key]);
  params.set("reads", filters.reads);
  if (cursor) params.set("cursor", cursor);
  return params;
}
