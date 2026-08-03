import { getPublicRelease } from "@/lib/release";
export async function GET() { const release = await getPublicRelease(); return Response.redirect(release.dmgURL, 307); }
