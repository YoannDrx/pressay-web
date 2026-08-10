import { randomUUID } from "node:crypto";
import { AdminActionForm } from "@/components/admin-action-form";
import { AdminHeading } from "@/components/admin-heading";
import { pressayJSON } from "@/lib/pressay-api";

type Event = { provider_event_id: string; event_type: string; status: string; attempt_count: number; last_error_code: string | null; provider_created_at: string; processed_at: string };
export default async function AdminBillingPage() {
  const { data } = await pressayJSON<{ events: Event[] }>("admin/billing/events");
  return <>
    <AdminHeading eyebrow="STRIPE / LEDGER" title="Facturation" detail="Webhooks, réconciliation et remboursements traçables. Aucun moyen de paiement n’est stocké chez Pressay." />
    <section className="admin-actions-section admin-actions-grid">
      <AdminActionForm endpoint="/api/pressay/admin/billing/reconcile" title="Réconcilier Stripe" description="Laisser l’UUID vide pour un traitement global (owner)." submitLabel="Lancer" fields={[{ name: "accountID", label: "UUID utilisateur (optionnel)" }, { name: "reason", label: "Motif", required: true }]} />
      <AdminActionForm endpoint="/api/pressay/admin/billing/refunds" title="Rembourser" description="Total si le montant reste vide. MFA récente obligatoire." submitLabel="Créer le remboursement" fields={[{ name: "paymentIntentID", label: "Payment Intent pi_…", required: true }, { name: "amount", label: "Montant en centimes", type: "number" }, { name: "reason", label: "Motif", required: true }, { name: "idempotencyKey", label: "", type: "hidden", value: randomUUID() }]} confirmMessage="Confirmer ce remboursement Stripe ?" />
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><h2>Derniers événements</h2><span>{data?.events.length ?? 0} affichés</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Événement</th><th>Type</th><th>Statut</th><th>Essais</th><th>Erreur</th><th>Reçu</th></tr></thead><tbody>{data?.events.map((event) => <tr key={event.provider_event_id}><td><code>{event.provider_event_id}</code></td><td>{event.event_type}</td><td><span className={`admin-pill ${event.status === "failed" ? "admin-pill-danger" : ""}`}>{event.status}</span></td><td>{event.attempt_count}</td><td>{event.last_error_code ?? "—"}</td><td>{date(event.provider_created_at)}</td></tr>)}</tbody></table></div></section>
  </>;
}
function date(value: string) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—"; }
