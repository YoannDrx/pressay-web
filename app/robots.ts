import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/api/",
        "/access/",
        "/auth/",
        "/checkout/",
        "/oauth/",
        "/sign-in",
        "/sign-up",
        "/user-profile",
      ],
    },
    sitemap: "https://press-say.app/sitemap.xml",
    host: "https://press-say.app",
  };
}
