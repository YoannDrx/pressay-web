"use client";

import { useState } from "react";

export function PortalButton({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setPending(true);
    setError("");
    const response = await fetch("/api/portal", { method: "POST" });
    const payload = await response.json().catch(() => null) as { url?: string } | null;
    if (response.ok && payload?.url) {
      window.location.assign(payload.url);
      return;
    }
    setError("Le portail de facturation est momentanément indisponible.");
    setPending(false);
  }

  return <span>
    <button className="button button-primary" disabled={pending} onClick={openPortal}>
      {pending ? "Ouverture…" : children}
    </button>
    {error ? <small className="form-error" role="alert">{error}</small> : null}
  </span>;
}
