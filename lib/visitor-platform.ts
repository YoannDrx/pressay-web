import "server-only";

import { headers } from "next/headers";
import type { Platform } from "@/lib/content";

/**
 * Desktop system the visitor most likely uses, read from the request so the
 * download call to action renders right the first time (no client swap, no
 * layout shift). Anything that is not Windows (macOS, phones, crawlers) gets
 * macOS; the other platform always stays one click away.
 */
export async function visitorPlatform(): Promise<Platform> {
  const requestHeaders = await headers();
  // Reduced user agents still name the desktop system; the client hint only
  // fills in when the user agent is missing or generic.
  const userAgent = requestHeaders.get("user-agent") ?? "";
  if (/Windows NT/i.test(userAgent)) return "windows";
  if (/Macintosh|iPhone|iPad|Android|Linux/i.test(userAgent)) return "macos";
  const hint = requestHeaders.get("sec-ch-ua-platform")?.replaceAll('"', "").trim();
  return hint === "Windows" ? "windows" : "macos";
}
