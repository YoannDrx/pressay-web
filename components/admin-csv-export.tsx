"use client";

import { useState } from "react";
import { fill } from "@/lib/admin-i18n";
import { STEP_UP_REQUIRED_EVENT } from "@/lib/step-up-event";

/**
 * Downloads one CSV through a same-origin route. The Cloud requires the
 * step-up and audits the export; without it, the security panel opens.
 */
export function AdminCsvExport({
  href,
  label,
  messages,
}: {
  href: string;
  label: string;
  messages: { stepUp: string; done: string; failed: string; offline: string };
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function download() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(href, { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        if (payload?.error?.code === "step_up_required") {
          window.dispatchEvent(new Event(STEP_UP_REQUIRED_EVENT));
          setMessage(messages.stepUp);
        } else setMessage(fill(messages.failed, { status: response.status }));
        return;
      }
      const filename =
        /filename="([^"]+)"/.exec(
          response.headers.get("content-disposition") ?? "",
        )?.[1] ?? "pressay-export.csv";
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(messages.done);
    } catch {
      setMessage(messages.offline);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="admin-export">
      <button
        className="button button-small"
        type="button"
        onClick={download}
        disabled={pending}
      >
        {pending ? "…" : label}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
