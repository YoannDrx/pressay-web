import type { AdminAlerts } from "./operations-contract";

export type AdminAlertItem = {
  key: string;
  label: string;
  count: number;
  href: string | null;
};

const plural = (count: number, one: string, many: string) =>
  `${count} ${count > 1 ? many : one}`;

/**
 * Banner lines for the overview: only situations that need someone, most
 * urgent first. An older API without `admin/alerts` still reports failed
 * webhooks through the overview.
 */
export function alertItems(
  alerts: Partial<AdminAlerts> | null,
  fallbackFailedWebhooks = 0,
): AdminAlertItem[] {
  const failed = alerts?.failed_webhooks ?? fallbackFailedWebhooks;
  const items: AdminAlertItem[] = [
    {
      key: "disputes",
      label: plural(alerts?.open_disputes ?? 0, "litige ouvert", "litiges ouverts"),
      count: alerts?.open_disputes ?? 0,
      href: "/admin/billing?tab=dispute&open=true",
    },
    {
      key: "webhooks",
      label: plural(failed, "webhook en échec", "webhooks en échec"),
      count: failed,
      href: "/admin/billing?tab=webhooks",
    },
    {
      key: "unpaid",
      label: plural(
        alerts?.unpaid_subscriptions ?? 0,
        "abonnement impayé",
        "abonnements impayés",
      ),
      count: alerts?.unpaid_subscriptions ?? 0,
      href: "/admin/billing?tab=invoice_failed",
    },
    {
      key: "duplicates",
      label: plural(
        alerts?.duplicate_subscriptions ?? 0,
        "compte avec deux abonnements actifs",
        "comptes avec deux abonnements actifs",
      ),
      count: alerts?.duplicate_subscriptions ?? 0,
      href: null,
    },
  ];
  return items.filter((item) => item.count > 0);
}

export const billingTabs = [
  { id: "refund", label: "Remboursements" },
  { id: "dispute", label: "Litiges" },
  { id: "invoice_failed", label: "Paiements en échec" },
  { id: "webhooks", label: "Webhooks en échec" },
  { id: "events", label: "Tous les événements" },
] as const;
export type BillingTab = (typeof billingTabs)[number]["id"];

/** Tab, open-dispute filter and cursor of the billing screen from its URL. */
export function billingView(query: Record<string, string | string[] | undefined>): {
  tab: BillingTab;
  open: boolean;
  cursor: string;
} {
  const one = (key: string) => {
    const value = query[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const requested = one("tab");
  const tab =
    billingTabs.find((candidate) => candidate.id === requested)?.id ?? "webhooks";
  const cursor = one("cursor");
  return {
    tab,
    open: tab === "dispute" && one("open") === "true",
    cursor: cursor.length <= 300 ? cursor : "",
  };
}

/** Cloud path for the selected tab. */
export function billingPath(view: ReturnType<typeof billingView>, cursor = view.cursor) {
  const params = new URLSearchParams();
  if (view.tab === "webhooks" || view.tab === "events") {
    if (view.tab === "webhooks") params.set("state", "failed");
    if (cursor) params.set("cursor", cursor);
    return `admin/billing/events?${params}`;
  }
  params.set("kind", view.tab);
  if (view.open) params.set("open", "true");
  if (cursor) params.set("cursor", cursor);
  return `admin/billing/financial-events?${params}`;
}

/** Screen URL for the same view on another page (empty cursor: first page). */
export function billingHref(view: ReturnType<typeof billingView>, cursor: string) {
  const params = new URLSearchParams({ tab: view.tab });
  if (view.open) params.set("open", "true");
  if (cursor) params.set("cursor", cursor);
  return `/admin/billing?${params}`;
}
