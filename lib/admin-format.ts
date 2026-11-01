// Pure presentation helpers for the administration and account screens.
// No server-only import: covered by `pnpm test:unit`.

const STRIPE_ID = /^(cus|sub|in|re|ch|pi|dp)_[A-Za-z0-9]+$/;

/** Link to the object in the Stripe Dashboard of the API's own Stripe mode. */
export function stripeDashboardURL(
  id: string | null | undefined,
  mode: "live" | "test" | undefined,
): string | null {
  if (!id || !mode || !STRIPE_ID.test(id)) return null;
  const kind = (
    {
      cus: "customers",
      sub: "subscriptions",
      in: "invoices",
      re: "refunds",
      ch: "payments",
      pi: "payments",
      dp: "disputes",
    } as const
  )[id.slice(0, id.indexOf("_")) as "cus"];
  return `https://dashboard.stripe.com/${mode === "test" ? "test/" : ""}${kind}/${id}`;
}

export function platformLabel(
  platform: string | undefined,
  variant?: string,
): string {
  if (platform === "ios") return "iPhone";
  if (platform === "windows") return "Windows";
  return variant === "mas" ? "Mac (App Store)" : "Mac";
}

/** "2 Mac · 1 Windows · 1 iPhone" from per-platform counts. */
export function deviceMix(
  macos: number | undefined,
  windows: number | undefined,
  fallbackTotal: number,
  ios?: number,
): string {
  if (macos === undefined && windows === undefined)
    return String(fallbackTotal);
  const parts = [];
  if (macos) parts.push(`${macos} Mac`);
  if (windows) parts.push(`${windows} Windows`);
  if (ios) parts.push(`${ios} iPhone`);
  return parts.join(" · ") || "0";
}

export function money(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("fr", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/**
 * Browser and system only ("Chrome · macOS"): enough to recognise a session
 * without copying a full fingerprint-like user agent into the admin screen.
 */
export function describeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "—";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : /Pressay/i.test(userAgent)
            ? "Pressay"
            : "Autre navigateur";
  const system = /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Android/.test(userAgent)
      ? "Android"
      : /Mac OS X|Macintosh/.test(userAgent)
        ? "macOS"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "système inconnu";
  return `${browser} · ${system}`;
}

/** Subscription states where the customer has a payment to fix. */
export function paymentNeedsAction(status: string | null | undefined): boolean {
  return status === "past_due" || status === "grace";
}
