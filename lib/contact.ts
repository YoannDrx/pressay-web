/**
 * Single public contact address for support, legal, privacy (GDPR) and
 * withdrawal requests. Set NEXT_PUBLIC_SUPPORT_EMAIL (for example a
 * press-say.app address) to switch every page at once; the fallback keeps
 * the inbox currently verified for support.
 */
const fallbackSupportEmail = "yoann.andrieux@gmail.com";

function validEmail(value: string | undefined): string | null {
  const email = value?.trim();
  return email && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)
    ? email
    : null;
}

export const supportEmail =
  validEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) ?? fallbackSupportEmail;

export function supportMailto(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${supportEmail}${query ? `?${query}` : ""}`;
}
