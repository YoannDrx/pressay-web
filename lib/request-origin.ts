export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const url = new URL(request.url);
  const host = request.headers.get("host");
  return origin === (host ? `${url.protocol}//${host}` : url.origin);
}
