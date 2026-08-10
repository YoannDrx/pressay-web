import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public pages and their browser tests must keep working in environments where
// Clerk is intentionally not configured. Protected pages still call auth()
// themselves and fail closed when Clerk is enabled.
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware()
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)"
  ]
};
