import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { AdminActionForm } from "@/components/admin-action-form";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
type Referral = {
  id: string;
  referrer_id: string;
  referee_id: string;
  referrer_email: string;
  referee_email: string;
  status: string;
  attributed_at: string;
  expires_at: string;
  rewards: {
    id: string;
    side: string;
    status: string;
    kind: string;
    amount_minor: number | null;
    last_error_code: string | null;
  }[];
};
export default async function Page() {
  const { data, error } = await adminData<{ referrals: Referral[] }>(
    "admin/referrals",
  );
  return (
    <>
      <AdminHeading
        eyebrow="PARRAINAGE / STRIPE"
        title="Parrainages"
        detail="Attribution de 30 jours, premier paiement encaissé, récompenses persistantes. Les crédits au résultat incertain exigent une réconciliation manuelle."
      />
      <p>
        La file est traitée quotidiennement. Tu peux aussi lancer un lot ici
        après validation forte.
      </p>
      <AdminActionForm
        endpoint="/api/pressay/admin/rewards/process"
        title="Traiter les récompenses en attente"
        submitLabel="Traiter un lot"
        fields={[{ name: "reason", label: "Motif", required: true }]}
      />
      {error}
      {data ? (
        <AdminTable
          headers={[
            "Parrain",
            "Filleul",
            "État",
            "Attribution",
            "Expiration",
            "Récompenses",
          ]}
          rows={data.referrals.map((r) => [
            <Link key="from" href={`/admin/users/${r.referrer_id}`}>
              {r.referrer_email ?? r.referrer_id}
            </Link>,
            <Link key="to" href={`/admin/users/${r.referee_id}`}>
              {r.referee_email ?? r.referee_id}
            </Link>,
            r.status,
            adminDate(r.attributed_at),
            adminDate(r.expires_at),
            <div key="rewards">
              {r.rewards.map((reward) => (
                <div key={reward.id}>
                  <p>
                    {reward.side} · {reward.kind} · {reward.status}
                    {reward.amount_minor
                      ? ` · ${reward.amount_minor / 100} €`
                      : ""}
                  </p>
                  <small>{reward.last_error_code}</small>
                  {reward.status === "failed" ? (
                    <AdminActionForm
                      endpoint={`/api/pressay/admin/rewards/${reward.id}/retry`}
                      title="Reprendre"
                      submitLabel="Réessayer"
                      fields={[
                        { name: "reason", label: "Motif", required: true },
                      ]}
                    />
                  ) : null}
                </div>
              ))}
            </div>,
          ])}
        />
      ) : null}
    </>
  );
}
