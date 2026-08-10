"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminCampaignRevoke({ campaignID, publicID }: { campaignID: string; publicID: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function revoke(formData: FormData) {
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason || !window.confirm(`Révoquer la campagne ${publicID} ? Les droits déjà consommés ne seront pas retirés.`)) return;

    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/pressay/admin/campaigns/${campaignID}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setMessage(result?.error ?? `Erreur ${response.status}`);
        return;
      }
      setMessage("Campagne révoquée et auditée.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return <form className="admin-inline-action" action={revoke}>
    <label>
      <span className="sr-only">Motif de révocation pour {publicID}</span>
      <input name="reason" required minLength={3} placeholder="Motif obligatoire" autoComplete="off" />
    </label>
    <button className="admin-revoke-button" type="submit" disabled={pending}>{pending ? "…" : "Révoquer"}</button>
    {message ? <output>{message}</output> : null}
  </form>;
}
