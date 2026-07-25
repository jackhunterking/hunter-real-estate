import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { dictionaries } from "@/lib/i18n/dictionaries";

/**
 * Server-side request configuration for next-intl. The existing translation
 * dictionaries (`lib/i18n/dictionaries.ts`) are reused verbatim as messages —
 * their nested key structure (`nav.home`, `home.hero.eyebrow`, ...) is exactly
 * what `useTranslations`/`getTranslations` consume, so no content conversion is
 * needed. Keeping them as typed TS modules preserves type-safety and the
 * `Dictionary = typeof tr` shape.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: dictionaries[locale],
  };
});
