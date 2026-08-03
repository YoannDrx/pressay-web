const repository = "YoannDrx/pressay";

export type PublicRelease = {
  tag: string;
  dmgURL: string;
  checksumURL: string;
};

export async function getPublicRelease(): Promise<PublicRelease> {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
    next: { revalidate: 300 }
  });
  if (!response.ok) {
    return fallbackRelease();
  }
  const release = await response.json() as {
    tag_name?: string;
    assets?: Array<{ name: string; browser_download_url: string }>;
  };
  const dmg = release.assets?.find((asset) => asset.name === "Pressay.dmg");
  const checksum = release.assets?.find((asset) => asset.name === "Pressay.dmg.sha256");
  if (!release.tag_name || !dmg || !checksum) return fallbackRelease();
  return {
    tag: release.tag_name,
    dmgURL: dmg.browser_download_url,
    checksumURL: checksum.browser_download_url
  };
}

function fallbackRelease(): PublicRelease {
  return {
    tag: "v1.2.2",
    dmgURL: `https://github.com/${repository}/releases/latest/download/Pressay.dmg`,
    checksumURL: `https://github.com/${repository}/releases/latest/download/Pressay.dmg.sha256`
  };
}
