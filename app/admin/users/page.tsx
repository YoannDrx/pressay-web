import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import { deviceMix } from "@/lib/admin-format";
import type { AdminUsers } from "@/lib/operations-contract";

const planLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  sandbox: "Sandbox Apple",
};
const sourceLabels: Record<string, string> = {
  stripe: "Stripe",
  app_store: "App Store",
  support: "Offert",
  trial: "Historique",
};
const statusLabels: Record<string, string> = {
  active: "Actif",
  deleting: "Suppression en cours",
  deleted: "Supprimé",
};
const searchKinds: Record<string, string> = {
  text: "e-mail ou identité du site",
  uuid: "identifiant de compte, d’appareil ou d’identité",
  stripe_customer: "client Stripe",
  stripe_subscription: "abonnement Stripe",
  apple_transaction: "transaction Apple d’origine",
};

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
        detail="Recherche par e-mail, identifiant de compte ou d’appareil, cus_…, sub_… ou transaction Apple d’origine. Les statistiques ne contiennent pas l’usage local."
      />
      <form className="admin-filters">
        <label>
          Recherche
          <input
            name="search"
            defaultValue={query.search}
            placeholder="e-mail, cus_…, sub_…, transaction Apple, UUID"
          />
        </label>
        <label>
          Offre
          <select name="plan" defaultValue={query.plan}>
            <option value="">Toutes</option>
            <option value="free">Free</option>
            <option value="pro">Pro payant ou offert</option>
            <option value="sandbox">Sandbox Apple</option>
          </select>
        </label>
        <label>
          Compte
          <select name="status" defaultValue={query.status}>
            <option value="">Tous</option>
            <option value="active">Actif</option>
            <option value="deleting">Suppression en cours</option>
            <option value="deleted">Supprimé</option>
          </select>
        </label>
        <button className="button">Filtrer</button>
      </form>
      {error}
      {data?.searchKind && searchKinds[data.searchKind] ? (
        <p className="admin-search-kind">
          Recherche par {searchKinds[data.searchKind]}.
        </p>
      ) : null}
      {data ? (
        <AdminTable
          headers={[
            "Utilisateur",
            "Offre",
            "Source",
            "Statut",
            "Appareils actifs",
            "Dernier contact",
            "Inscription",
          ]}
          rows={data.users.map((u) => [
            <Link key={u.id} href={`/admin/users/${u.id}`}>
              {u.email ?? u.id}
            </Link>,
            planLabels[u.plan] ?? u.plan,
            u.entitlement_source && u.entitlement_source !== "none"
              ? `${sourceLabels[u.entitlement_source] ?? u.entitlement_source}${u.sandbox ? " (Sandbox)" : ""}`
              : "—",
            statusLabels[u.status] ?? u.status,
            deviceMix(
              u.macos_device_count,
              u.windows_device_count,
              u.active_device_count,
              u.ios_device_count,
            ),
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
