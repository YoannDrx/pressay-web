import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const locale = request.headers
    .get("accept-language")
    ?.toLowerCase()
    .startsWith("fr")
    ? "fr"
    : "en";
  return NextResponse.redirect(
    new URL(`/${locale}/support/secure-input`, request.url),
    307,
  );
}
