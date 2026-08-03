import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const apiURL = process.env.PRESSAY_API_URL;
  if (!apiURL || !process.env.CLERK_SECRET_KEY) return NextResponse.json({ error: "commercial_beta_not_configured" }, { status: 503 });
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const token = await getToken();
  const response = await fetch(`${apiURL}/billing/portal`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
}
