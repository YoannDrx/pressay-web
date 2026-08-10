"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ReferralAttributor() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/referral/attribute", { method: "POST" }).then(async (response) => {
      const result = await response.json().catch(() => null) as { attributed?: boolean; attribution?: unknown } | null;
      if (response.ok && (result?.attributed === true || result?.attribution)) router.refresh();
    }).catch(() => undefined);
  }, [router]);
  return null;
}

export function ReferralCard({ link, signups, conversions }: { link: string; signups: number; conversions: number }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  async function share() {
    if (navigator.share) await navigator.share({ title: "Pressay", text: "30 jours de Pressay Pro après ton premier paiement — et 30 jours pour moi.", url: link });
    else await copy();
  }
  return <article className="account-card account-referral"><span className="mono-label">PARRAINAGE / 30 + 30</span><h2>Partage Pressay.</h2><p>Après le premier paiement confirmé de ton filleul, vous recevez chacun 30 jours.</p><code>{link}</code><div className="account-actions"><button className="button button-small" onClick={copy}>{copied ? "Copié" : "Copier"}</button><button className="button button-small" onClick={share}>Partager</button></div><dl><dt>Inscrits</dt><dd>{signups}</dd><dt>Convertis</dt><dd>{conversions}</dd></dl></article>;
}

export function AccessClaimForm({ delivery = "code", presetSecret = "" }: { delivery?: "code" | "link"; presetSecret?: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(formData: FormData) {
    setPending(true); setMessage("");
    const response = await fetch("/api/pressay/access/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret: formData.get("secret"), delivery }) });
    if (response.status === 401) {
      window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`);
      return;
    }
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setPending(false); setMessage(response.ok ? "Accès activé." : result?.error ?? "Code invalide.");
    if (response.ok) router.refresh();
  }
  return <form className="account-claim" action={submit}><label>Code ou lien d’accès<input name="secret" defaultValue={presetSecret} required minLength={6} /></label><button className="button button-primary" disabled={pending}>{pending ? "…" : "Activer"}</button>{message ? <output>{message}</output> : null}</form>;
}

export function DeviceRevokeButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false); const router = useRouter();
  async function revoke() { if (!window.confirm("Révoquer cet appareil ?")) return; setPending(true); await fetch(`/api/pressay/devices/${id}`, { method: "DELETE" }); setPending(false); router.refresh(); }
  return <button className="account-link-button" disabled={pending} onClick={revoke}>{pending ? "…" : "Révoquer"}</button>;
}

export function DeleteAccountButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function remove() {
    const confirmation = window.prompt(
      "Tape SUPPRIMER pour effacer définitivement le compte Pressay et annuler sa relation de facturation."
    );
    if (confirmation !== "SUPPRIMER") return;
    setPending(true);
    setMessage("");
    const response = await fetch("/api/pressay/me", { method: "DELETE" });
    if (response.ok) {
      window.location.assign("/fr?account=deleted");
      return;
    }
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setMessage(
      result?.error
        ?? "La suppression n’a pas abouti. Réessaie ou contacte le support."
    );
    setPending(false);
  }

  return <div className="account-delete">
    <button className="account-link-button danger" disabled={pending} onClick={remove}>
      {pending ? "Suppression…" : "Supprimer définitivement mon compte"}
    </button>
    {message ? <output role="alert">{message}</output> : null}
  </div>;
}
