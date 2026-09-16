import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import type { AdminUsers } from "@/lib/operations-contract";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const key of ["search", "plan", "status", "cursor"])
    if (query[key]) params.set(key, query[key]!);
  const { data, error } = await adminData<AdminUsers>(`admin/users?${params}`);
  const next = new URLSearchParams(params);
  if (data?.nextCursor) next.set("cursor", data.nextCursor);
  return (
    <>
      <AdminHeading
        eyebrow="COMPTES / SUPPORT"
        title="Utilisateurs"
        detail="Recherche par email ou identifiant. Les statistiques ne contiennent pas l’usage local."
      />
      <form className="admin-filters">
        <label>
          Recherche
          <input name="search" defaultValue={query.search} />
        </label>
        <label>
          Offre
          <select name="plan" defaultValue={query.plan}>
            <option value="">Toutes</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <label>
          Compte
          <select name="status" defaultValue={query.status}>
            <option value="">Tous</option>
            <option value="active">Actif</option>
            <option value="deleting">Suppression en cours</option>
          </select>
        </label>
        <button className="button">Filtrer</button>
      </form>
      {error}
      {data ? (
        <AdminTable
          headers={[
            "Utilisateur",
            "Offre",
            "Statut",
            "Mac",
            "Dernier contact",
            "Inscription",
          ]}
          rows={data.users.map((u) => [
            <Link key={u.id} href={`/admin/users/${u.id}`}>
              {u.email ?? u.id}
            </Link>,
            u.plan,
            u.status,
            u.active_device_count,
            adminDate(u.last_device_seen_at),
            adminDate(u.created_at),
          ])}
        />
      ) : null}
      {data?.nextCursor ? (
        <Link className="button" href={`/admin/users?${next}`}>
          Page suivante
        </Link>
      ) : null}
    </>
  );
}
