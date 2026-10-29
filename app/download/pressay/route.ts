import { randomUUID } from "node:crypto";
import { after } from "next/server";
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
  const anonymousID = randomUUID();
  const apiURL = process.env.PRESSAY_API_URL?.replace(/\/+$/, "");
  if (apiURL && isRealDownload(request)) {
    const base = apiURL.endsWith("/v1") ? apiURL : `${apiURL}/v1`;
    const sourceURL = new URL(request.url);
    after(async () => {
      await fetch(`${base}/downloads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonymousID, assetType: "dmg", appVersion: release.tag.replace(/^v/, ""), source: sourceURL.searchParams.get("utm_source") ?? "website", campaign: sourceURL.searchParams.get("utm_campaign") ?? undefined, referralCode: sourceURL.searchParams.get("ref") ?? undefined }), cache: "no-store" }).catch(() => undefined);
    });
  }
  return Response.redirect(release.dmgURL, 307);
}
