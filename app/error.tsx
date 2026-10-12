"use client";

import { useEffect, useSyncExternalStore } from "react";

const noSubscription = () => () => undefined;

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(
    noSubscription,
    () => (document.documentElement.lang === "en" ? "en" : "fr"),
    () => "fr" as const,
  );
  useEffect(() => {
    // The digest correlates with server logs without exposing details.
    console.error("[page] render_failed", error.digest ?? "");
  }, [error]);
  const fr = locale === "fr";
  return (
    <main className="auth-page">
      <div className="auth-placeholder" role="alert">
        <span className="mono-label">PRESSAY</span>
        <h1>
          {fr ? "Page momentanément indisponible." : "Page temporarily unavailable."}
        </h1>
        <p>
          {fr
            ? "Un service a mis trop de temps à répondre. Réessaie dans quelques secondes. La dictée locale de l’app n’est pas concernée."
            : "A service took too long to respond. Try again in a few seconds. Local dictation in the app is not affected."}
        </p>
        {error.digest ? (
          <small>
            {fr ? "Référence support" : "Support reference"} : {error.digest}
          </small>
        ) : null}
        <div className="auth-provider-actions">
          <button className="button button-primary" onClick={() => reset()}>
            {fr ? "Réessayer" : "Try again"}
          </button>
          <a className="button" href={`/${locale}`}>
            {fr ? "Retour au site" : "Back to website"}
          </a>
        </div>
      </div>
    </main>
  );
}
