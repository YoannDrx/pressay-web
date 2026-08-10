import { NextResponse } from "next/server";
import { pressayAPI } from "@/lib/pressay-api";

const allowedPrefixes = ["admin/", "access/", "referrals/", "devices/", "billing/", "entitlements", "me"];

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = path.join("/");
  if (!allowedPrefixes.some((prefix) => target === prefix || target.startsWith(prefix))) {
    return NextResponse.json({ error: "route_not_allowed" }, { status: 404 });
  }
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  const response = await pressayAPI(`${target}${new URL(request.url).search}`, {
    method: request.method,
    headers: body ? { "Content-Type": request.headers.get("Content-Type") ?? "application/json" } : undefined,
    body
  });
  const responseBody = [204, 205, 304].includes(response.status) ? null : await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseBody === null ? undefined : { "Content-Type": response.headers.get("Content-Type") ?? "application/json" }
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
