/**
 * Next answers HEAD with a route's GET handler, and router prefetches or RSC
 * fetches reach it too; none of them downloads an installer, so none is counted.
 */
export function isRealDownload(request: Request): boolean {
  const headers = request.headers;
  return (
    request.method === "GET" &&
    !headers.has("rsc") &&
    !headers.has("next-router-prefetch") &&
    headers.get("purpose") !== "prefetch" &&
    headers.get("sec-purpose")?.includes("prefetch") !== true
  );
}
