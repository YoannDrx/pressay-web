/**
 * Equivalent page in another language: `/fr/pricing` -> `/en/pricing`.
 * Paths without a locale prefix fall back to the localized home page.
 */
export function localizedPath(currentPath: string, target: "fr" | "en"): string {
  const path = currentPath.split(/[?#]/)[0] ?? "";
  const match = path.match(/^\/(fr|en)(\/[^\\]*)?$/);
  if (!match) return `/${target}`;
  return `/${target}${match[2] ?? ""}`;
}
