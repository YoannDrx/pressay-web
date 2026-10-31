"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/content";
/**
 * `rememberLocale` stores the shown language as the visitor's preference.
 * The administration is French-only, so it shows the menu in French without
 * overwriting the language chosen for the public site and the account.
 */
export function SessionNavigation({
  locale,
  rememberLocale = true,
}: {
  locale: Locale;
  rememberLocale?: boolean;
}) {
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
    if (rememberLocale)
      document.cookie = `pressay_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    // Focus and visibility often fire together when switching tabs; each
    // refresh queries the session store, so collapse them to one per 10 s.
    let lastAttention = 0;
    const attention = () => {
      const now = Date.now();
      if (now - lastAttention < 10_000) return;
      lastAttention = now;
      void refresh();
    };
    const visible = () => {
      if (document.visibilityState === "visible") attention();
    };
    const channel = new BroadcastChannel("pressay-session");
    channel.onmessage = () => void refresh();
    void refresh();
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", attention);
    document.addEventListener("visibilitychange", visible);
    const generation = current;
    return () => {
      generation.current++;
      channel.close();
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", attention);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [locale, refresh, rememberLocale]);
  async function signOut() {
    try {
      const r = await authClient.signOut();
      if (r.error) throw new Error("sign_out_failed");
      const channel = new BroadcastChannel("pressay-session");
      channel.postMessage("signed-out");
      channel.close();
      // Full reload so no signed-in view survives in the router cache.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
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
