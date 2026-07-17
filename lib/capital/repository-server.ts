import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOfferingBySlug as getFixtureBySlug, getOfferings as getFixtureOfferings } from "./repository";
import type { OfferingBundle } from "./types";

function isOfferingBundle(value: unknown): value is OfferingBundle {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.slug === "string" &&
    Boolean(candidate.manager) &&
    Array.isArray(candidate.shareClasses) &&
    Array.isArray(candidate.properties) &&
    Array.isArray(candidate.documents)
  );
}

function fixturesAllowed() {
  return process.env.NODE_ENV !== "production" && (
    !isSupabaseConfigured() || process.env.HNC_USE_FIXTURE_DATA === "true"
  );
}

export async function getPublishedOfferings(): Promise<OfferingBundle[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fixturesAllowed() ? getFixtureOfferings() : [];

  const result = await supabase
    .from("published_offerings")
    .select("id,slug,content_snapshot,effective_at")
    .order("effective_at", { ascending: false });

  if (result.error) return [];
  const bundles = (result.data ?? [])
    .map((row) => {
      if (!isOfferingBundle(row.content_snapshot)) return null;
      return { ...row.content_snapshot, id: row.id, slug: row.slug };
    })
    .filter((offering): offering is OfferingBundle => Boolean(offering));

  return bundles.length || !fixturesAllowed() ? bundles : getFixtureOfferings();
}

export async function getPublishedOfferingBySlug(slug: string) {
  const offerings = await getPublishedOfferings();
  return offerings.find((offering) => offering.slug === slug)
    ?? (fixturesAllowed() ? getFixtureBySlug(slug) : undefined);
}
