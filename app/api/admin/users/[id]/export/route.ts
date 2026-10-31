import { NextResponse } from "next/server";
import { readAdminIdentity } from "@/lib/admin-identity";
import { isAccountId } from "@/lib/admin-sign-out";
import { sameOrigin } from "@/lib/request-origin";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";

const noStore = { "Cache-Control": "private, no-store" };

function refuse(status: number, code: string) {
  return NextResponse.json({ error: { code } }, { status, headers: noStore });
}

/**
 * Access request (GDPR art. 15): the Cloud export of an account, checked
 * (role, step-up) and audited by the Cloud, completed with the sign-in data
 * this site holds for the same person. Served as a JSON attachment.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!sameOrigin(request)) return refuse(403, "invalid_origin");
  if (!commercialIsConfigured()) return refuse(503, "not_configured");
  const { id } = await context.params;
  if (!isAccountId(id)) return refuse(422, "invalid_id");
  const accountId = id.toLowerCase();
  const response = await pressayAPI(
    `admin/users/${accountId}/export?include=identity`,
  );
  const cloud = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & { error?: { code?: string } })
    | null;
  if (!response.ok || !cloud)
    return refuse(
      response.ok ? 502 : response.status,
      cloud?.error?.code ?? "export_unavailable",
    );
  const subject =
    typeof cloud.identitySubject === "string" ? cloud.identitySubject : "";
  const identity = subject
    ? await readAdminIdentity({ account: { authUserId: subject } })
    : ({ status: "ok", exists: false } as const);
  const site =
    identity.status === "ok"
      ? { format: "pressay-web-identity/1", ...identity }
      : { format: "pressay-web-identity/1", status: identity.status };
  return new NextResponse(
    JSON.stringify({ ...cloud, site, exportedAt: new Date().toISOString() }, null, 2),
    {
      status: 200,
      headers: {
        ...noStore,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pressay-account-${accountId}.json"`,
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
