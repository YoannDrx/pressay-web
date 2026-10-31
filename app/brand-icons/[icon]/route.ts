import { brandIconFiles, brandIconSVG } from "@/lib/brand-icons";

// Built once and served from the CDN: only the marquee icons exist.
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return brandIconFiles().map((icon) => ({ icon }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ icon: string }> },
) {
  const svg = brandIconSVG((await params).icon);
  if (!svg) return new Response("Not Found", { status: 404 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
