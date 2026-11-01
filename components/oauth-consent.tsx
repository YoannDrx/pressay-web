"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function OAuthConsent({
  scopes,
  locale = "fr",
}: {
  scopes: string[];
  locale?: "fr" | "en";
}) {
  const fr = locale === "fr";
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function decide(accept: boolean) {
    setPending(true);
    setMessage("");
    const result = await authClient.oauth2
      .consent({ accept, scope: accept ? scopes.join(" ") : undefined })
      .catch(() => null);
    if (!result || result.error) {
      setPending(false);
      const status = result?.error?.status;
      setMessage(
        !result
          ? fr
            ? "Connexion interrompue. Vérifie ta connexion puis réessaie."
            : "Connection lost. Check your connection and try again."
          : status === 401
            ? fr
              ? "Ta session a expiré. Relance la connexion depuis l’app Pressay."
              : "Your session expired. Start signing in again from the Pressay app."
            : fr
              ? "Cette autorisation a expiré ou n’est plus valide. Relance la connexion depuis l’app Pressay."
              : "This authorization expired or is no longer valid. Start signing in again from the Pressay app.",
      );
      return;
    }
    window.location.assign(result.data.url);
  }

  return (
    <div className="auth-placeholder auth-provider-card">
      <span className="mono-label">OAUTH 2.1 / PKCE</span>
      <h1>{fr ? "Autoriser Pressay." : "Authorize Pressay."}</h1>
      <p>
        {fr
          ? "L’application Pressay demande uniquement ton identité et une session renouvelable. Elle n’accède jamais à tes dictées, fichiers ou clés BYOK."
          : "The Pressay app only asks for your identity and a renewable session. It never accesses your dictation, files or BYOK keys."}
      </p>
      <ul className="oauth-scope-list">
        {scopes.map((scope) => (
          <li key={scope}>{scopeLabel(scope, fr)}</li>
        ))}
      </ul>
      <div className="auth-provider-actions">
        <button
          className="button button-primary"
          disabled={pending}
          onClick={() => decide(true)}
        >
          {fr ? "Autoriser" : "Authorize"}
        </button>
        <button className="button" disabled={pending} onClick={() => decide(false)}>
          {fr ? "Refuser" : "Deny"}
        </button>
      </div>
      {message ? (
        <output className="auth-message" role="alert">
          {message}
        </output>
      ) : null}
    </div>
  );
}

function scopeLabel(scope: string, fr: boolean): string {
  if (scope === "openid")
    return fr ? "Confirmer ton identité Pressay" : "Confirm your Pressay identity";
  if (scope === "profile")
    return fr ? "Lire ton nom d’affichage" : "Read your display name";
  if (scope === "email")
    return fr ? "Lire ton adresse e-mail vérifiée" : "Read your verified email address";
  if (scope === "offline_access")
    return fr
      ? "Garder la session active sans te redemander de te connecter"
      : "Keep the session active without asking you to sign in again";
  return scope;
}
