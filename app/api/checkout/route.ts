import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiURL = process.env.PRESSAY_API_URL;
  if (!apiURL || !process.env.CLERK_SECRET_KEY) return NextResponse.json({ error: "commercial_beta_not_configured" }, { status: 503 });
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const token = await getToken({ template: "pressay-api" });
  if (!token) return NextResponse.json({ error: "api_token_unavailable" }, { status: 401 });
  const bootstrap = await fetch(`${apiURL}/accounts/bootstrap`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!bootstrap.ok && bootstrap.status !== 409) {
    return new NextResponse(await bootstrap.text(), {
      status: bootstrap.status,
      headers: { "Content-Type": "application/json" }
    });
  }
  const input = await request.json() as { plan?: string; interval?: string };
  const response = await fetch(`${apiURL}/billing/checkout`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input), cache: "no-store" });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
}
