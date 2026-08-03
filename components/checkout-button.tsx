"use client";

import { useState } from "react";

export function CheckoutButton({
  plan,
  interval,
  children
}: {
  plan: "pro_byok" | "lifetime_byok";
  interval: "annual" | "lifetime";
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setPending(true);
    setError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval })
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
    <button className="button button-primary full" onClick={checkout} disabled={pending}>
      {pending ? "…" : children}
    </button>
    {error ? <small className="form-error" role="alert">{error}</small> : null}
  </>;
}
