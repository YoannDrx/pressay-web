import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
type Entry = {
  id: number;
  actor_id: string | null;
  action: string;
  target_id: string;
  reason: string;
  request_id: string;
  result: string;
  created_at: string;
};
export default async function Page() {
  const { data, error } = await adminData<{ entries: Entry[] }>(
    "admin/audit-log",
  );
  return (
    <>
      <AdminHeading
        eyebrow="TRAÇABILITÉ"
        title="Journal d’audit"
        detail="Demandes et résultats des opérations administratives. Aucun contenu de dictée ni secret."
      />
      {error}
      {data ? (
        <AdminTable
          headers={[
            "Action",
            "Auteur",
            "Cible",
            "Motif",
            "Résultat",
            "Référence",
            "Date",
          ]}
          rows={data.entries.map((e) => [
            e.action,
            e.actor_id?.slice(0, 8) ?? "Compte supprimé",
            e.target_id,
            e.reason,
            e.result,
            e.request_id.slice(0, 12),
            adminDate(e.created_at),
          ])}
        />
      ) : null}
    </>
  );
}
