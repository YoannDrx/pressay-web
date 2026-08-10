import Link from "next/link";
import { redirect } from "next/navigation";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";

const navigation = [
  ["/admin", "Vue d’ensemble"], ["/admin/users", "Utilisateurs"],
  ["/admin/billing", "Facturation"], ["/admin/campaigns", "Campagnes"],
  ["/admin/referrals", "Parrainages"], ["/admin/releases", "Releases"],
  ["/admin/health", "Santé"], ["/admin/audit", "Audit"], ["/admin/team", "Équipe"]
] as const;

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!commercialIsConfigured()) return <main className="admin-gate"><div><span className="mono-label">PRESSAY ADMIN</span><h1>Back-office désactivé</h1><p>Configure Clerk, l’API et <code>ADMIN_ENABLED</code> en staging pour l’ouvrir.</p><Link className="button" href="/fr">Retour au site</Link></div></main>;
  const access = await pressayAPI("admin/overview");
  if (access.status === 401) redirect("/sign-in?redirect_url=/admin");
  if (!access.ok) return <main className="admin-gate"><div><span className="mono-label">ACCÈS REFUSÉ</span><h1>Compte non administrateur</h1><p>Le propriétaire initial est attribué une seule fois au sujet Clerk vérifié correspondant à yoann.andrieux@gmail.com.</p><Link className="button" href="/account">Mon compte</Link></div></main>;
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin"><span>p</span><strong>Pressay</strong><small>operations</small></Link>
      <nav>{navigation.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav>
      <div className="admin-privacy"><i />Metadata only<strong>Jamais d’audio ni de dictée</strong></div>
      <Link className="admin-back" href="/fr">← Landing</Link>
    </aside>
    <main className="admin-main">{children}</main>
  </div>;
}
