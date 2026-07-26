import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { INTENTS } from "@/lib/mortgage/intents";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jackhunter.com"
).replace(/\/$/, "");

/**
 * Public, indexable routes (locale-agnostic, no leading locale). The investor
 * portal has its own app, domain and sitemap.
 * Each path below is emitted once per locale with a full hreflang
 * alternates cluster (every locale + `x-default` → the default locale) so search
 * engines index and cross-link all four language versions.
 */
const PUBLIC_PATHS: string[] = [
  "", // home
  "/rehber/alici",
  "/rehber/satici",
  "/rehber/ogren",
  "/mortgage",
  "/mortgage/araclar",
  "/mortgage/oranlar",
  ...INTENTS.map((intent) => `/mortgage/${intent}`),
  "/gizlilik",
  "/kullanim-kosullari",
  "/reklam-aciklamasi",
];

function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${BASE_URL}/${locale}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/${routing.defaultLocale}${path}`;
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      alternates: { languages: languagesFor(path) },
    })),
  );
}
