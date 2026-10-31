"use client";

import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { SignInErrorView, SocialProvider } from "@/lib/sign-in-errors";

const AUTO_START_KEY = "pressay_auth_autostart";
// Long enough to cover the provider screen; prevents the browser Back button
// from bouncing the user straight back to Google or Apple.
const AUTO_START_COOLDOWN_MS = 10 * 60 * 1000;

function mayAutoStart(provider: SocialProvider): boolean {
  try {
    const previous = JSON.parse(
      window.sessionStorage.getItem(AUTO_START_KEY) ?? "null",
    ) as { provider?: string; at?: number } | null;
    if (
      previous?.provider === provider &&
      typeof previous.at === "number" &&
      Date.now() - previous.at < AUTO_START_COOLDOWN_MS
    )
      return false;
    window.sessionStorage.setItem(
      AUTO_START_KEY,
      JSON.stringify({ provider, at: Date.now() }),
    );
    return true;
  } catch {
    // Without storage we cannot guard against loops: highlight instead.
    return false;
  }
}

/**
 * Error page for a failed social sign-in: this page again, with every current
 * query parameter (redirect target, locale, provider hint and the signed
 * OAuth authorize query) so a retry continues the same flow. Better Auth
 * appends `error` and `error_description`.
 */
function errorCallbackURL(callbackURL: string, locale: "fr" | "en"): string {
  const params = new URLSearchParams(window.location.search);
  params.delete("error");
  params.delete("error_description");
  if (!params.has("redirect_url")) params.set("redirect_url", callbackURL);
  if (!params.has("locale")) params.set("locale", locale);
  return `/sign-in?${params.toString()}`;
}

