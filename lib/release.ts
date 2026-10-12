const repository = "YoannDrx/pressay";
const fallbackTag = "v2.0.0-beta.3";

export type PublicRelease = {
  tag: string;
  dmgURL: string;
  checksumURL: string;
  prerelease: boolean;
};

export async function getPublicRelease(): Promise<PublicRelease> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=20`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) {
      return fallbackRelease();
    }
    const releases = await response.json() as Array<{
      tag_name?: string;
      draft?: boolean;
      prerelease?: boolean;
      assets?: Array<{ name: string; browser_download_url: string }>;
    }>;
    if (!Array.isArray(releases)) return fallbackRelease();
    const complete = releases.filter((candidate) =>
      !candidate.draft &&
      candidate.assets?.some((asset) => asset.name === "Pressay.dmg") &&
      candidate.assets?.some((asset) => asset.name === "Pressay.dmg.sha256")
    );
    // The public download is the newest stable release. A prerelease is only
    // served while no stable release exists, and is labelled as a beta.
    const release =
      complete.find((candidate) => candidate.prerelease !== true) ?? complete[0];
    if (!release) return fallbackRelease();
    const dmg = release.assets?.find((asset) => asset.name === "Pressay.dmg");
    const checksum = release.assets?.find((asset) => asset.name === "Pressay.dmg.sha256");
    if (!release.tag_name || !dmg || !checksum) return fallbackRelease();
    return {
      tag: release.tag_name,
      dmgURL: dmg.browser_download_url,
      checksumURL: checksum.browser_download_url,
      prerelease: release.prerelease === true
    };
  } catch {
    return fallbackRelease();
  }
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
