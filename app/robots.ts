import type { MetadataRoute } from "next";

const SITE_URL = "https://phantomtracker.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private/app areas aren't useful in search results.
        disallow: ["/api/", "/dashboard", "/habits", "/stats", "/settings", "/account/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
