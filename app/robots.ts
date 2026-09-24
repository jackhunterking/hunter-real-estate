import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://huntergroupremax.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep API endpoints out of the index.
      disallow: ["/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
