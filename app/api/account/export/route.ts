import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/request-origin";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";
import { getWebIdentity } from "@/lib/server-identity";

/**
 * Self-service copy of the account's Cloud data (GDPR art. 15 and 20). The
 * generic browser proxy never relays `me/*`; this route only reads, for the
 * signed-in session, and hands the file over as a download.
 */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: { code: "invalid_origin" } },
      { status: 403 },
    );
  if (!commercialIsConfigured())
    return NextResponse.json(
      { error: { code: "commercial_beta_not_configured" } },
      { status: 503 },
    );
  if (!(await getWebIdentity()))
    return NextResponse.json(
      { error: { code: "authentication_required" } },
      { status: 401 },
    );
  const response = await pressayAPI("me/export", {}, { bootstrap: true });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string };
      requestId?: string;
    } | null;
    return NextResponse.json(
      {
        error: { code: payload?.error?.code ?? "export_unavailable" },
        requestId: payload?.requestId ?? response.headers.get("x-request-id"),
      },
      { status: response.status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(await response.text(), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pressay-export-${day}.json"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
