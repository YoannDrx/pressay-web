// Translations of administration screens. Each screen keeps its catalogue in
// lib/admin-messages/<screen>.ts with the same keys in French and English.
// No server-only import: covered by `pnpm test:unit`.

export type AdminLocale = "fr" | "en";

/**
 * The administration is shown in French whatever language the visitor chose
 * for the public site (tests/account-auth.spec.ts). Catalogues still carry
 * English so the screens can follow the operator's language later.
 */
export const ADMIN_LOCALE: AdminLocale = "fr";

export function adminMessages<T>(
  catalogue: Record<AdminLocale, T>,
  locale: AdminLocale = ADMIN_LOCALE,
): T {
  return catalogue[locale];
}

/** Replaces `{name}` placeholders. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Keys present in one language and missing in the other (dotted paths). */
export function missingTranslations(
  catalogue: Record<AdminLocale, unknown>,
): string[] {
  const keys = (value: unknown, prefix = ""): string[] =>
    value && typeof value === "object"
      ? Object.entries(value).flatMap(([key, child]) =>
          keys(child, prefix ? `${prefix}.${key}` : key),
        )
      : [prefix];
  const fr = new Set(keys(catalogue.fr));
  const en = new Set(keys(catalogue.en));
  return [
    ...[...fr].filter((key) => !en.has(key)).map((key) => `en:${key}`),
    ...[...en].filter((key) => !fr.has(key)).map((key) => `fr:${key}`),
  ];
}
