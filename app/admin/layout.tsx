import { SessionNavigation } from "@/components/session-navigation";
import { accountLocale } from "@/lib/account-locale";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pressayAPI } from "@/lib/pressay-api";
import { getWebIdentity } from "@/lib/server-identity";
import { AdminStepUp } from "@/components/admin-step-up";
export const dynamic = "force-dynamic";
const navigation = [
  ["/admin", "Vue d’ensemble"],
  ["/admin/users", "Utilisateurs"],
  ["/admin/campaigns", "Invitations et promotions"],
  ["/admin/referrals", "Parrainages"],
  ["/admin/billing", "Facturation"],
  ["/admin/health", "Santé et lancement"],
  ["/admin/audit", "Journal d’audit"],
];
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getWebIdentity())) redirect("/sign-in?redirect_url=/admin");
  const access = await pressayAPI("admin/session").catch(() => null);
  if (!access?.ok)
    return (
      <main className="admin-gate">
        <div>
          <h1>
            {access?.status === 403
              ? "Compte non administrateur"
              : "Administration temporairement indisponible"}
          </h1>
          <p>
            {access?.status === 403
              ? "Les droits sont vérifiés par le serveur."
              : "Le service ne répond pas correctement. Cela ne signifie pas que ton compte a perdu ses droits."}
          </p>
          <p>{access?.headers.get("x-request-id")}</p>
          <Link className="button" href="/account">
            Mon compte
          </Link>
        </div>
      </main>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          <span className="brand-logo" aria-hidden="true" />
          pressay
        </Link>
        <nav>
          {navigation.map(([href, label]) => (
            <Link key={href} href={href} prefetch={false}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="admin-privacy">
          Comptes et données serveur.<strong>Aucune dictée locale.</strong>
        </div>
        <details className="admin-security">
          <summary>Validation des actions sensibles</summary>
          <AdminStepUp />
        </details>
        <SessionNavigation locale={await accountLocale()} />
        <Link href="/account">← Mon compte</Link>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
