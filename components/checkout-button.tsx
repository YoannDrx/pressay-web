"use client";

import { useState } from "react";
import Link from "next/link";

export function CheckoutButton({
  plan,
  interval,
  locale,
  variant = "primary",
  children
}: {
  plan: "pro_byok";
  interval: "monthly" | "annual";
  locale: "fr" | "en";
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [immediateConsent, setImmediateConsent] = useState(false);

  async function checkout() {
    setPending(true);
    setError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        interval,
        acceptedTerms,
        immediatePerformanceConsent: immediateConsent,
        termsVersion: "2026-08-10"
      })
    });
    if (response.status === 401) {
      window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`);
      return;
    }
    const payload = await response.json() as { url?: string; error?: string };
    if (response.ok && payload.url) {
      window.location.assign(payload.url);
      return;
    }
    setError(payload.error ?? "Checkout unavailable");
    setPending(false);
  }

  return <>
    <div className="checkout-consents">
      <label><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />{locale === "fr" ? <>J’accepte les <Link href="/fr/terms">conditions</Link>.</> : <>I accept the <Link href="/en/terms">terms</Link>.</>}</label>
      <label><input type="checkbox" checked={immediateConsent} onChange={(event) => setImmediateConsent(event.target.checked)} />{locale === "fr" ? <>Je demande l’exécution immédiate avant la fin du délai de rétractation, selon les <Link href="/fr/withdrawal">modalités expliquées ici</Link>.</> : <>I request immediate performance before the withdrawal period ends, under the <Link href="/en/withdrawal">terms explained here</Link>.</>}</label>
    </div>
    <button className={`button ${variant === "primary" ? "button-primary" : "button-secondary"} full`} onClick={checkout} disabled={pending || !acceptedTerms || !immediateConsent}>
      {pending ? "…" : children}
    </button>
    {error ? <small className="form-error" role="alert">{error}</small> : null}
  </>;
}
