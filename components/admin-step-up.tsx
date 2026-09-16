"use client";

import Link from "next/link";
import { useState } from "react";

export function AdminStepUp() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function verify(formData: FormData) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/step-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.get("code"),
          method: formData.get("method"),
        }),
      });
      setMessage(
        response.ok
          ? "Validation forte active pendant 10 minutes."
          : "Code invalide ou compte temporairement verrouillé.",
      );
    } catch {
      setMessage("Connexion indisponible. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-step-up" action={verify}>
      <Link href="/account/security">Configurer la sécurité</Link>
      <label>
        Méthode
        <select name="method">
          <option value="totp">Application Authenticator</option>
          <option value="backup_code">Code de secours</option>
        </select>
      </label>
      <label>
        Validation forte
        <input
          name="code"
          autoComplete="one-time-code"
          placeholder="123 456"
          required
        />
      </label>
      <button className="button button-small" disabled={pending}>
        {pending ? "…" : "Valider 10 min"}
      </button>
      {message ? <output role="status">{message}</output> : null}
    </form>
  );
}
