import { AdminHeading } from "@/components/admin-heading";
import { AdminActionForm } from "@/components/admin-action-form";
import { adminData, adminDate } from "@/components/admin-data";
type Health = {
  gates: {
    channel: string;
    id: string;
    label: string;
    status: string;
    evidence: string;
    checked_at: string | null;
  }[];
  jobs: { status: string; count: number }[];
  flags: Record<string, boolean>;
  checkedAt: string;
};
export default async function Page() {
  const { data: d, error } = await adminData<Health>("admin/health");
  return (
    <>
      <AdminHeading
        eyebrow="DISPONIBILITÉ / LANCEMENT"
        title="Santé et lancement"
        detail="Conditions indépendantes pour la vente directe et le Mac App Store. Valider une preuve n’active aucun paiement automatiquement."
      />
      {error}
      {d ? (
        <>
          <p>Lecture serveur : {adminDate(d.checkedAt)}</p>
          <p>
            {Object.entries(d.flags)
              .map(([key, value]) => `${key} : ${value ? "activé" : "fermé"}`)
              .join(" · ")}
          </p>
          <p>
            Récompenses :{" "}
            {d.jobs.map((j) => `${j.status} (${j.count})`).join(" · ") ||
              "aucune"}
          </p>
          {["direct", "app_store"].map((channel) => (
            <section key={channel}>
              <h2>
                {channel === "direct"
                  ? "Vente directe / Stripe"
                  : "Mac App Store"}
              </h2>
              <div className="admin-grid-two">
                {d.gates
                  .filter((g) => g.channel === channel)
                  .map((g) => (
                    <article className="admin-panel" key={g.id}>
                      <h3>{g.label}</h3>
                      <p>
                        {g.status} · {adminDate(g.checked_at)}
                      </p>
                      <p>{g.evidence || "Aucune preuve enregistrée."}</p>
                      <AdminActionForm
                        endpoint={`/api/pressay/admin/gates/${channel}/${g.id}`}
                        method="PATCH"
                        title="Mettre à jour la preuve"
                        submitLabel="Enregistrer"
                        fields={[
                          {
                            name: "status",
                            label: "État",
                            type: "select",
                            value: g.status,
                            options: [
                              { label: "En attente", value: "pending" },
                              { label: "Bloqué", value: "blocked" },
                              { label: "Validé", value: "passed" },
                            ],
                          },
                          {
                            name: "evidence",
                            label: "Preuve, référence et résultat",
                            value: g.evidence,
                          },
                          { name: "reason", label: "Motif", required: true },
                        ]}
                      />
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </>
      ) : null}
    </>
  );
}
