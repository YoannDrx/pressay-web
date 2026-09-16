import { sameOrigin } from "@/lib/request-origin";
import { NextResponse } from "next/server";
import { pressayAPI } from "@/lib/pressay-api";

const allowedPrefixes = [
  "admin/",
  "access/",
  "referrals/",
  "devices/",
  "billing/",
  "entitlements",
  "me",
];

async function forward(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request))
    return NextResponse.json(
      { error: { code: "invalid_origin" } },
      { status: 403 },
    );
  const { path } = await context.params;
  if (path.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment)))
    return NextResponse.json({ error: "route_not_allowed" }, { status: 404 });
  const target = path.join("/");
  // This mutation accepts only the verified cookie through /api/referral/attribute
  // or Checkout. The generic proxy must not accept a client-selected timestamp.
  if (
    target.startsWith("referrals/") &&
    !["GET", "HEAD"].includes(request.method)
  )
    return NextResponse.json(
      { error: "signed_referral_required" },
      { status: 403 },
    );
  if (
    !allowedPrefixes.some(
      (prefix) => target === prefix || target.startsWith(prefix),
    )
  ) {
    return NextResponse.json({ error: "route_not_allowed" }, { status: 404 });
  }
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();
  const response = await pressayAPI(`${target}${new URL(request.url).search}`, {
    method: request.method,
    headers: body
      ? {
          "Content-Type":
            request.headers.get("Content-Type") ?? "application/json",
        }
      : undefined,
    body,
  });
  const responseBody = [204, 205, 304].includes(response.status)
    ? null
    : await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers:
      responseBody === null
        ? undefined
        : {
            "Cache-Control": "private, no-store",
            "Content-Type":
              response.headers.get("Content-Type") ?? "application/json",
          },
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
