"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "datetime-local" | "select" | "hidden";
  required?: boolean;
  value?: string | number;
  options?: Array<{ label: string; value: string }>;
};

export function AdminActionForm({
  endpoint,
  method = "POST",
  title,
  description,
  submitLabel,
  fields,
  confirmMessage
}: {
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE";
  title: string;
  description?: string;
  submitLabel: string;
  fields: Field[];
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [createdSecret, setCreatedSecret] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(formData: FormData) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setPending(true);
    setMessage("");
    setCreatedSecret("");
    const payload = Object.fromEntries(fields.map((field) => {
      const raw = formData.get(field.name);
      if (field.type === "number" && raw !== "") return [field.name, Number(raw)];
      if (field.type === "datetime-local" && typeof raw === "string" && raw !== "") {
        return [field.name, new Date(raw).toISOString()];
      }
      return [field.name, raw];
    }).filter(([, value]) => value !== ""));
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => null) as { error?: string; secret?: string; delivery?: "code" | "link" } | null;
    setPending(false);
    if (!response.ok) {
      setMessage(result?.error ?? `Erreur ${response.status}`);
      return;
    }
    if (result?.secret) {
      const delivery = String(payload.delivery ?? "code");
      setCreatedSecret(delivery === "link" ? `${window.location.origin}/access/${result.secret}` : result.secret);
      setMessage("Créé. Copie ce secret maintenant : il ne sera plus affiché.");
    } else {
      setMessage("Action effectuée et auditée.");
    }
    router.refresh();
  }

  async function copySecret() {
    await navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <form className="admin-action" action={submit}>
    <div><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>
    <div className="admin-form-grid">
      {fields.map((field) => field.type === "hidden"
        ? <input key={field.name} name={field.name} type="hidden" defaultValue={field.value} />
        : <label key={field.name}>{field.label}
        {field.type === "select" ? <select name={field.name} defaultValue={field.value} required={field.required}>
          {field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select> : <input name={field.name} type={field.type ?? "text"} defaultValue={field.value} required={field.required} />}
      </label>)}
    </div>
    <button className="button button-small" disabled={pending}>{pending ? "…" : submitLabel}</button>
    {message ? <output className="admin-form-message" role="status">{message}</output> : null}
    {createdSecret ? <div className="admin-secret-result"><code>{createdSecret}</code><button className="button button-small" type="button" onClick={copySecret}>{copied ? "Copié" : "Copier"}</button></div> : null}
  </form>;
}
