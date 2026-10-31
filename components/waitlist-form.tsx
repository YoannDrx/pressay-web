"use client";

import Link from "next/link";
import { useState } from "react";
import type { WaitlistPlatform } from "@/lib/waitlist-input";

const platformNames: Record<WaitlistPlatform, { fr: string; en: string }> = {
  ios: { fr: "iPhone", en: "iPhone" },
  windows: { fr: "Windows", en: "Windows" },
};

/**
 * Opt-in form for a platform waitlist (FR/EN). Consent is an unticked box the
 * visitor must tick; the confirmation is the same whether the address was
 * already listed or not.
 */
export function WaitlistForm({
  platform,
  locale,
  source = "site",
}: {
  platform: WaitlistPlatform;
  locale: "fr" | "en";
  source?: string;
}) {
  const fr = locale === "fr";
  const name = platformNames[platform][locale];
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          platform,
          locale,
          source,
          consent: form.get("consent") === "on",
        }),
      });
      if (response.status === 202) {
        setDone(true);
        setMessage(
          fr
            ? `C’est noté. Nous t’écrirons à la sortie de Pressay pour ${name}.`
            : `You’re on the list. We’ll write to you when Pressay for ${name} is out.`,
        );
        return;
      }
      setMessage(
        response.status === 422
          ? fr
            ? "Vérifie ton adresse e-mail et coche la case de consentement."
            : "Check your email address and tick the consent box."
          : response.status === 429
            ? fr
              ? "Trop de tentatives. Réessaie dans une minute."
              : "Too many attempts. Try again in a minute."
            : fr
              ? "Inscription indisponible pour le moment. Réessaie plus tard."
              : "Sign-up is unavailable right now. Please try again later.",
      );
    } catch {
      setMessage(
        fr
          ? "Connexion indisponible. Réessaie."
          : "Connection unavailable. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      className="waitlist-form"
      action={submit}
      aria-label={fr ? `Liste d’attente ${name}` : `${name} waitlist`}
    >
      <label>
        {fr ? "Adresse e-mail" : "Email address"}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          disabled={done}
        />
      </label>
      <label className="waitlist-consent">
        <input name="consent" type="checkbox" required disabled={done} />
        <span>
          {fr
            ? `J’accepte que Pressay m’écrive à cette adresse pour m’annoncer la sortie de Pressay pour ${name}, et rien d’autre. Je peux me désinscrire à tout moment. `
            : `I agree that Pressay may write to this address to announce Pressay for ${name}, and nothing else. I can unsubscribe at any time. `}
          <Link href={`/${locale}/privacy`}>
            {fr ? "Politique de confidentialité" : "Privacy policy"}
          </Link>
        </span>
      </label>
      <button className="button button-small" disabled={pending || done}>
        {pending ? "…" : fr ? "Prévenez-moi" : "Notify me"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
