import { cache } from "react";

const repository = "YoannDrx/pressay";
const fallbackTag = "v2.0.0-beta.3";

export type PublicRelease = {
  tag: string;
  dmgURL: string;
  checksumURL: string;
  prerelease: boolean;
};

export type WindowsInstaller = {
  exeURL: string;
  checksumURL: string;
};

export type WindowsRelease = {
  tag: string;
  prerelease: boolean;
  x64: WindowsInstaller;
  arm64: WindowsInstaller;
};

type GitHubRelease = {
  tag_name?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: Array<{ name: string; browser_download_url: string }>;
};

/**
 * One GitHub request serves the Mac and Windows lookups: React memoizes it for
 * the render and Next caches the response for 60 s. Null when GitHub fails.
 */
const fetchReleases = cache(async (): Promise<GitHubRelease[] | null> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=20`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) return null;
    const releases = await response.json() as GitHubRelease[];
    return Array.isArray(releases) ? releases : null;
  } catch {
    return null;
  }
});

/**
 * The public download is the newest stable release carrying every named
 * asset. A prerelease is only served while no such stable release exists.
 */
function newestComplete(releases: GitHubRelease[], names: string[]): GitHubRelease | undefined {
  const complete = releases.filter((candidate) =>
    !candidate.draft &&
    names.every((name) => candidate.assets?.some((asset) => asset.name === name))
  );
  return complete.find((candidate) => candidate.prerelease !== true) ?? complete[0];
}

function assetURL(release: GitHubRelease, name: string): string | undefined {
  return release.assets?.find((asset) => asset.name === name)?.browser_download_url;
}

export async function getPublicRelease(): Promise<PublicRelease> {
  const releases = await fetchReleases();
  if (!releases) return fallbackRelease();
  const release = newestComplete(releases, ["Pressay.dmg", "Pressay.dmg.sha256"]);
  if (!release) return fallbackRelease();
  const dmgURL = assetURL(release, "Pressay.dmg");
  const checksumURL = assetURL(release, "Pressay.dmg.sha256");
  if (!release.tag_name || !dmgURL || !checksumURL) return fallbackRelease();
  return {
    tag: release.tag_name,
    dmgURL,
    checksumURL,
    prerelease: release.prerelease === true
  };
}

const windowsAssets = {
  x64: "Pressay-windows-x64.exe",
  arm64: "Pressay-windows-arm64.exe"
} as const;

/**
 * Newest release shipping both Windows installers and their checksums, or null.
 * There is deliberately no fallback: the site never advertises a Windows
 * download that GitHub does not confirm.
 */
export async function getWindowsRelease(): Promise<WindowsRelease | null> {
  const releases = await fetchReleases();
  if (!releases) return null;
  const names = Object.values(windowsAssets).flatMap((name) => [name, `${name}.sha256`]);
  const release = newestComplete(releases, names);
  if (!release?.tag_name) return null;
  const installer = (name: string): WindowsInstaller | null => {
    const exeURL = assetURL(release, name);
    const checksumURL = assetURL(release, `${name}.sha256`);
    return exeURL && checksumURL ? { exeURL, checksumURL } : null;
  };
  const x64 = installer(windowsAssets.x64);
  const arm64 = installer(windowsAssets.arm64);
  if (!x64 || !arm64) return null;
  return { tag: release.tag_name, prerelease: release.prerelease === true, x64, arm64 };
}

function fallbackRelease(): PublicRelease {
  // Keep the public install path usable if GitHub's release API is degraded.
  // This tag must reference an asset whose downloaded DMG has passed the
  // Gatekeeper, stapler and checksum release gate.
  const tag = fallbackTag;
  return {
    tag,
    dmgURL: `https://github.com/${repository}/releases/download/${tag}/Pressay.dmg`,
    checksumURL: `https://github.com/${repository}/releases/download/${tag}/Pressay.dmg.sha256`,
    prerelease: true
  };
}
