import { AdminHeading } from "@/components/admin-heading";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import { AdminWaitlistExport } from "@/components/admin-waitlist-export";
import { WaitlistForm } from "@/components/waitlist-form";
import type { AdminWaitlist } from "@/lib/waitlist-input";

const platformLabels = { ios: "iPhone", windows: "Windows" } as const;

export default async function Page() {
  const { data, error } = await adminData<AdminWaitlist>("admin/waitlist");
  return (
    <>
      <AdminHeading
        eyebrow="LANCEMENTS / LISTES D’ATTENTE"
        title="Listes d’attente"
        detail="Inscriptions avec consentement explicite. Adresse, langue, source et date de consentement uniquement ; ni adresse IP ni navigateur. Effacées 730 jours après le consentement."
      />
      {error}
      {data ? (
        <>
          <AdminTable
            headers={[
              "Plateforme",
              "Inscrits",
              "Français",
              "Anglais",
              "7 derniers jours",
              "Désinscrits",
              "Dernière inscription",
              "Export",
            ]}
            rows={data.platforms.map((p) => [
              platformLabels[p.platform],
              p.subscribed,
              p.french,
              p.english,
              p.last_7d,
              p.unsubscribed,
              adminDate(p.last_signup_at),
              <AdminWaitlistExport
                key="export"
                platform={p.platform}
                label="Exporter (CSV)"
              />,
            ])}
          />
          <h2>Inscrits par source</h2>
          <AdminTable
            headers={["Plateforme", "Source", "Inscrits"]}
            rows={data.sources.map((s) => [platformLabels[s.platform], s.source, s.count])}
          />
        </>
      ) : null}
      <h2>Formulaire (pas encore publié)</h2>
      <p>
        Formulaire réutilisable pour les pages publiques, affiché ici seulement.
        Une adresse saisie ici est réellement inscrite.
      </p>
      <section className="admin-grid-two">
        <article className="admin-panel">
          <h2>iPhone · français</h2>
          <WaitlistForm platform="ios" locale="fr" source="admin-preview" />
        </article>
        <article className="admin-panel">
          <h2>Windows · English</h2>
          <WaitlistForm platform="windows" locale="en" source="admin-preview" />
        </article>
      </section>
    </>
  );
}
