const repository = "YoannDrx/pressay";
const releaseDownloadPrefix = `https://github.com/${repository}/releases/download/`;
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export type UpdateChannel = "stable" | "beta";

export type UpdateManifest = {
  version: string;
  notes?: string;
  pub_date?: string;
  platforms: Record<string, { url: string; signature: string }>;
};

type GitHubRelease = {
  tag_name?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: Array<{ name: string; browser_download_url: string }>;
};

/**
 * Clients on a prerelease keep receiving betas until a newer stable ships;
 * clients on a stable release only ever move to another stable release.
 */
export function channelForVersion(currentVersion: string): UpdateChannel {
  return currentVersion.includes("-") ? "beta" : "stable";
}

/**
 * Returns the newest published `latest.json` for the channel, or null when
 * GitHub is unavailable or no release carries a valid signed manifest.
 */
export async function getUpdateManifest(
  channel: UpdateChannel,
): Promise<UpdateManifest | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/releases?per_page=20`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!response.ok) return null;
    const releases = (await response.json()) as GitHubRelease[];
    if (!Array.isArray(releases)) return null;
    const release = releases.find(
      (candidate) =>
        !candidate.draft &&
        (channel === "beta" || candidate.prerelease !== true) &&
        candidate.assets?.some((asset) => asset.name === "latest.json"),
    );
    const asset = release?.assets?.find((item) => item.name === "latest.json");
    if (!release?.tag_name || !asset) return null;
    if (!asset.browser_download_url.startsWith(releaseDownloadPrefix))
      return null;
    const manifestResponse = await fetch(asset.browser_download_url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!manifestResponse.ok) return null;
    return parseManifest(await manifestResponse.json(), release.tag_name);
  } catch {
    return null;
  }
}

/** Keeps only signed archives hosted on this repository's release downloads. */
export function parseManifest(
  value: unknown,
  tag: string,
): UpdateManifest | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.version !== "string") return null;
  const version = raw.version.replace(/^v/, "");
  if (!versionPattern.test(version) || `v${version}` !== tag) return null;
  if (!raw.platforms || typeof raw.platforms !== "object") return null;
  const platforms: UpdateManifest["platforms"] = {};
  for (const [key, entry] of Object.entries(raw.platforms)) {
    if (!entry || typeof entry !== "object") continue;
    const { url, signature } = entry as Record<string, unknown>;
    if (typeof url !== "string" || typeof signature !== "string") continue;
    if (!url.startsWith(`${releaseDownloadPrefix}${tag}/`)) continue;
    if (signature.trim() === "") continue;
    platforms[key] = { url, signature };
  }
  if (Object.keys(platforms).length === 0) return null;
  return {
    version,
    ...(typeof raw.notes === "string" ? { notes: raw.notes } : {}),
    ...(typeof raw.pub_date === "string" ? { pub_date: raw.pub_date } : {}),
    platforms,
  };
}

/** Semantic-version order, including prerelease identifiers. */
export function compareVersions(left: string, right: string): number {
  const [leftCore, leftPre] = splitVersion(left);
  const [rightCore, rightPre] = splitVersion(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftCore[index] ?? 0) - (rightCore[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  if (!leftPre.length || !rightPre.length)
    return leftPre.length === rightPre.length ? 0 : leftPre.length ? -1 : 1;
  for (let index = 0; index < Math.max(leftPre.length, rightPre.length); index += 1) {
    const a = leftPre[index];
    const b = rightPre[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) {
      const difference = Number(a) - Number(b);
      if (difference !== 0) return Math.sign(difference);
    } else if (aNumeric !== bNumeric) {
      return aNumeric ? -1 : 1;
    } else if (a !== b) {
      return a < b ? -1 : 1;
    }
  }
  return 0;
}

function splitVersion(version: string): [number[], string[]] {
  const normalized = version.replace(/^v/, "");
  const separator = normalized.indexOf("-");
  const core = separator === -1 ? normalized : normalized.slice(0, separator);
  const pre = separator === -1 ? "" : normalized.slice(separator + 1);
  return [core.split(".").map(Number), pre ? pre.split(".") : []];
}

export function isValidVersion(version: string): boolean {
  return versionPattern.test(version);
}
