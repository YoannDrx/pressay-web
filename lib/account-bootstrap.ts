export type BootstrapFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Create the browser account without consuming a Mac device slot. During the
 * controlled Cloud cutover, a 404 is the only signal that permits the legacy
 * endpoint fallback; validation and server failures remain authoritative.
 */
export async function bootstrapWebAccount(
  baseURL: string,
  headers: Headers,
  fetcher: BootstrapFetch = fetch,
): Promise<Response> {
  const init: RequestInit = { method: "POST", headers, cache: "no-store" };
  const modern = await fetcher(`${baseURL}/accounts/web-bootstrap`, init);
  if (modern.status !== 404) return modern;
  return fetcher(`${baseURL}/accounts/bootstrap`, init);
}
