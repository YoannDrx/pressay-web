import { AdminHeading } from "@/components/admin-heading";
import { pressayJSON } from "@/lib/pressay-api";

type Referral = { id: string; code: string; referrer_account_id: string; referee_account_id: string; status: string; source: string; attributed_at: string; expires_at: string; reward_count: number; failed_rewards: number };
export default async function AdminReferralsPage() {
  const { data } = await pressayJSON<{ referrals: Referral[] }>("admin/referrals");
  return <>
    <AdminHeading eyebrow="REFERRAL / 30 + 30" title="Parrainages" detail="Funnel attribution → premier paiement → récompenses, sans fingerprint publicitaire." />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Code</th><th>Parrain</th><th>Filleul</th><th>Statut</th><th>Récompenses</th><th>Attribution</th><th>Fenêtre</th></tr></thead><tbody>{data?.referrals.map((referral) => <tr key={referral.id}><td><strong>{referral.code}</strong><small>{referral.source}</small></td><td><code>{referral.referrer_account_id.slice(0, 8)}</code></td><td><code>{referral.referee_account_id.slice(0, 8)}</code></td><td><span className="admin-pill">{referral.status}</span></td><td className={referral.failed_rewards ? "admin-danger" : ""}>{referral.reward_count} · {referral.failed_rewards} erreur(s)</td><td>{date(referral.attributed_at)}</td><td>{date(referral.expires_at)}</td></tr>)}</tbody></table></div>
    {!data?.referrals.length ? <div className="admin-empty">Aucune attribution pour le moment.</div> : null}
  </>;
}
function date(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(value)); }
