import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { identityProvider } from "@/lib/auth-env";

// Public pages and their browser tests must keep working in environments where
// Clerk is intentionally not configured. Protected pages still call auth()
// themselves and fail closed when Clerk is enabled.
export default identityProvider() === "clerk"
  ? clerkMiddleware()
  : (request: NextRequest) => {
      const headers = new Headers(request.headers);
      headers.set(
        "x-pressay-path",
        request.nextUrl.pathname + request.nextUrl.search,
      );
      const response = NextResponse.next({ request: { headers } });
      const locale =
        request.nextUrl.pathname.match(/^\/(fr|en)(?:\/|$)/)?.[1] ??
        request.nextUrl.searchParams.get("locale");
      if (locale === "fr" || locale === "en")
        response.cookies.set("pressay_locale", locale, {
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
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
