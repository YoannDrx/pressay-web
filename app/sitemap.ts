import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/pricing", "/security", "/download", "/legal", "/privacy", "/terms", "/cookies", "/support", "/withdrawal"];
  return (["fr", "en"] as const).flatMap((locale) => routes.map((route) => ({ url: `https://press-say.app/${locale}${route}`, changeFrequency: route === "" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : 0.7, alternates: { languages: { fr: `https://press-say.app/fr${route}`, en: `https://press-say.app/en${route}` } } })));
}
