import { randomUUID } from "node:crypto";
import { after } from "next/server";
import {
  downloadLabel,
  reportDownload,
  type DownloadEvent,
} from "@/lib/download-event";
import { isRealDownload } from "@/lib/download-request";
import { getPublicRelease } from "@/lib/release";
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
