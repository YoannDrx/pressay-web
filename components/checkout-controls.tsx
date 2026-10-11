"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Checkout disclosures intentionally use full document links and do not prefetch legal routes. */

import { useState } from "react";
import { checkoutErrorMessage } from "@/lib/checkout-errors";

const TERMS_VERSION = "2026-08-10";

export function CheckoutControls({ locale }: { locale: "fr" | "en" }) {
  const fr = locale === "fr";
  const [terms, setTerms] = useState(false);
  const [immediate, setImmediate] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ready = terms && immediate && !pending;

  async function start(interval: "annual" | "monthly") {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro_byok",
          interval,
          acceptedTerms: true,
          immediatePerformanceConsent: true,
          termsVersion: TERMS_VERSION,
        }),
      });
      if (response.status === 401) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(
          "/sign-in?redirect_url=" +
            encodeURIComponent(window.location.pathname + window.location.search),
        );
        return;
      }
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.url) {
        window.location.assign(payload.url);
        return;
      }
      setError(checkoutErrorMessage(response.status, payload, locale));
    } catch {
      setError(checkoutErrorMessage(0, null, locale));
    }
    setPending(false);
  }

  return (
    <div className="price-actions checkout-surface" data-locale={locale}>
      <div className="checkout-consents">
        <label>
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
          />
          {fr ? (
            <>
              J’accepte les <a href="/fr/terms">conditions</a>.
            </>
          ) : (
            <>
              I accept the <a href="/en/terms">terms</a>.
            </>
          )}
        </label>
        <label>
          <input
            type="checkbox"
            checked={immediate}
            onChange={(event) => setImmediate(event.target.checked)}
          />
          {fr ? (
            <>
              Je demande l’exécution immédiate avant la fin du délai de
              rétractation, selon les{" "}
              <a href="/fr/withdrawal">modalités expliquées ici</a>.
            </>
          ) : (
            <>
              I request immediate performance before the withdrawal period
              ends, under the <a href="/en/withdrawal">terms explained here</a>.
            </>
          )}
        </label>
      </div>
      <button
        className="button button-primary full"
        type="button"
        disabled={!ready}
        onClick={() => start("annual")}
      >
        {fr ? "Choisir Pro annuel — 69 € TTC/an" : "Choose annual Pro — €69/year incl. VAT"}
      </button>
      <button
        className="button button-secondary full"
        type="button"
        disabled={!ready}
        onClick={() => start("monthly")}
      >
        {fr ? "Ou 7,99 € TTC/mois" : "Or €7.99/month incl. VAT"}
      </button>
      {error ? (
        <small className="form-error" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
