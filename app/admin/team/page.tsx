import { AdminHeading } from "@/components/admin-heading";
import { AdminActionForm } from "@/components/admin-action-form";
import { adminData, AdminTable, adminDate } from "@/components/admin-data";
import { adminMessages } from "@/lib/admin-i18n";
import { teamMessages } from "@/lib/admin-messages/team";
import { memberAuthenticators } from "@/lib/admin-members";
import { getWebIdentity } from "@/lib/server-identity";
import type { AdminMembers, OperationsRole } from "@/lib/operations-contract";

const roles: OperationsRole[] = ["owner", "support", "readonly"];

/**
 * Administrators and their role. The Cloud returns the list only to an owner
 * with a recent step-up, audits the read, and checks every change.
 */
export default async function Page() {
  const t = adminMessages(teamMessages);
  const { data, error } = await adminData<AdminMembers>("admin/members");
  const [viewer, factors] = await Promise.all([
    getWebIdentity(),
    data
      ? memberAuthenticators(data.members.map((member) => member.authUserId))
      : Promise.resolve(new Map<string, boolean>()),
  ]);
  const roleOptions = roles.map((role) => ({ label: t.roles[role], value: role }));
  return (
    <>
      <AdminHeading eyebrow={t.page.eyebrow} title={t.page.title} detail={t.page.detail} />
      {data ? null : (
        <>
          <p className="admin-search-kind">{t.page.ownerOnly}</p>
          {error}
        </>
      )}
      {data ? (
        <>
          <AdminTable
            headers={t.page.headers}
            rows={data.members.map((member) => {
              const factor = factors.get(member.authUserId);
              return [
                <span key="member">
                  <strong>{member.email ?? member.accountId}</strong>
                  {member.authUserId === viewer?.subject ? (
                    <small>{t.page.you}</small>
                  ) : null}
                </span>,
                <span key="role" className="admin-pill">
                  {t.roles[member.role]}
                </span>,
                <span
                  key="factor"
                  className={factor === false ? "admin-danger" : undefined}
                >
                  {factor === undefined
                    ? t.page.authenticatorUnknown
                    : factor
                      ? t.page.authenticatorOn
                      : t.page.authenticatorOff}
                </span>,
                member.addedByEmail ?? (member.addedBy ? member.addedBy : t.page.initial),
                adminDate(member.createdAt),
                <div key="actions" className="admin-row-actions">
                  <AdminActionForm
                    compact
                    endpoint={`/api/pressay/admin/members/${member.accountId}/role`}
                    title={t.change.title}
                    submitLabel={t.change.submit}
                    confirmMessage={t.change.confirm}
                    fields={[
                      {
                        name: "role",
                        label: t.change.role,
                        type: "select",
                        value: member.role,
                        options: roleOptions,
                      },
                      { name: "reason", label: t.change.reason, required: true },
                    ]}
                  />
                  <AdminActionForm
                    compact
                    endpoint={`/api/pressay/admin/members/${member.accountId}/remove`}
                    title={t.remove.title}
                    submitLabel={t.remove.submit}
                    confirmMessage={t.remove.confirm}
                    fields={[{ name: "reason", label: t.remove.reason, required: true }]}
                  />
                </div>,
              ];
            })}
          />
          <section className="admin-actions-section">
            <div className="admin-actions-grid">
              <AdminActionForm
                endpoint="/api/pressay/admin/members"
                title={t.add.title}
                description={t.add.description}
                submitLabel={t.add.submit}
                confirmMessage={t.add.confirm}
                fields={[
                  { name: "email", label: t.add.email, type: "email", required: true },
                  {
                    name: "role",
                    label: t.add.role,
                    type: "select",
                    value: "support",
                    options: roleOptions,
                  },
                  { name: "reason", label: t.add.reason, required: true },
                ]}
              />
              <article className="admin-action">
                <div>
                  <h3>{t.rules.title}</h3>
                  {roles.map((role) => (
                    <p key={role}>
                      <strong>{t.roles[role]}</strong> — {t.roleDetails[role]}
                    </p>
                  ))}
                  <p>{t.rules.lastOwner}</p>
                  <p>{t.rules.recovery}</p>
                </div>
              </article>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
