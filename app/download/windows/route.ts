import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { after } from "next/server";
import {
  downloadLabel,
  reportDownload,
  type DownloadEvent,
} from "@/lib/download-event";
import { isRealDownload } from "@/lib/download-request";
import { getWindowsRelease } from "@/lib/release";
/**
 * An explicit ?arch wins; otherwise Chromium's architecture hint picks ARM64.
 * Everything else gets x64, which also runs emulated on Windows on ARM.
 */
function requestedArch(request: Request): "x64" | "arm64" {
  const arch = new URL(request.url).searchParams.get("arch");
  if (arch !== null) return arch === "arm64" ? "arm64" : "x64";
  const hint = request.headers.get("sec-ch-ua-arch")?.replaceAll('"', "");
  return hint === "arm" ? "arm64" : "x64";
}
export async function GET(request: Request) {
  const release = await getWindowsRelease();
  if (!release) {
    // No published Windows installer yet: send the visitor to the page that
    // says so instead of a dead link.
    const selected = (await cookies()).get("pressay_locale")?.value;
    const locale = selected === "en" ? "en" : "fr";
    return Response.redirect(
      new URL(`/${locale}/download#windows`, request.url),
      307,
    );
  }
  const arch = requestedArch(request);
  if (isRealDownload(request)) {
    const params = new URL(request.url).searchParams;
    const event: DownloadEvent = {
      anonymousID: randomUUID(),
      platform: "windows",
      assetType: "exe",
      appVersion: release.tag.replace(/^v/, ""),
      source: downloadLabel(params.get("utm_source")) ?? "website",
      campaign: downloadLabel(params.get("utm_campaign")),
      referralCode: downloadLabel(params.get("ref")),
    };
    after(() => reportDownload(event));
  }
  return Response.redirect(release[arch].exeURL, 307);
}
