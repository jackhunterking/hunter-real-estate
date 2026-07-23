import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EMPTY_TAXONOMIES, type TaxonomyItem, type TaxonomySet } from "./taxonomies";

type Row = { kind: string; key: string; label: unknown; color: string };

function group(rows: Row[], kind: string): TaxonomyItem[] {
  return rows
    .filter((row) => row.kind === kind)
    .map((row) => ({ id: row.key, label: row.label as TaxonomyItem["label"], color: row.color }));
}

/** Reads classification taxonomies from Supabase (`api.taxonomies`). */
export async function getTaxonomies(): Promise<TaxonomySet> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return EMPTY_TAXONOMIES;

  const { data, error } = await supabase
    .from("taxonomies")
    .select("kind,key,label,color,sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data) return EMPTY_TAXONOMIES;
  const rows = data as Row[];
  return {
    strategies: group(rows, "strategy"),
    assetClasses: group(rows, "asset_class"),
    regions: group(rows, "region"),
  };
}
