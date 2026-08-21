"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function BetterAuthSignIn({
  callbackURL,
  appleEnabled
}: {
  callbackURL: string;
  appleEnabled: boolean;
}) {
  const [pending, setPending] = useState<"google" | "apple" | "passkey" | null>(null);
  const [message, setMessage] = useState("");

  async function signInWithSocial(provider: "google" | "apple") {
    setPending(provider);
    setMessage("");
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: `/sign-in?error=oauth&redirect_url=${encodeURIComponent(callbackURL)}`
      });
      if (!result.error) return;
      setMessage(`La connexion ${provider === "apple" ? "Apple" : "Google"} n’a pas abouti. Réessaie dans quelques instants.`);
    } catch {
      setMessage(`Impossible d’ouvrir ${provider === "apple" ? "Apple" : "Google"}. Vérifie ta connexion puis réessaie.`);
    }
    setPending(null);
  }

  async function signInWithPasskey() {
    setPending("passkey");
    setMessage("");
    const result = await authClient.signIn.passkey({
      fetchOptions: { throw: false }
    });
    if (result.error) {
      setMessage("Aucune clé d’accès valide n’a été présentée.");
      setPending(null);
      return;
    }
    window.location.assign(callbackURL);
  }

  return (
    <div className="auth-placeholder auth-provider-card">
      <span className="mono-label">COMPTE PRESSAY</span>
      <h1>Connexion.</h1>
      <p>Google ou Apple crée ou retrouve ton compte. Aucun code d’accès n’est nécessaire.</p>
      <div className="auth-provider-actions">
        <button className="button button-primary" disabled={pending !== null} onClick={() => signInWithSocial("google")}>
          {pending === "google" ? "Connexion…" : "Continuer avec Google"}
        </button>
        {appleEnabled ? (
          <button className="button auth-apple-button" disabled={pending !== null} onClick={() => signInWithSocial("apple")}>
            {pending === "apple" ? "Connexion…" : "Continuer avec Apple"}
          </button>
        ) : null}
        <details className="auth-alternative">
          <summary>Autre méthode</summary>
          <p>Uniquement si tu as déjà configuré une passkey Pressay avec Touch ID sur cet appareil.</p>
          <button className="button" disabled={pending !== null} onClick={signInWithPasskey}>
            {pending === "passkey" ? "Vérification…" : "Se connecter avec une passkey"}
          </button>
        </details>
      </div>
      {message ? <output className="auth-message" role="alert">{message}</output> : null}
      <small>Session sécurisée, cookies strictement nécessaires uniquement.</small>
    </div>
  );
}
