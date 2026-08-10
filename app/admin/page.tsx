import Link from "next/link";
import { AdminHeading } from "@/components/admin-heading";
import { pressayJSON } from "@/lib/pressay-api";

type Overview = {
  users: { total: number; new_30d: number };
  plans: Array<{ plan: string; count: number; mrr_minor: string }>;
  downloads: { total: number; last_30d: number };
  referrals: { attributed: number; converted: number };
  billing: { failed_webhooks: number; last_webhook_at: string | null };
};

export default async function AdminOverviewPage() {
  const { data } = await pressayJSON<Overview>("admin/overview");
  if (!data) return null;
  const mrr = data.plans.reduce((sum, plan) => sum + Number(plan.mrr_minor ?? 0), 0) / 100;
  const conversion = data.referrals.attributed ? Math.round(data.referrals.converted / data.referrals.attributed * 100) : 0;
  return <>
    <AdminHeading eyebrow="OPERATIONS / LIVE" title="Vue d’ensemble" detail="Une lecture commerciale et technique, sans contenu utilisateur." />
    <section className="admin-kpis">
      <KPI label="Utilisateurs" value={data.users.total} detail={`+${data.users.new_30d} sur 30 jours`} />
      <KPI label="MRR normalisé" value={`${mrr.toFixed(2)} €`} detail="Annuel ramené au mois" />
      <KPI label="Téléchargements" value={data.downloads.total} detail={`${data.downloads.last_30d} sur 30 jours`} />
      <KPI label="Conversion referral" value={`${conversion} %`} detail={`${data.referrals.converted}/${data.referrals.attributed}`} />
    </section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-head"><h2>Répartition des plans</h2><Link href="/admin/users">Explorer →</Link></div><div className="admin-bars">{data.plans.map((plan) => <div key={plan.plan}><span>{plan.plan}</span><i style={{ width: `${Math.max(4, Number(plan.count) / Math.max(1, data.users.total) * 100)}%` }} /><strong>{plan.count}</strong></div>)}</div></article>
      <article className="admin-panel"><div className="admin-panel-head"><h2>Santé commerciale</h2><Link href="/admin/health">Diagnostiquer →</Link></div><dl className="admin-definitions"><dt>Webhooks en erreur</dt><dd className={data.billing.failed_webhooks ? "admin-danger" : "admin-good"}>{data.billing.failed_webhooks}</dd><dt>Dernier webhook</dt><dd>{data.billing.last_webhook_at ? formatDate(data.billing.last_webhook_at) : "Inconnu"}</dd><dt>Contenu de dictée stocké</dt><dd className="admin-good">Jamais</dd></dl></article>
    </section>
  </>;
}

function KPI({ label, value, detail }: { label: string; value: string | number; detail: string }) { return <article><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
