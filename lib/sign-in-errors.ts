export type SignInLocale = "fr" | "en";
export type SocialProvider = "google" | "apple";

export type SignInErrorKind =
  | "cancelled"
  | "expired"
  | "account_link"
  | "email"
  | "provider"
  | "unknown";

export type SignInErrorView = {
  kind: SignInErrorKind;
  /** Sanitized machine code, safe to display as a support reference. */
  code: string;
  title: string;
  message: string;
};

const cancelled = new Set([
  "access_denied",
  "user_cancelled_authorize",
  "user_cancelled_login",
  "consent_required",
  "interaction_required",
]);
const expired = new Set([
  "state_mismatch",
  "state_not_found",
  "state_security_mismatch",
  "please_restart_the_process",
  "invalid_callback_request",
  "no_code",
  "invalid_state",
]);
const accountLink = new Set([
  "account_not_linked",
  "unable_to_link_account",
  "email_does_not_match",
  "email_doesn't_match",
  "account_already_linked_to_different_user",
  "user_already_exists",
]);
const email = new Set(["email_not_found", "email_not_verified"]);
const provider = new Set([
  "invalid_code",
  "unable_to_get_user_info",
  "oauth_provider_not_found",
  "issuer_missing",
  "issuer_mismatch",
  "nonce_binding_missing",
  "internal_server_error",
  "invalid_request",
  "invalid_client",
  "unauthorized_client",
  "server_error",
  "temporarily_unavailable",
  "redirect_uri_mismatch",
]);

/** Keep only a short machine-readable code; never echo arbitrary URL text. */
export function sanitizeSignInErrorCode(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[value.length - 1] : value;
  if (typeof raw !== "string") return null;
  const code = raw.trim().toLowerCase();
  return /^[a-z0-9_'.-]{1,64}$/.test(code) ? code : "unknown";
}

export function parseSocialProvider(value: unknown): SocialProvider | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "google" || raw === "apple" ? raw : null;
}

/**
 * The desktop app appends `provider=google|apple` to the OAuth authorize URL.
 * Better Auth forwards the authorize query to the sign-in page, and older
 * links may nest the authorize URL inside `redirect_url`. Accept both.
 */
export function providerHint(
  provider: unknown,
  redirectURL: unknown,
): SocialProvider | null {
  const direct = parseSocialProvider(provider);
  if (direct) return direct;
  const nested = Array.isArray(redirectURL) ? redirectURL[0] : redirectURL;
  if (typeof nested !== "string" || !nested.startsWith("/")) return null;
  try {
    return parseSocialProvider(
      new URL(nested, "https://press-say.app").searchParams.get("provider"),
    );
  } catch {
    return null;
  }
}

/**
 * Map Better Auth and identity-provider OAuth error codes to an actionable
 * message. `error_description` is only used to classify, never displayed,
 * so a crafted link cannot place arbitrary text on the sign-in page.
 */
export function signInErrorView(
  error: unknown,
  description: unknown,
  locale: SignInLocale,
): SignInErrorView | null {
  const code = sanitizeSignInErrorCode(error);
  if (!code) return null;
  const detail = (
    Array.isArray(description) ? description.join(" ") : String(description ?? "")
  ).toLowerCase();
  const fr = locale === "fr";
  const kind: SignInErrorKind = cancelled.has(code)
    ? "cancelled"
    : expired.has(code)
      ? "expired"
      : accountLink.has(code)
        ? "account_link"
        : email.has(code)
          ? "email"
          : provider.has(code) || detail.includes("redirect_uri")
            ? "provider"
            : "unknown";
  const copy: Record<SignInErrorKind, [string, string, string, string]> = {
    cancelled: [
      "Connexion annulée.",
      "Aucun compte n’a été modifié. Choisis Apple ou Google pour réessayer.",
      "Sign-in cancelled.",
      "Nothing was changed. Choose Apple or Google to try again.",
    ],
    expired: [
      "La connexion a expiré.",
      "Elle a duré plus de 5 minutes ou a été ouverte dans un autre navigateur. Relance-la depuis cette page, dans le même navigateur.",
      "Sign-in expired.",
      "It took longer than 5 minutes or was opened in another browser. Start again from this page, in the same browser.",
    ],
    account_link: [
      "Ce compte n’a pas pu être associé.",
      "Ton adresse est déjà liée à un autre moyen de connexion. Utilise Apple ou Google, celui choisi lors de la création de ton compte Pressay.",
      "This account could not be linked.",
      "Your email is already linked to another sign-in method. Use Apple or Google, whichever you chose when creating your Pressay account.",
    ],
    email: [
      "Adresse e-mail manquante ou non vérifiée.",
      "Pressay a besoin d’une adresse vérifiée par Apple ou Google. Avec Apple, tu peux partager ou masquer ton adresse : les deux fonctionnent.",
      "Missing or unverified email address.",
      "Pressay needs an email verified by Apple or Google. With Apple, both sharing and hiding your email work.",
    ],
    provider: [
      "Le fournisseur n’a pas confirmé la connexion.",
      "Réessaie dans un instant. Si le problème persiste, écris au support en indiquant le code ci-dessous.",
      "The provider did not confirm the sign-in.",
      "Try again in a moment. If it keeps failing, contact support with the code below.",
    ],
    unknown: [
      "La connexion n’a pas abouti.",
      "Réessaie. Si le problème persiste, écris au support en indiquant le code ci-dessous.",
      "Sign-in did not complete.",
      "Please try again. If it keeps failing, contact support with the code below.",
    ],
  };
  const [frTitle, frMessage, enTitle, enMessage] = copy[kind];
  return {
    kind,
    code,
    title: fr ? frTitle : enTitle,
    message: fr ? frMessage : enMessage,
  };
}
