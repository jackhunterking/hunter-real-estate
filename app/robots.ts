import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jackhunter.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep API endpoints and the authenticated advisory workspace out of the
      // index (the public advisory landing at /{locale}/hunter-advisory stays
      // crawlable; its gated sub-routes do not).
      disallow: [
        "/api/",
        "/*/hunter-advisory/dashboard",
        "/*/hunter-advisory/portfolio",
        "/*/hunter-advisory/investments",
        "/*/hunter-advisory/products",
        "/*/hunter-advisory/documents",
        "/*/hunter-advisory/resources",
        "/*/hunter-advisory/requests",
        "/*/hunter-advisory/profile",
        "/*/hunter-advisory/admin",
        "/*/hunter-advisory/onboarding",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
