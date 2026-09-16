import { sameOrigin } from "@/lib/request-origin";
import { NextResponse } from "next/server";
import { commercialIsConfigured, pressayAPI } from "@/lib/pressay-api";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: { code: "invalid_origin" } },
      { status: 403 },
    );
  if (!commercialIsConfigured())
    return NextResponse.json(
      { error: "commercial_beta_not_configured" },
      { status: 503 },
    );
  const response = await pressayAPI("billing/portal", { method: "POST" });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
