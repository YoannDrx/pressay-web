"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/content";
export function SessionNavigation({ locale }: { locale: Locale }) {
  const [state, setState] = useState<{
    authenticated: boolean;
    admin: boolean;
    sessionKey?: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const current = useRef(0);
  const previousSession = useRef<string | null>(null);
  const refresh = useCallback(() => {
    const generation = ++current.current;
    return fetch("/api/account/navigation", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (generation === current.current) {
          const protectedPage = /^\/(account|admin)(\/|$)/.test(
            window.location.pathname,
          );
          if (protectedPage && !data.authenticated) {
            window.location.replace(
              `/sign-in?locale=${locale}&redirect_url=${encodeURIComponent(window.location.pathname)}`,
            );
            return;
          }
          if (
            protectedPage &&
            previousSession.current &&
            previousSession.current !== data.sessionKey
          ) {
            window.location.reload();
            return;
          }
          previousSession.current = data.sessionKey ?? null;
          setState(data);
          setFailed(false);
        }
      })
      .catch(() => {
        if (generation === current.current) setFailed(true);
      });
  }, [locale]);
  useEffect(() => {
    document.cookie = `pressay_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const channel = new BroadcastChannel("pressay-session");
    channel.onmessage = () => void refresh();
    void refresh();
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    const generation = current;
    return () => {
      generation.current++;
      channel.close();
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [locale, refresh]);
  async function signOut() {
    try {
      const r = await authClient.signOut();
      if (r.error) throw new Error("sign_out_failed");
      const channel = new BroadcastChannel("pressay-session");
      channel.postMessage("signed-out");
      channel.close();
      window.location.assign(`/${locale}`);
    } catch {
      setFailed(true);
    }
  }
  const fr = locale === "fr";
  if (!state)
    return (
      <Link className="text-link" href="/account" aria-busy={!failed}>
        {fr ? "Mon compte" : "My account"}
      </Link>
    );
  if (!state.authenticated)
    return (
      <Link className="text-link" href={`/sign-in?locale=${locale}`}>
        {fr ? "Connexion" : "Sign in"}
      </Link>
    );
  return (
    <details className="session-menu">
      <summary>{fr ? "Mon compte" : "My account"}</summary>
      <div>
        <Link href="/account">{fr ? "Vue d’ensemble" : "Overview"}</Link>
        {state.admin ? (
          <Link href="/admin">{fr ? "Administration" : "Admin"}</Link>
        ) : null}
        <button onClick={signOut}>{fr ? "Déconnexion" : "Sign out"}</button>
        {failed ? (
          <small role="status">
            {fr ? "Actualisation indisponible" : "Refresh unavailable"}
          </small>
        ) : null}
      </div>
    </details>
  );
}
