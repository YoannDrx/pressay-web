export type CheckoutLocale = "fr" | "en";

/** Turn a checkout API failure into a sentence; never show raw codes. */
export function checkoutErrorMessage(
  status: number,
  payload: unknown,
  locale: CheckoutLocale,
): string {
  const fr = locale === "fr";
  const error =
    payload && typeof payload === "object"
      ? (payload as { error?: unknown }).error
      : undefined;
  const code =
    typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? String((error as { code?: unknown }).code ?? "")
        : "";
  if (code === "commercial_launch_not_enabled")
    return fr
      ? "Les abonnements Pro ne sont pas encore ouverts. Free reste disponible."
      : "Pro subscriptions are not open yet. Free remains available.";
  if (code === "invalid_checkout_request" || status === 422)
    return fr
      ? "Coche les deux cases puis réessaie. Si cela persiste, recharge la page : les conditions ont peut-être été mises à jour."
      : "Tick both boxes and try again. If it persists, reload the page: the terms may have been updated.";
  if (code === "invalid_origin" || status === 403)
    return fr
      ? "Recharge la page puis réessaie."
      : "Reload the page and try again.";
  if (status === 409)
    return fr
      ? "Un abonnement est déjà actif sur ce compte. Gère-le depuis ton espace compte."
      : "A subscription is already active on this account. Manage it from your account.";
  if (status === 429)
    return fr
      ? "Trop de tentatives. Patiente une minute avant de réessayer."
      : "Too many attempts. Wait a minute before retrying.";
  return fr
    ? "Paiement temporairement indisponible. Aucun montant n’a été débité. Réessaie dans quelques minutes."
    : "Checkout is temporarily unavailable. You have not been charged. Try again in a few minutes.";
}
