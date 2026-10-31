import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { ProviderEventAction } from "@/components/admin-provider-event-action";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import {
  billingHref,
  billingPath,
  billingTabs,
  billingView,
} from "@/lib/admin-billing";
import { money } from "@/lib/admin-format";
import type {
  AdminFinancialEvents,
  AdminProviderEvents,
} from "@/lib/operations-contract";

const financialKinds: Record<string, string> = {
  invoice_paid: "Facture payée",
  invoice_failed: "Paiement échoué",
  invoice_voided: "Facture annulée",
  refund: "Remboursement",
  dispute: "Litige",
};
const eventStates: Record<string, string> = {
  received: "Reçu",
  applied: "Appliqué",
  ignored: "Ignoré",
  failed: "En échec",
};

function AccountLink({ id, email }: { id?: string | null; email?: string | null }) {
  if (!id) return <>—</>;
  return <Link href={`/admin/users/${id}`}>{email ?? <code>{id}</code>}</Link>;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const view = billingView(await searchParams);
  const webhooks = view.tab === "webhooks" || view.tab === "events";
  const { data, error } = await adminData<AdminProviderEvents | AdminFinancialEvents>(
    billingPath(view),
  );
  const next = data?.nextCursor ? billingHref(view, data.nextCursor) : null;
  return (
    <>
      <AdminHeading
        eyebrow="PAIEMENTS / ÉVÉNEMENTS"
        title="Facturation"
        detail="Remboursements, litiges, paiements en échec et webhooks Stripe et Apple. Les opérations financières se font dans le tableau de bord du fournisseur."
      />
      <nav className="admin-tabs" aria-label="Vues de la facturation">
        {billingTabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/billing?tab=${tab.id}`}
            aria-current={tab.id === view.tab ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {view.tab === "dispute" ? (
        <p>
          {view.open ? (
            <Link href="/admin/billing?tab=dispute">Afficher tous les litiges</Link>
          ) : (
            <Link href="/admin/billing?tab=dispute&open=true">
              Seulement les litiges ouverts
            </Link>
          )}
        </p>
      ) : null}
      {error}
      {data && webhooks ? (
        <AdminTable
          headers={[
            "Reçu",
            "Fournisseur",
            "Événement",
            "Type",
            "État",
            "Erreur",
            "Compte",
            "Action",
          ]}
          rows={(data as AdminProviderEvents).events.map((e) => [
            adminDate(e.received_at),
            e.provider === "stripe" ? "Stripe" : "Apple",
            <code key="id">{e.provider_event_id}</code>,
            e.event_type,
            <span key="state" className={e.state === "failed" ? "admin-danger" : ""}>
              {eventStates[e.state] ?? e.state}
            </span>,
            e.error_code ?? "—",
            <AccountLink key="account" id={e.account_id} />,
            <ProviderEventAction key="action" event={e} />,
          ])}
        />
      ) : null}
      {data && !webhooks ? (
        <AdminTable
          headers={["Date", "Événement", "Statut", "Montant", "Client", "Objet Stripe"]}
          rows={(data as AdminFinancialEvents).events.map((f) => [
            adminDate(f.provider_occurred_at),
            `${financialKinds[f.kind] ?? f.kind}${f.full_reversal ? " (total)" : ""}`,
            f.status,
            money(f.amount_minor, f.currency),
            <AccountLink key="account" id={f.account_id} email={f.email} />,
            <code key="object">{f.provider_object_id}</code>,
          ])}
        />
      ) : null}
      <nav className="admin-pagination" aria-label="Pages">
        {view.cursor ? <Link href={billingHref(view, "")}>← Plus récents</Link> : null}
        {next ? <Link href={next}>Plus anciens →</Link> : null}
      </nav>
    </>
  );
}
