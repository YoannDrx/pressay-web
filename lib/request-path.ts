/**
 * Paths no Pressay route can ever serve: backslashes, NUL bytes, encoded
 * slashes and undecodable escapes. Rejecting them before routing turns crafted
 * URLs such as `/download/pressay%5C%5C%5C` into a cached 404 instead of a
 * server render that can fail with a 500.
 */
export function isMalformedPath(pathname: string): boolean {
  if (/\\|%5c|%00|%2f|\u0000/i.test(pathname)) return true;
  try {
    const decoded = decodeURIComponent(pathname);
    return /\\|\u0000/.test(decoded);
  } catch {
    return true;
  }
}
