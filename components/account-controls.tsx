"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AccountMutation({
  endpoint,
  method = "POST",
  label,
  confirm,
  locale = "fr",
}: {
  endpoint: string;
  method?: "POST" | "DELETE";
  label: string;
  confirm?: string;
  locale?: "fr" | "en";
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function act() {
    if (confirm && !window.confirm(confirm)) return;
    setPending(true);
    setError("");
    try {
      const r = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? "{}" : undefined,
      });
      const result = await r.json().catch(() => null);
      if (!r.ok) {
        setError(mutationError(r.status, locale));
        return;
      }
      if (result?.url) window.location.assign(result.url);
      // Full reload after the account itself changed.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      else if (endpoint.endsWith("/me")) window.location.assign(`/${locale}`);
      else router.refresh();
    } catch {
      setError(
        locale === "fr"
          ? "Action indisponible. Réessaie."
          : "Action unavailable. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <button className="button button-small" onClick={act} disabled={pending}>
        {pending ? "…" : label}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
function mutationError(status: number, locale: "fr" | "en"): string {
  const fr = locale === "fr";
  if (status === 401)
    return fr
      ? "Ta session a expiré. Recharge la page pour te reconnecter."
      : "Your session expired. Reload the page to sign in again.";
  if (status === 403)
    return fr
      ? "Cette action n’est pas autorisée pour ce compte."
      : "This action is not allowed for this account.";
  if (status === 404)
    return fr
      ? "Cet élément n’existe plus. Recharge la page."
      : "This item no longer exists. Reload the page.";
  if (status === 429)
    return fr
      ? "Trop de tentatives. Patiente une minute."
      : "Too many attempts. Wait a minute.";
  return fr
    ? "Service momentanément indisponible. Réessaie dans quelques minutes."
    : "Service temporarily unavailable. Try again in a few minutes.";
}

export function AccessCodeForm({
  locale,
  presetSecret = "",
}: {
  locale: "fr" | "en";
  presetSecret?: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const fr = locale === "fr";
  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    try {
      const r = await fetch("/api/pressay/access/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: form.get("secret") }),
      });
      const data = await r.json().catch(() => null);
      if (r.status === 401) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(
          "/sign-in?redirect_url=" + encodeURIComponent(location.pathname),
        );
        return;
      }
      setMessage(
        r.ok
          ? fr
            ? "Accès activé."
            : "Access activated."
          : data?.error?.code === "access_not_improved"
            ? fr
              ? "Ton accès actuel est déjà au moins aussi avantageux. Code non consommé."
              : "Your current access is already as good. Code not redeemed."
            : fr
              ? "Code indisponible, expiré ou réservé à une autre adresse."
              : "Code unavailable, expired or reserved for another email.",
      );
      if (r.ok) router.refresh();
    } catch {
      setMessage(
        fr
          ? "Connexion indisponible. Réessaie."
          : "Connection unavailable. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="account-claim" action={submit}>
      <label>
        {fr ? "Code d’accès" : "Access code"}
        <input
          name="secret"
          defaultValue={presetSecret}
          required
          minLength={16}
          maxLength={128}
          autoComplete="off"
        />
      </label>
      <button className="button" disabled={pending}>
        {pending ? "…" : fr ? "Activer" : "Activate"}
      </button>
      <output role="status">{message}</output>
    </form>
  );
}
export function ReferralLink({
  link,
  locale,
}: {
  link: string;
  locale: "fr" | "en";
}) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setMessage(locale === "fr" ? "Copié" : "Copied");
    } catch {
      setMessage(
        locale === "fr"
          ? "Sélectionne le lien pour le copier."
          : "Select the link to copy it.",
      );
    }
  }
  return (
    <>
      <p>
        <code>{link}</code>
      </p>
      <button className="button" onClick={copy}>
        {locale === "fr" ? "Copier mon lien" : "Copy my link"}
      </button>
      <p role="status">{message}</p>
    </>
  );
}
