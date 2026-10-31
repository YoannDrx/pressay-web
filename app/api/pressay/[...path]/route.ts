import { sameOrigin } from "@/lib/request-origin";
import { NextResponse } from "next/server";
import { pressayAPI } from "@/lib/pressay-api";
import { proxyRoute } from "@/lib/pressay-proxy-routes";

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
  const route = proxyRoute(request.method, path);
  if (!route.allowed)
    return NextResponse.json({ error: route.error }, { status: route.status });
  const target = route.target;
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
