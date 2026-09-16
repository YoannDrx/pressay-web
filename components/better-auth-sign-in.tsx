"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function BetterAuthSignIn({
  callbackURL,
  locale = "fr",
  appleEnabled,
}: {
  callbackURL: string;
  locale?: "fr" | "en";
  appleEnabled: boolean;
}) {
  const fr = locale === "fr";
  const [pending, setPending] = useState<"google" | "apple" | "passkey" | null>(
    null,
  );
  const [message, setMessage] = useState("");

  async function signInWithSocial(provider: "google" | "apple") {
    setPending(provider);
    setMessage("");
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: `/sign-in?error=oauth&redirect_url=${encodeURIComponent(callbackURL)}`,
      });
      if (!result.error) return;
      setMessage(
        fr
          ? "La connexion n’a pas abouti. Réessaie."
          : "Sign-in failed. Please try again.",
      );
    } catch {
      setMessage(
        fr
          ? "Vérifie ta connexion puis réessaie."
          : "Check your connection and try again.",
      );
    }
    setPending(null);
  }

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

  return (
    <div className="auth-placeholder auth-provider-card">
      <span className="mono-label">
        {fr ? "COMPTE PRESSAY" : "PRESSAY ACCOUNT"}
      </span>
      <h1>{fr ? "Connexion." : "Sign in."}</h1>
      <p>
        {fr
          ? "Google ou Apple crée ou retrouve ton compte. Aucun code d’accès n’est nécessaire."
          : "Sign in with Google or Apple. No invitation code is required."}
      </p>
      <div className="auth-provider-actions">
        <button
          className="button button-primary"
          disabled={pending !== null}
          onClick={() => signInWithSocial("google")}
        >
          {pending === "google"
            ? fr
              ? "Connexion…"
              : "Signing in…"
            : fr
              ? "Continuer avec Google"
              : "Continue with Google"}
        </button>
        {appleEnabled ? (
          <button
            className="button auth-apple-button"
            disabled={pending !== null}
            onClick={() => signInWithSocial("apple")}
          >
            {pending === "apple"
              ? fr
                ? "Connexion…"
                : "Signing in…"
              : fr
                ? "Continuer avec Apple"
                : "Continue with Apple"}
          </button>
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
    </div>
  );
}
