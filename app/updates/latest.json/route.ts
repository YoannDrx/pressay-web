import { getUpdateManifest } from "@/lib/updater";

// Every public beta (2.0.0-beta.1 to beta.4) was built against
// https://updates.press-say.app/latest.json, so this static path must keep
// answering with the newest signed manifest, betas included.
export async function GET() {
  const manifest = await getUpdateManifest("beta");
  if (!manifest)
    return new Response(null, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "300" },
    });
  return Response.json(manifest, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
