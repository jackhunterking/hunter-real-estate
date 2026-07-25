import { defineRouting } from "next-intl/routing";
import type { Lang } from "@/lib/i18n/dictionaries";

/**
 * Canonical locale list for the whole site. Kept in sync with the translation
 * dictionaries in `lib/i18n/dictionaries.ts` (`Lang` = keyof dictionaries), so
 * adding a locale there and here is all that's needed for routing to pick it up.
 *
 * No market is privileged in the URL: `localePrefix: "always"` prefixes every
 * locale (including English), and there is no unprefixed default. `defaultLocale`
 * only serves as the neutral fallback for unknown `Accept-Language` values and as
 * the `x-default` hreflang target for SEO.
 */
export const locales: Lang[] = ["tr", "en", "fr", "es"];
export const defaultLocale: Lang = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every locale is prefixed (/en, /tr, /fr, /es) — equal-weight markets.
  localePrefix: "always",
  // Negotiate the visitor's device/browser language (Accept-Language) on first
  // visit, then persist their choice via the NEXT_LOCALE cookie.
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];
