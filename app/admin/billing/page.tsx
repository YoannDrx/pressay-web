import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
type Event = {
  provider: string;
  provider_event_id: string;
  event_type: string;
  state: string;
  error_code: string | null;
  received_at: string;
};
export default async function Page() {
  const { data, error } = await adminData<{ events: Event[] }>(
    "admin/billing/events",
  );
  return (
    <>
      <AdminHeading
        eyebrow="PAIEMENTS / ÉVÉNEMENTS"
        title="Facturation"
        detail="Événements Stripe et Apple. Les opérations financières restent accessibles dans le tableau de bord du fournisseur."
      />
      {error}
      {data ? (
        <AdminTable
          headers={[
            "Fournisseur",
            "Événement",
            "Type",
            "État",
            "Erreur",
            "Reçu",
          ]}
          rows={data.events.map((e) => [
            e.provider,
            e.provider_event_id,
            e.event_type,
            e.state,
            e.error_code ?? "—",
            adminDate(e.received_at),
          ])}
        />
      ) : null}
    </>
  );
}
