export const waitlistPlatforms = ["ios", "windows"] as const;
export type WaitlistPlatform = (typeof waitlistPlatforms)[number];

export type WaitlistInput = {
  email: string;
  platform: WaitlistPlatform;
  locale: "fr" | "en";
  source: string;
  consent: true;
};

/** Counters returned by the Cloud's GET /v1/admin/waitlist. */
export type AdminWaitlist = {
  platforms: {
    platform: WaitlistPlatform;
    subscribed: number;
    unsubscribed: number;
    french: number;
    english: number;
    last_7d: number;
    last_signup_at: string | null;
  }[];
  sources: { platform: WaitlistPlatform; source: string; count: number }[];
};

const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A sign-up as the form sends it. Consent must be the literal `true`: an
 * unticked box, a string or a missing field is refused. Unknown fields are
 * dropped rather than relayed.
 */
export function parseWaitlistInput(value: unknown): WaitlistInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL.test(email)) return null;
  if (!waitlistPlatforms.includes(body.platform as WaitlistPlatform)) return null;
  if (body.locale !== "fr" && body.locale !== "en") return null;
  if (body.consent !== true) return null;
  const source =
    typeof body.source === "string" && /^[a-z0-9_-]{1,40}$/.test(body.source)
      ? body.source
      : "site";
  return {
    email,
    platform: body.platform as WaitlistPlatform,
    locale: body.locale,
    source,
    consent: true,
  };
}

/** First address of X-Forwarded-For as set by the hosting proxy. */
export function visitorAddress(forwardedFor: string | null): string | null {
  const first = forwardedFor?.split(",")[0]?.trim();
  return first && first.length <= 64 ? first : null;
}
