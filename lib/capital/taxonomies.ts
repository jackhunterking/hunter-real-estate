import { tx } from "@/lib/i18n/localize";
import type { Lang, LocalizedText } from "./types";

/**
 * Classification taxonomies (strategy / asset class / region) are stored in
 * Supabase (`app.taxonomies`, exposed as `api.taxonomies`) so the back end
 * controls the labels and display colors. Values are fetched server-side via
 * `taxonomies-server.ts` and provided to the client through `TaxonomyProvider`.
 * This module only holds the shared types and pure lookup helpers.
 */
export type TaxonomyItem = { id: string; label: LocalizedText; color: string };

export type TaxonomySet = {
  strategies: TaxonomyItem[];
  assetClasses: TaxonomyItem[];
  regions: TaxonomyItem[];
};

export const EMPTY_TAXONOMIES: TaxonomySet = {
  strategies: [],
  assetClasses: [],
  regions: [],
};

export function taxonomyLabel(items: TaxonomyItem[], id: string, lang: Lang) {
  const item = items.find((item) => item.id === id);
  return item ? tx(item.label, lang) : id;
}

export function taxonomyColor(items: TaxonomyItem[], id: string, fallback = "#2f6f4f") {
  return items.find((item) => item.id === id)?.color ?? fallback;
}
