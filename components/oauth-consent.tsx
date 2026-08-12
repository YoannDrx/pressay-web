"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function OAuthConsent({ scopes }: { scopes: string[] }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function decide(accept: boolean) {
    setPending(true); setMessage("");
    const result = await authClient.oauth2.consent({
      accept,
      scope: accept ? scopes.join(" ") : undefined
    });
    if (result.error) {
      setPending(false);
      setMessage("Cette autorisation a expiré. Relance la connexion depuis Pressay.");
      return;
    }
    window.location.assign(result.data.url);
  }

  return <div className="auth-placeholder auth-provider-card">
    <span className="mono-label">OAUTH 2.1 / PKCE</span>
    <h1>Autoriser Pressay.</h1>
    <p>L’application macOS demande uniquement ton identité et une session renouvelable. Elle n’accède jamais à tes dictées, fichiers ou clés BYOK.</p>
    <ul className="oauth-scope-list">{scopes.map((scope) => <li key={scope}>{scopeLabel(scope)}</li>)}</ul>
    <div className="auth-provider-actions"><button className="button button-primary" disabled={pending} onClick={() => decide(true)}>Autoriser</button><button className="button" disabled={pending} onClick={() => decide(false)}>Refuser</button></div>
    {message ? <output className="auth-message" role="alert">{message}</output> : null}
  </div>;
}

function scopeLabel(scope: string): string {
  if (scope === "openid") return "Confirmer ton identité Pressay";
  if (scope === "profile") return "Lire ton nom d’affichage";
  if (scope === "email") return "Lire ton adresse e-mail vérifiée";
  if (scope === "offline_access") return "Renouveler la session sans redemander ton mot de passe";
  return scope;
}
