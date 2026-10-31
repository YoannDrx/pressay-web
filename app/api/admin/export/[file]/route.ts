import { NextResponse } from "next/server";
import { exportRequest } from "@/lib/admin-analytics";
import { sameOrigin } from "@/lib/request-origin";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";

const noStore = { "Cache-Control": "private, no-store" };

function refuse(status: number, code: string) {
  return NextResponse.json({ error: { code } }, { status, headers: noStore });
}

/**
 * CSV of one aggregate metric (`churn.csv?months=12`, `downloads.csv?days=30`).
 * The request is validated here, then the Cloud checks the role and the
 * ten-minute step-up, rate limits and audits the export; this route only hands
 * the file over as a download.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ file: string }> },
): Promise<Response> {
  if (!sameOrigin(request)) return refuse(403, "invalid_origin");
  if (!commercialIsConfigured()) return refuse(503, "not_configured");
  const { file } = await context.params;
  const target = exportRequest(file, new URL(request.url).searchParams);
  if (!target) return refuse(422, "invalid_export");
  const response = await pressayAPI(
    `admin/export/${target.dataset}.csv?${target.query}`,
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    return refuse(response.status, payload?.error?.code ?? "export_unavailable");
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename =
    /^attachment; filename="(pressay-[a-z]+-\d{4}-\d{2}-\d{2}\.csv)"$/.exec(
      disposition,
    )?.[1] ?? `pressay-${target.dataset}.csv`;
  return new NextResponse(await response.text(), {
    status: 200,
    headers: {
      ...noStore,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
