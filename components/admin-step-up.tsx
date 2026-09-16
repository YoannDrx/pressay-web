"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminStepUp({
  initialExpiresAt = 0,
}: {
  initialExpiresAt?: number;
}) {
  const router = useRouter();
  const [verifiedUntil, setVerifiedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const expiresAt = Math.max(initialExpiresAt, verifiedUntil);
  const active = expiresAt > now;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
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
      if (response.ok) {
        setNow(Date.now());
        setVerifiedUntil(Date.now() + 10 * 60 * 1000);
        router.refresh();
      }
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
    <div className="admin-security">
      <p
        className={`security-state ${active ? "security-state--active" : ""}`}
        role="status"
      >
        {active
          ? `✓ Actions sensibles autorisées · ${Math.ceil((expiresAt - now) / 60000)} min restantes`
          : "Actions sensibles verrouillées · code requis"}
      </p>
      <details>
        <summary>
          {active
            ? "Renouveler la validation"
            : "Valider les actions sensibles"}
        </summary>
        <p>
          Authenticator reste configuré. Cette validation autorise uniquement
          les actions administratives pendant 10 minutes.
        </p>
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
      </details>
    </div>
  );
}
