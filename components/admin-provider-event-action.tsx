import { AdminActionForm } from "@/components/admin-action-form";
import type { AdminProviderEvent } from "@/lib/operations-contract";

/** Stripe events in failure can be replayed; Apple retries by itself. */
export function ProviderEventAction({ event }: { event: AdminProviderEvent }) {
  if (event.state !== "failed") return <>—</>;
  if (event.provider !== "stripe") return <>Relance par Apple</>;
  return (
    <AdminActionForm
      compact
      endpoint={`/api/pressay/admin/billing/events/stripe/${encodeURIComponent(event.provider_event_id)}/replay`}
      title="Rejouer"
      submitLabel="Rejouer"
      fields={[{ name: "reason", label: "Motif", required: true }]}
      confirmMessage="Relire cet événement chez Stripe et l’appliquer ? Sans effet s’il a déjà été traité."
    />
  );
}
