import { NextRequest, NextResponse } from "next/server";

export function redirectToLocalizedPath(
  request: NextRequest,
  path: string,
): NextResponse {
  const locale = request.headers
    .get("accept-language")
    ?.toLowerCase()
    .startsWith("fr")
    ? "fr"
    : "en";

  return NextResponse.redirect(new URL(`/${locale}/${path}`, request.url), 307);
}
