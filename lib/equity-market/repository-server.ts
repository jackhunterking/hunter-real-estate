import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveBundleAssets } from "./asset-url";
import { parseOfferingBundle } from "./schema";
import type { OfferingBundle } from "./types";

/**
 * Offerings are read exclusively from Supabase (`api.published_offerings`).
 * There is no fixture fallback — Supabase is the single source of truth. Each
 * row's `content_snapshot` is validated with `parseOfferingBundle`; malformed
 * rows are dropped rather than rendered.
 */
export async function getPublishedOfferings(): Promise<OfferingBundle[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const result = await supabase
    .from("published_offerings")
    .select("id,slug,content_snapshot,effective_at")
    .order("effective_at", { ascending: false });

  if (result.error) return [];
  return (result.data ?? [])
    .map((row) => {
      const bundle = parseOfferingBundle(row.content_snapshot);
      // Resolve Supabase Storage references (images, public docs) to live URLs.
      return bundle ? resolveBundleAssets({ ...bundle, id: row.id, slug: row.slug }) : null;
    })
    .filter((offering): offering is OfferingBundle => Boolean(offering));
}

export async function getPublishedOfferingBySlug(slug: string) {
  const offerings = await getPublishedOfferings();
  return offerings.find((offering) => offering.slug === slug);
}
