export function safeLocalRedirect(
  value: string | undefined,
  fallback = "/account",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://press-say.app");
    if (
      url.origin !== "https://press-say.app" ||
      /^\/sign-(in|up)(\/|$)/.test(url.pathname)
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
