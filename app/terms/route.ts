import { NextRequest } from "next/server";
import { redirectToLocalizedPath } from "@/lib/localized-redirect";

export function GET(request: NextRequest) {
  return redirectToLocalizedPath(request, "terms");
}
