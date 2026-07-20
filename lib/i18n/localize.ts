import type { Lang } from "./dictionaries";

/**
 * Any object carrying per-locale strings. `tr`/`en` are required (authored
 * source of truth); `fr`/`es` are optional machine translations.
 */
export type Localized = { tr: string; en: string; fr?: string; es?: string };

/**
 * Resolve a localized content string for the active UI language, falling back
 * to English (then Turkish) when the requested locale is not present. This lets
 * `fr`/`es` be filled in progressively without breaking any read site: an
 * untranslated field simply renders in English.
 */
export function tx(text: Localized | null | undefined, lang: Lang): string {
  if (!text) return "";
  return text[lang] ?? text.en ?? text.tr;
}

/**
 * Resolve a per-locale block (e.g. a component's `{ tr, en, fr?, es? }` copy
 * object) for the active UI language, falling back to English (then Turkish)
 * when the requested locale is not present. Lets `fr`/`es` variants be added to
 * a copy block later without touching the read site.
 */
export function pick<M extends { tr: unknown; en: unknown }>(
  map: M,
  lang: Lang,
): M["en"] {
  const m = map as Record<string, M["en"]>;
  return m[lang] ?? m.en ?? (map.tr as M["en"]);
}
