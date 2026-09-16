import { AdminActionForm } from "@/components/admin-action-form";
import { AdminPromotionUsage } from "@/components/admin-promotion-usage";
import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
type Campaign = {
  id: string;
  kind: string;
  code_hint: string;
  duration_days: number | null;
  discount_percent: number | null;
  discount_amount: number | null;
  max_redemptions: number;
  redemptions: number;
  status: string;
  expires_at: string;
};
export default async function Page() {
  const { data, error } = await adminData<{ campaigns: Campaign[] }>(
    "admin/campaigns",
  );
  return (
    <>
      <AdminHeading
        eyebrow="ACCÈS / PROMOTIONS"
        title="Invitations et promotions"
        detail="Les accès offerts fonctionnent indépendamment de l’ouverture des ventes. Les secrets sont affichés une seule fois."
      />
      <section className="admin-actions-section admin-actions-grid">
        <AdminActionForm
          endpoint="/api/pressay/admin/campaigns"
          title="Offrir Pressay Pro"
          description="Quotas Cloud Pro habituels, sous réserve de disponibilité du service. Le code expire après 30 jours par défaut."
          submitLabel="Créer l’invitation"
          fields={[
            { name: "kind", label: "", type: "hidden", value: "access_grant" },
            {
              name: "delivery",
              label: "Format",
              type: "select",
              options: [
                { label: "Code", value: "code" },
                { label: "Lien", value: "link" },
              ],
            },
            {
              name: "durationDays",
              label: "Durée Pro (1–365 jours)",
              type: "number",
              value: 30,
            },
            {
              name: "maxRedemptions",
              label: "Utilisations maximales",
              type: "number",
              value: 1,
            },
            {
              name: "restrictedEmail",
              label: "Adresse autorisée (facultatif)",
              type: "email",
            },
            {
              name: "expiresAt",
              label: "Expiration du code (facultatif)",
              type: "datetime-local",
            },
            { name: "reason", label: "Motif", required: true },
          ]}
        />
        <AdminActionForm
          endpoint="/api/pressay/admin/campaigns"
          title="Promotion Stripe"
          description="Une seule facture. Choisir un pourcentage OU un montant en centimes. Réservé aux produits Pressay."
          submitLabel="Créer la promotion"
          fields={[
            {
              name: "kind",
              label: "",
              type: "hidden",
              value: "stripe_discount",
            },
            {
              name: "discountPercent",
              label: "Pourcentage (1–100)",
              type: "number",
            },
            {
              name: "discountAmount",
              label: "Montant en centimes EUR",
              type: "number",
            },
            {
              name: "maxRedemptions",
              label: "Utilisations maximales",
              type: "number",
              value: 1,
            },
            {
              name: "expiresAt",
              label: "Expiration (facultatif)",
              type: "datetime-local",
            },
            { name: "reason", label: "Motif", required: true },
          ]}
        />
      </section>
      {error}
      {data ? (
        <AdminTable
          headers={[
            "Identifiant",
            "Type",
            "Avantage",
            "Utilisation",
            "État",
            "Expiration",
            "Action",
          ]}
          rows={data.campaigns.map((c) => [
            c.id.slice(0, 8),
            c.kind,
            c.duration_days
              ? `${c.duration_days} jours`
              : c.discount_percent
                ? `${c.discount_percent} %`
                : `${Number(c.discount_amount) / 100} €`,
            c.kind === "stripe_discount" ? (
              <AdminPromotionUsage key={c.id} id={c.id} />
            ) : (
              `${c.redemptions}/${c.max_redemptions}`
            ),
            c.status,
            adminDate(c.expires_at),
            c.status !== "revoked" ? (
              <AdminActionForm
                key={c.id}
                endpoint={`/api/pressay/admin/campaigns/${c.id}/revoke`}
                title="Révoquer le code"
                submitLabel="Révoquer"
                fields={[{ name: "reason", label: "Motif", required: true }]}
                confirmMessage="Fermer ce code ? Les accès déjà accordés seront conservés."
              />
            ) : (
              "—"
            ),
          ])}
        />
      ) : null}
    </>
  );
}
