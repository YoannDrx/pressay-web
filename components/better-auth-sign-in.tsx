"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function BetterAuthSignIn({ callbackURL }: { callbackURL: string }) {
  const [pending, setPending] = useState<"google" | "passkey" | null>(null);
  const [message, setMessage] = useState("");

  async function signInWithGoogle() {
    setPending("google");
    setMessage("");
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL: `/sign-in?error=oauth&redirect_url=${encodeURIComponent(callbackURL)}`
    });
    if (result.error) {
      setMessage("La connexion Google n’a pas abouti. Réessaie dans quelques instants.");
      setPending(null);
    }
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
      <p>Google crée ou retrouve ton compte. Une clé d’accès peut ensuite remplacer ce parcours sur cet appareil.</p>
      <div className="auth-provider-actions">
        <button className="button button-primary" disabled={pending !== null} onClick={signInWithGoogle}>
          {pending === "google" ? "Connexion…" : "Continuer avec Google"}
        </button>
        <button className="button" disabled={pending !== null} onClick={signInWithPasskey}>
          {pending === "passkey" ? "Vérification…" : "Utiliser une clé d’accès"}
        </button>
      </div>
      {message ? <output className="auth-message" role="alert">{message}</output> : null}
      <small>Session sécurisée, cookies strictement nécessaires uniquement.</small>
    </div>
  );
}
