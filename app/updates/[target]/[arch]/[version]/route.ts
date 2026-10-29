import {
  channelForVersion,
  compareVersions,
  getUpdateManifest,
  isValidVersion,
} from "@/lib/updater";

const targets = new Set(["darwin", "windows", "linux"]);
const architectures = new Set(["aarch64", "x86_64", "i686", "armv7"]);

// Tauri updater endpoint: {{target}}/{{arch}}/{{current_version}}.
// 204 tells the client it is up to date.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ target: string; arch: string; version: string }> },
) {
  const { target, arch, version } = await params;
  if (!targets.has(target) || !architectures.has(arch) || !isValidVersion(version))
    return new Response(null, { status: 404 });
  const manifest = await getUpdateManifest(channelForVersion(version));
  if (!manifest)
    return new Response(null, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "300" },
    });
  const cache = { "Cache-Control": "public, max-age=60, s-maxage=300" };
  if (
    !manifest.platforms[`${target}-${arch}`] ||
    compareVersions(manifest.version, version) <= 0
  )
    return new Response(null, { status: 204, headers: cache });
  return Response.json(manifest, { headers: cache });
}
