import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { identityProvider } from "@/lib/auth-env";

// Public pages and their browser tests must keep working in environments where
// Clerk is intentionally not configured. Protected pages still call auth()
// themselves and fail closed when Clerk is enabled.
export default identityProvider() === "clerk"
  ? clerkMiddleware()
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)"
  ]
};
