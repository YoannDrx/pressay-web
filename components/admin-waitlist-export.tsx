"use client";

import { useState } from "react";
import { STEP_UP_REQUIRED_EVENT } from "@/lib/step-up-event";
import type { WaitlistPlatform } from "@/lib/waitlist-input";

/** Downloads a platform's CSV; the Cloud requires the step-up and audits it. */
export function AdminWaitlistExport({
  platform,
  label,
}: {
  platform: WaitlistPlatform;
  label: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function download() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/waitlist/export?platform=${platform}`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        if (payload?.error?.code === "step_up_required") {
          window.dispatchEvent(new Event(STEP_UP_REQUIRED_EVENT));
          setMessage("Saisis ton code Authenticator dans le panneau ouvert, puis réessaie.");
        } else setMessage(`Export indisponible (${response.status}).`);
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `pressay-waitlist-${platform}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Export téléchargé et audité.");
    } catch {
      setMessage("Connexion indisponible. Réessaie.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <button className="button button-small" onClick={download} disabled={pending}>
        {pending ? "…" : label}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
