/**
 * Per-request Content Security Policy.
 *
 * Scripts: only nonce-bearing scripts (Next.js bootstrap and bundles) and the
 * scripts they load ('strict-dynamic') may run. No inline handler or injected
 * markup can execute, which is the XSS protection a CSP exists for.
 *
 * Styles keep 'unsafe-inline' on purpose: React `style` attributes (route
 * console, QR code, progress bars) and Next.js style injection cannot carry a
 * nonce. Inline styles cannot execute code, so this does not weaken the
 * script policy.
 */
export function contentSecurityPolicy(
  nonce: string,
  { development = false }: { development?: boolean } = {},
): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.press-say.app https://api-staging.press-say.app",
    "frame-src 'self' https://checkout.stripe.com",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
