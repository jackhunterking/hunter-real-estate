import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jackhunter.com"
).replace(/\/$/, "");


export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The investor portal moved to its own app and domain.
      disallow: ["/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