export function BetterAuthSignIn({
  callbackURL,
  locale = "fr",
  appleEnabled,
  suggestedProvider = null,
  autoStart = false,
  error = null,
}: {
  callbackURL: string;
  locale?: "fr" | "en";
  appleEnabled: boolean;
  suggestedProvider?: SocialProvider | null;
  autoStart?: boolean;
  error?: SignInErrorView | null;
}) {
  const fr = locale === "fr";
  const [pending, setPending] = useState<SocialProvider | "passkey" | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const started = useRef(false);

  async function signInWithSocial(provider: SocialProvider) {
    setPending(provider);
    setMessage("");
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: errorCallbackURL(callbackURL, locale),
      });
      if (!result.error) return;
      setMessage(
        result.error.status === 429
          ? fr
            ? "Trop de tentatives. Patiente une minute avant de réessayer."
            : "Too many attempts. Wait a minute before trying again."
          : fr
            ? "La connexion n’a pas pu démarrer. Réessaie dans un instant."
            : "Sign-in could not start. Try again in a moment.",
      );
    } catch {
      setMessage(
        fr
          ? "Vérifie ta connexion internet puis réessaie."
          : "Check your internet connection and try again.",
      );
    }
    setPending(null);
  }

  useEffect(() => {
    if (!autoStart || !suggestedProvider || started.current) return;
    started.current = true;
    if (mayAutoStart(suggestedProvider)) {
      const provider = suggestedProvider;
      // Deferred so the page paints its buttons first. Not cancelled on
      // cleanup: the ref already guards against a second start.
      window.setTimeout(() => void signInWithSocial(provider), 0);
    }
    // Run once for the server-provided hint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithPasskey() {
    setPending("passkey");
    setMessage("");
    const result = await authClient.signIn.passkey({
      fetchOptions: { throw: false },
    });
    if (result.error) {
      setMessage(
        fr
          ? "Aucune clé d’accès valide n’a été présentée."
          : "No valid passkey was provided.",
      );
      setPending(null);
      return;
    }
    window.location.assign(callbackURL);
  }

  // Apple and Google are equal options; a hint from the app only moves the
  // chosen one first and highlights it.
  const available: SocialProvider[] = appleEnabled
    ? ["apple", "google"]
    : ["google"];
  const providers =
    suggestedProvider && available.includes(suggestedProvider)
      ? [
          suggestedProvider,
          ...available.filter((provider) => provider !== suggestedProvider),
        ]
      : available;
  const label = (provider: SocialProvider) =>
    pending === provider
      ? fr
        ? provider === "apple"
          ? "Redirection vers Apple…"
          : "Redirection vers Google…"
        : provider === "apple"
          ? "Redirecting to Apple…"
          : "Redirecting to Google…"
      : provider === "apple"
        ? fr
          ? "Continuer avec Apple"
          : "Continue with Apple"
        : fr
          ? "Continuer avec Google"
          : "Continue with Google";

  return (
    <div className="auth-placeholder auth-provider-card">
      <span className="mono-label">
        {fr ? "COMPTE PRESSAY" : "PRESSAY ACCOUNT"}
      </span>
      <h1>{fr ? "Connexion." : "Sign in."}</h1>
      <p>
        {fr
          ? "Apple ou Google crée ou retrouve ton compte. Aucun code d’accès n’est nécessaire."
          : "Sign in with Apple or Google. No invitation code is required."}
      </p>
      {error ? (
        <div className="auth-error" role="alert">
          <strong>{error.title}</strong>
          <p>{error.message}</p>
          <small>
            {fr ? "Code :" : "Code:"} {error.code}
          </small>
        </div>
      ) : null}
      <div className="auth-provider-actions">
        {providers.map((provider) => (
          <button
            key={provider}
            className={`button auth-provider-button${
              provider === suggestedProvider ? " button-primary" : ""
            }`}
            data-provider={provider}
            aria-describedby={
              provider === suggestedProvider ? "auth-suggested" : undefined
            }
            disabled={pending !== null}
            onClick={() => signInWithSocial(provider)}
          >
            {label(provider)}
          </button>
        ))}
        {suggestedProvider ? (
          <small id="auth-suggested" className="auth-suggested">
            {fr
              ? "Méthode choisie dans l’app Pressay. Les deux options restent disponibles."
              : "Method chosen in the Pressay app. Both options remain available."}
          </small>
        ) : null}
        <details className="auth-alternative">
          <summary>{fr ? "Autre méthode" : "Another method"}</summary>
          <p>
            {fr
              ? "Uniquement si tu as déjà configuré une passkey Pressay avec Touch ID sur cet appareil."
              : "Use this if you already set up a Pressay passkey on this device."}
          </p>
          <button
            className="button"
            disabled={pending !== null}
            onClick={signInWithPasskey}
          >
            {pending === "passkey"
              ? fr
                ? "Vérification…"
                : "Verifying…"
              : fr
                ? "Se connecter avec une passkey"
                : "Sign in with a passkey"}
          </button>
        </details>
      </div>
      {message ? (
        <output className="auth-message" role="alert">
          {message}
        </output>
      ) : null}
      <small>
        {fr
          ? "Session sécurisée, cookies strictement nécessaires uniquement."
          : "Secure session. Strictly necessary cookies only."}
      </small>
      {/* New tabs keep a pending desktop sign-in on this page. */}
      <p className="auth-legal">
        {fr ? (
          <>
            En continuant, tu acceptes les{" "}
            <a href="/fr/terms" target="_blank" rel="noopener">
              conditions générales d’utilisation et de vente
            </a>{" "}
            et tu reconnais avoir lu la{" "}
            <a href="/fr/privacy" target="_blank" rel="noopener">
              politique de confidentialité
            </a>
            .
          </>
        ) : (
          <>
            By continuing, you accept the{" "}
            <a href="/en/terms" target="_blank" rel="noopener">
              terms of use and sale
            </a>{" "}
            and acknowledge the{" "}
            <a href="/en/privacy" target="_blank" rel="noopener">
              privacy policy
            </a>
            .
          </>
        )}
      </p>
    </div>
  );
}
