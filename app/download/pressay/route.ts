import { randomUUID } from "node:crypto";
import { after } from "next/server";
import {
  downloadLabel,
  reportDownload,
  type DownloadEvent,
} from "@/lib/download-event";
import { getPublicRelease } from "@/lib/release";
/**
 * Next answers HEAD with this GET handler, and router prefetches or RSC
 * fetches reach it too; none of them downloads the DMG, so none is counted.
 */
function isRealDownload(request: Request): boolean {
  const headers = request.headers;
  return (
    request.method === "GET" &&
    !headers.has("rsc") &&
    !headers.has("next-router-prefetch") &&
    headers.get("purpose") !== "prefetch" &&
    headers.get("sec-purpose")?.includes("prefetch") !== true
  );
}
export async function GET(request: Request) {
  const release = await getPublicRelease();
  if (isRealDownload(request)) {
    const params = new URL(request.url).searchParams;
    const event: DownloadEvent = {
      anonymousID: randomUUID(),
      platform: "macos",
      assetType: "dmg",
      appVersion: release.tag.replace(/^v/, ""),
      source: downloadLabel(params.get("utm_source")) ?? "website",
      campaign: downloadLabel(params.get("utm_campaign")),
      referralCode: downloadLabel(params.get("ref")),
    };
    after(() => reportDownload(event));
  }
  return Response.redirect(release.dmgURL, 307);
}
