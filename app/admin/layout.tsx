import { SessionNavigation } from "@/components/session-navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pressayAPI } from "@/lib/pressay-api";
import { getWebIdentity } from "@/lib/server-identity";
import { AdminStepUp } from "@/components/admin-step-up";
import { adminMessages, fill } from "@/lib/admin-i18n";
import { teamMessages } from "@/lib/admin-messages/team";
import type { AdminSession, OperationsRole } from "@/lib/operations-contract";
export const dynamic = "force-dynamic";
const navigation = [
  ["/admin", "Vue d’ensemble"],
  ["/admin/metrics", "Indicateurs"],
  ["/admin/users", "Utilisateurs"],
  ["/admin/campaigns", "Invitations et promotions"],
  ["/admin/referrals", "Parrainages"],
  ["/admin/waitlist", "Listes d’attente"],
  ["/admin/billing", "Facturation"],
  ["/admin/health", "Santé et lancement"],
  ["/admin/audit", "Journal d’audit"],
];
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getWebIdentity();
  if (!identity) redirect("/sign-in?redirect_url=/admin");
  const t = adminMessages(teamMessages);
  const access = await pressayAPI("admin/session").catch(() => null);
  const payload = (await access?.json().catch(() => null)) as
    | (Partial<AdminSession> & { error?: { code?: string } })
    | null;
  if (access?.status === 403 && payload?.error?.code === "two_factor_required")
    return (
      <main className="admin-gate">
        <div>
          <h1>{t.gate.twoFactorTitle}</h1>
          <p>{t.gate.twoFactorBody}</p>
          <Link className="button" href="/account/security">
            {t.gate.twoFactorAction}
          </Link>
        </div>
      </main>
    );
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
  const role: OperationsRole =
    payload?.role === "support" || payload?.role === "readonly"
      ? payload.role
      : "owner";
  const links =
    role === "owner"
      ? [...navigation, ["/admin/team", t.nav.members] as const]
      : navigation;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          <span className="brand-logo" aria-hidden="true" />
          pressay
        </Link>
        <nav>
          {links.map(([href, label]) => (
            <Link key={href} href={href} prefetch={false}>
              {label}
            </Link>
          ))}
        </nav>
        <p className="admin-role" data-role={role}>
          {fill(t.sidebar.role, { role: t.roles[role] })}
        </p>
        <div className="admin-privacy">
          Comptes et données serveur.<strong>Aucune dictée locale.</strong>
        </div>
        <AdminStepUp
          initialExpiresAt={
            identity.stepUpAt ? (identity.stepUpAt + 600) * 1000 : 0
          }
        />
        <SessionNavigation locale="fr" rememberLocale={false} />
        <Link href="/account">← Mon compte</Link>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
