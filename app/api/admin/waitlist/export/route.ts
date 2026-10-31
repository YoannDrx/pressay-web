import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/request-origin";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";
import { waitlistPlatforms, type WaitlistPlatform } from "@/lib/waitlist-input";

const noStore = { "Cache-Control": "private, no-store" };

/**
 * CSV of a platform waitlist. The Cloud checks the owner role and the
 * ten-minute step-up and audits the export; this route only hands the file
 * over as a download.
 */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: { code: "invalid_origin" } },
      { status: 403, headers: noStore },
    );
  if (!commercialIsConfigured())
    return NextResponse.json(
      { error: { code: "not_configured" } },
      { status: 503, headers: noStore },
    );
  const platform = new URL(request.url).searchParams.get("platform");
  if (!waitlistPlatforms.includes(platform as WaitlistPlatform))
    return NextResponse.json(
      { error: { code: "invalid_platform" } },
      { status: 422, headers: noStore },
    );
  const response = await pressayAPI(`admin/waitlist/export?platform=${platform}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    return NextResponse.json(
      { error: { code: payload?.error?.code ?? "export_unavailable" } },
      { status: response.status, headers: noStore },
    );
  }
  return new NextResponse(await response.text(), {
    status: 200,
    headers: {
      ...noStore,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pressay-waitlist-${platform}.csv"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
