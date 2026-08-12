import { AdminHeading } from "@/components/admin-heading";
import { AdminReferralActions } from "@/components/admin-referral-actions";
import { pressayJSON } from "@/lib/pressay-api";

type Referral = { id: string; code: string; referrer_account_id: string; referee_account_id: string; status: string; source: string; risk_status: string; rejection_reason: string | null; attributed_at: string; expires_at: string; reward_count: number; pending_rewards: number; applied_rewards: number; failed_rewards: number; last_error_code: string | null };
export default async function AdminReferralsPage() {
  const { data } = await pressayJSON<{ referrals: Referral[] }>("admin/referrals");
  return <>
    <AdminHeading eyebrow="REFERRAL / 30 + 30" title="Parrainages" detail="Funnel attribution → premier paiement → récompenses, sans fingerprint publicitaire." />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Code</th><th>Parrain</th><th>Filleul</th><th>Statut</th><th>Récompenses</th><th>Attribution</th><th>Fenêtre</th><th>Actions</th></tr></thead><tbody>{data?.referrals.map((referral) => <tr key={referral.id}><td><strong>{referral.code}</strong><small>{referral.source}</small></td><td><code>{referral.referrer_account_id.slice(0, 8)}</code></td><td><code>{referral.referee_account_id.slice(0, 8)}</code></td><td><span className="admin-pill">{referral.status}</span><small>{referral.risk_status}{referral.rejection_reason ? ` · ${referral.rejection_reason}` : ""}</small></td><td className={referral.failed_rewards ? "admin-danger" : ""}>{referral.applied_rewards} appliquée(s) · {referral.pending_rewards} en attente · {referral.failed_rewards} erreur(s){referral.last_error_code ? <small>{referral.last_error_code}</small> : null}</td><td>{date(referral.attributed_at)}</td><td>{date(referral.expires_at)}</td><td><AdminReferralActions referralID={referral.id} riskStatus={referral.risk_status} failedRewards={referral.failed_rewards} /></td></tr>)}</tbody></table></div>
    {!data?.referrals.length ? <div className="admin-empty">Aucune attribution pour le moment.</div> : null}
  </>;
}
function date(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(value)); }
