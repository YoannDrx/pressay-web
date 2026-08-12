"use client";

import { useState } from "react";

export function AdminStepUp() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function verify(formData: FormData) {
    setPending(true); setMessage("");
    const response = await fetch("/api/account/step-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: formData.get("code"), method: "totp" })
    });
    setPending(false);
    setMessage(response.ok ? "Validation forte active pendant 10 minutes." : "Code invalide ou compte temporairement verrouillé.");
  }

  return <form className="admin-step-up" action={verify}>
    <label>Validation forte<input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="123 456" required /></label>
    <button className="button button-small" disabled={pending}>{pending ? "…" : "Valider 10 min"}</button>
    {message ? <output role="status">{message}</output> : null}
  </form>;
}
