import type { MetadataRoute } from "next";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jackhunter.com"
).replace(/\/$/, "");

/** Gated portal sub-routes, kept out of the index. */
const GATED_SEGMENTS = [
  "dashboard",
  "portfolio",
  "investments",
  "products",
  "documents",
  "resources",
  "requests",
  "profile",
  "admin",
  "onboarding",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep API endpoints and the authenticated portal workspace out of the
      // index (the public portal landing at /{locale}{INVESTMENT_BASE_PATH}
      // stays crawlable; its gated sub-routes do not).
      disallow: [
        "/api/",
        ...GATED_SEGMENTS.map(
          (segment) => `/*${INVESTMENT_BASE_PATH}/${segment}`,
        ),
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
