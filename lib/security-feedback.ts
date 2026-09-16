export type SecurityFeedback = {
  text: string;
  tone: "success" | "error" | "info";
  reauthenticate?: boolean;
};

export function securityFailure(
  error: unknown,
  locale: "fr" | "en",
): SecurityFeedback {
  const fr = locale === "fr";
  const value =
    error && typeof error === "object"
      ? (error as { code?: string; name?: string; status?: number })
      : {};
  const code = value.code ?? value.name;
  if (
    code === "SESSION_NOT_FRESH" ||
    code === "SESSION_REQUIRED" ||
    code === "UNAUTHORIZED" ||
    value.status === 401
  )
    return {
      tone: "error",
      reauthenticate: true,
      text: fr
        ? "Pour protéger ton compte, cette action exige une connexion récente. Reconnecte-toi, puis réessaie."
        : "To protect your account, this action requires a recent sign-in. Sign in again, then retry.",
    };
  if (
    [
      "NotAllowedError",
      "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      "ERROR_CEREMONY_ABORTED",
      "REGISTRATION_CANCELLED",
    ].includes(code ?? "")
  )
    return {
      tone: "info",
      text: fr
        ? "La création a été annulée ou le navigateur n’a pas reçu de confirmation. Aucune clé ajoutée. Réessaie et confirme dans la fenêtre de ton navigateur."
        : "Registration was cancelled or the browser received no confirmation. No passkey was added. Retry and confirm in your browser’s prompt.",
    };
  if (
    [
      "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
      "PREVIOUSLY_REGISTERED",
      "InvalidStateError",
    ].includes(code ?? "")
  )
    return {
      tone: "info",
      text: fr
        ? "Cette clé d’accès est déjà enregistrée."
        : "This passkey is already registered.",
    };
  if (
    [
      "NotSupportedError",
      "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION",
      "ERROR_AUTHENTICATOR_MISSING_RESIDENT_KEY",
    ].includes(code ?? "")
  )
    return {
      tone: "error",
      text: fr
        ? "Ce moyen de sécurité ne permet pas de créer cette clé. Essaie un autre appareil ou une clé de sécurité compatible."
        : "This authenticator cannot create this passkey. Try another device or a compatible security key.",
    };
  if (
    code === "INVALID_TOTP" ||
    code === "INVALID_TWO_FACTOR_COOKIE" ||
    code === "INVALID_CODE"
  )
    return {
      tone: "error",
      text: fr
        ? "Code incorrect ou expiré. Vérifie l’heure de ton appareil et utilise un nouveau code."
        : "Invalid or expired code. Check your device clock and use a new code.",
    };
  if (value.status === 429)
    return {
      tone: "error",
      text: fr
        ? "Trop de tentatives. Patiente quelques minutes avant de réessayer."
        : "Too many attempts. Wait a few minutes before retrying.",
    };
  return {
    tone: "error",
    text: fr
      ? "L’action n’a pas pu être confirmée. Vérifie ta connexion et réessaie. Si le problème persiste, recharge cette page."
      : "The action could not be confirmed. Check your connection and retry. If the problem persists, reload this page.",
  };
}
