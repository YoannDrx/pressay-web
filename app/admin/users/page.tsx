import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { pressayJSON } from "@/lib/pressay-api";

type UserRow = { id: string; email: string | null; display_name: string | null; subscription_plan: string; subscription_status: string; active_device_count: number; last_device_seen_at: string | null; created_at: string };
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const params = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const { data } = await pressayJSON<{ users: UserRow[]; nextCursor: string | null }>(`admin/users?${params}`);
  return <>
    <AdminHeading eyebrow="USERS / SUPPORT" title="Utilisateurs" detail="Recherche, droits effectifs, appareils et activité agrégée." />
    <form className="admin-filters"><input name="search" defaultValue={query.search} placeholder="Email, nom ou UUID" /><select name="plan" defaultValue={query.plan}><option value="">Tous les plans</option><option value="free">Free</option><option value="pro_byok">Pro BYOK</option><option value="lifetime_byok">Lifetime</option></select><select name="status" defaultValue={query.status}><option value="">Tous les statuts</option><option value="active">Actif</option><option value="trialing">Essai</option><option value="past_due">Impayé</option><option value="canceled">Annulé</option></select><button className="button button-small">Filtrer</button><a className="button button-small" href={`/api/pressay/admin/users?${params}&format=csv`}>CSV</a></form>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Utilisateur</th><th>Plan</th><th>Statut</th><th>Appareils</th><th>Dernier contact</th><th>Inscription</th></tr></thead><tbody>{data?.users.map((user) => <tr key={user.id}><td><Link href={`/admin/users/${user.id}`}><strong>{user.display_name || "Sans nom"}</strong><small>{user.email || "Email inconnu"}</small></Link></td><td><span className="admin-pill">{user.subscription_plan || "free"}</span></td><td>{user.subscription_status || "inconnu"}</td><td>{user.active_device_count}</td><td>{date(user.last_device_seen_at)}</td><td>{date(user.created_at)}</td></tr>)}</tbody></table></div>
    {!data?.users.length ? <div className="admin-empty">Aucun utilisateur — ou données indisponibles faute de compte/consentement.</div> : null}
    {data?.nextCursor ? <Link className="button button-small admin-next" href={`/admin/users?cursor=${data.nextCursor}`}>Page suivante</Link> : null}
  </>;
}
function date(value: string | null) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "Inconnu"; }
