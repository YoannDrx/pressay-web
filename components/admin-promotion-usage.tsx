"use client";
import { useState } from "react";

export function AdminPromotionUsage({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh() {
    setPending(true);
    try {
      const response = await fetch(`/api/pressay/admin/campaigns/${id}/usage`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(
          `Suivi indisponible${data.requestId ? ` · ${data.requestId}` : ""}`,
        );
        return;
      }
      setMessage(
        `${data.redemptions}/${data.maximum ?? "∞"} · ${data.active ? "active" : "inactive"} · ${new Date(data.checkedAt).toLocaleTimeString("fr-FR")}`,
      );
    } catch {
      setMessage("Suivi indisponible. Réessayer.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <button className="secondary-button" onClick={refresh} disabled={pending}>
        {pending ? "Chargement…" : "Actualiser Stripe"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
