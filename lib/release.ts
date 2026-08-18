const repository = "YoannDrx/pressay";

export type PublicRelease = {
  tag: string;
  dmgURL: string;
  checksumURL: string;
  prerelease: boolean;
};

export async function getPublicRelease(): Promise<PublicRelease> {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=20`, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store"
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
  const release = releases.find((candidate) =>
    !candidate.draft &&
    candidate.assets?.some((asset) => asset.name === "Pressay.dmg") &&
    candidate.assets?.some((asset) => asset.name === "Pressay.dmg.sha256")
  );
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
}

function fallbackRelease(): PublicRelease {
  const tag = "v2.0.0-beta.1";
  return {
    tag,
    dmgURL: `https://github.com/${repository}/releases/download/${tag}/Pressay.dmg`,
    checksumURL: `https://github.com/${repository}/releases/download/${tag}/Pressay.dmg.sha256`,
    prerelease: true
  };
}
