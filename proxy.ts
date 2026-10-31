import { NextRequest, NextResponse } from "next/server";
import { contentSecurityPolicy } from "@/lib/content-security-policy";
import { isMalformedPath } from "@/lib/request-path";
import { localeCookie, preferredLocale } from "@/lib/preferred-locale";

// Locale-less entry points and their localized page. Localized URLs such as
// /fr/pricing are never redirected, so shared links and crawlers keep the
// language they point to.
const localeLessEntries: Record<string, string> = { "/": "", "/download": "/download" };

export default function proxy(request: NextRequest) {
  if (isMalformedPath(request.nextUrl.pathname))
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  const entry = localeLessEntries[request.nextUrl.pathname];
  if (entry !== undefined) {
    const requested = request.nextUrl.searchParams.get("locale");
    const locale = preferredLocale({
      cookie:
        requested === "fr" || requested === "en"
          ? requested
          : request.cookies.get(localeCookie)?.value,
      acceptLanguage: request.headers.get("accept-language"),
      userAgent: request.headers.get("user-agent"),
    });
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}${entry}`;
    target.searchParams.delete("locale");
    const response = NextResponse.redirect(target, 307);
    response.headers.set("Vary", "Accept-Language, Cookie");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  // A fresh nonce per request lets Next.js mark its own inline bootstrap
  // scripts as trusted, so script-src no longer needs 'unsafe-inline'.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === "development",
  });
  const headers = new Headers(request.headers);
  headers.set(
    "x-pressay-path",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  const locale =
    request.nextUrl.pathname.match(/^\/(fr|en)(?:\/|$)/)?.[1] ??
    request.nextUrl.searchParams.get("locale");
  if (locale === "fr" || locale === "en")
    response.cookies.set(localeCookie, locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 31536000,
      secure: request.nextUrl.protocol === "https:",
    });
  if (
    /^\/(account|admin|access|user-profile)(\/|$)/.test(
      request.nextUrl.pathname,
    )
  )
    response.headers.set("Cache-Control", "private, no-store");
  if (request.nextUrl.pathname.startsWith("/access/"))
    response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = {
  matcher: [
    // Everything except immutable build assets and the image optimizer, so
    // every HTML document and public file carries the per-request policy.
    "/((?!_next/static|_next/image).*)",
  ],
};
