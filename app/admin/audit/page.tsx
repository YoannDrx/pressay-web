import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import {
  auditDetails,
  auditFilters,
  auditSearchParams,
} from "@/lib/admin-audit";
import type { AdminAuditLog } from "@/lib/operations-contract";

const results: Record<string, string> = {
  requested: "Demandé",
  succeeded: "Réussi",
  replayed: "Déjà appliqué",
  failed: "Échec",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = auditFilters(await searchParams);
  // Step-up read, audited by the Cloud as admin.audit.read.
  const { data, error } = await adminData<AdminAuditLog>(
    `admin/audit-log?${auditSearchParams(filters)}`,
  );
  const next = data?.nextCursor
    ? `/admin/audit?${auditSearchParams(filters, data.nextCursor)}`
    : null;
  const first = filters.cursor
    ? `/admin/audit?${auditSearchParams(filters, "")}`
    : null;
  return (
    <>
      <AdminHeading
        eyebrow="TRAÇABILITÉ"
        title="Journal d’audit"
        detail="Demandes et résultats des opérations administratives, 50 par page. Aucun contenu de dictée ni secret."
      />
      <form className="admin-filters">
        <label>
          Action (ou préfixe)
          <input
            name="action"
            defaultValue={filters.action}
            placeholder="grant, device.restore…"
          />
        </label>
        <label>
          Compte ou cible
          <input
            name="target"
            defaultValue={filters.target}
            placeholder="identifiant de compte, d’accès, d’appareil"
          />
        </label>
        <label>
          Du
          <input name="from" type="date" defaultValue={filters.from} />
        </label>
        <label>
          Au
          <input name="to" type="date" defaultValue={filters.to} />
        </label>
        <label>
          Lectures de données
          <select name="reads" defaultValue={filters.reads}>
            <option value="exclude">Masquées</option>
            <option value="include">Affichées</option>
          </select>
        </label>
        <button className="button button-small">Filtrer</button>
      </form>
      {error}
      {data ? (
        <>
          <AdminTable
            headers={[
              "Date",
              "Action",
              "Résultat",
              "Auteur",
              "Compte",
              "Cible",
              "Motif",
              "Détails",
              "Requête",
            ]}
            rows={data.entries.map((e) => [
              adminDate(e.created_at),
              e.action,
              <span
                key="result"
                className={e.result === "failed" ? "admin-danger" : ""}
              >
                {results[e.result] ?? e.result}
              </span>,
              e.actor_id ? (
                <span key="actor">
                  {e.actor_email ?? "Sans e-mail"}
                  <br />
                  <code>{e.actor_id}</code>
                </span>
              ) : (
                "Compte supprimé"
              ),
              e.target_account_id ? (
                <Link key="account" href={`/admin/users/${e.target_account_id}`}>
                  <code>{e.target_account_id}</code>
                </Link>
              ) : (
                "—"
              ),
              e.target_id === e.target_account_id ? "Compte" : e.target_id,
              e.reason === "personal_data_read" ? "Lecture de données" : e.reason,
              auditDetails(e.details),
              <code key="request">{e.request_id}</code>,
            ])}
          />
          <nav className="admin-pagination" aria-label="Pages du journal">
            {first ? <Link href={first}>← Plus récentes</Link> : null}
            {next ? <Link href={next}>Plus anciennes →</Link> : null}
          </nav>
        </>
      ) : null}
    </>
  );
}
