"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminReferralActions({ referralID, riskStatus, failedRewards }: {
  referralID: string;
  riskStatus: string;
  failedRewards: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function mutate(path: string, method: "POST" | "PATCH", body: Record<string, string>) {
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/pressay/admin/referrals/${referralID}/${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setPending(false);
    setMessage(response.ok ? "Action auditée." : friendlyError(result?.error, response.status));
    if (response.ok) router.refresh();
  }

  async function review(nextRisk: string) {
    const reason = window.prompt(`Motif pour classer ce parrainage « ${nextRisk} » ?`);
    if (!reason || reason.trim().length < 3) return;
    await mutate("risk", "PATCH", { riskStatus: nextRisk, reason: reason.trim() });
  }

  async function retry() {
    const reason = window.prompt("Motif de la relance de récompense ?");
    if (!reason || reason.trim().length < 3) return;
    await mutate("retry", "POST", { reason: reason.trim() });
  }

  return <div className="admin-referral-actions">
    <select aria-label="Statut de risque" disabled={pending} value={riskStatus} onChange={(event) => void review(event.target.value)}>
      <option value="clear">Risque : clair</option>
      <option value="review">À examiner</option>
      <option value="blocked">Bloqué</option>
    </select>
    {failedRewards > 0 ? <button className="account-link-button" disabled={pending} onClick={() => void retry()}>{pending ? "…" : "Relancer"}</button> : null}
    {message ? <small role="status">{message}</small> : null}
  </div>;
}

function friendlyError(error: string | undefined, status: number): string {
  if (error === "recent_mfa_required") return "Une authentification multifacteur récente est requise.";
  if (error === "feature_disabled") return "Le parrainage n’est pas encore activé.";
  return error ?? `Erreur ${status}`;
}
