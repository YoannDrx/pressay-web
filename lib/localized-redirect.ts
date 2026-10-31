import { NextRequest, NextResponse } from "next/server";
import { localeCookie, preferredLocale } from "@/lib/preferred-locale";

export function redirectToLocalizedPath(
  request: NextRequest,
  path: string,
): NextResponse {
  const locale = preferredLocale({
    cookie: request.cookies.get(localeCookie)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    userAgent: request.headers.get("user-agent"),
    // These links come from the app and from emails; keep their historical
    // English default for unknown languages.
    fallback: "en",
  });
  const response = NextResponse.redirect(
    new URL(`/${locale}/${path}`, request.url),
    307,
  );
  response.headers.set("Vary", "Accept-Language, Cookie");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
