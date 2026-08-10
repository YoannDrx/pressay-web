import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { commercialCheckoutIsEnabled, pressayAPI } from "@/lib/pressay-api";

export async function POST(request: Request) {
  if (!commercialCheckoutIsEnabled()) return NextResponse.json({ error: "commercial_launch_not_enabled" }, { status: 503 });
  const input = await request.json() as { plan?: string; interval?: string; acceptedTerms?: boolean; immediatePerformanceConsent?: boolean; termsVersion?: string };
  const checkoutInput = { ...input, idempotencyKey: randomUUID() };
  const response = await pressayAPI("billing/checkout", {
    method: "POST",
    body: JSON.stringify(checkoutInput)
  }, { bootstrap: true });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
}
