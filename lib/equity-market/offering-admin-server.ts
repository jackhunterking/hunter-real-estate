import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FreshnessStatus, OfferingBundle, UpdateCadence } from "./types";

export type OfferingAdminRow = {
  id: string;
  slug: string;
  status: string;
  marketStatus: string | null;
  latestVersion: string | null;
  updatedAt: string;
  /** The full editable bundle (app.offerings.draft_content). */
  bundle: OfferingBundle;
  /**
   * Data-freshness state, read from the offering row rather than the bundle:
   * these are operational facts about the profile, not published content.
   */
  updateCadence: UpdateCadence;
  dataAsOf: string | null;
  dataPeriodLabel: string | null;
  nextReviewDueAt: string | null;
  lastReviewedAt: string | null;
  freshnessStatus: FreshnessStatus;
  reviewOwnerName: string | null;
  managerPublicUrl: string | null;
};

/**
 * Admin-only editable offering rows, read from `api.offering_admin` (the view is
 * gated to platform admins). Returns each offering's working `draft_content` as the
 * editable bundle. Returns [] for non-admins or when the backend is unconfigured.
 */
export async function getOfferingAdminRows(): Promise<OfferingAdminRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const result = await supabase
    .from("offering_admin")
    // Must stay a single string literal — the Supabase client derives the row
    // type from it, and a concatenated expression degrades to GenericStringError.
    .select("id,slug,status,market_status,latest_version,draft_content,updated_at,update_cadence,data_as_of,data_period_label,next_review_due_at,last_reviewed_at,freshness_status,review_owner_name,manager_public_url")
    .order("updated_at", { ascending: false });
  if (result.error) return [];
  return (result.data ?? []).flatMap((row) => {
    if (!row.draft_content || typeof row.draft_content !== "object") return [];
    return [{
      id: row.id,
      slug: row.slug,
      status: row.status,
      marketStatus: row.market_status,
      latestVersion: row.latest_version,
      updatedAt: row.updated_at,
      bundle: row.draft_content as unknown as OfferingBundle,
      updateCadence: (row.update_cadence ?? "quarterly") as OfferingAdminRow["updateCadence"],
      dataAsOf: row.data_as_of,
      dataPeriodLabel: row.data_period_label,
      nextReviewDueAt: row.next_review_due_at,
      lastReviewedAt: row.last_reviewed_at,
      freshnessStatus: (row.freshness_status ?? "unscheduled") as OfferingAdminRow["freshnessStatus"],
      reviewOwnerName: row.review_owner_name,
      managerPublicUrl: row.manager_public_url,
    }];
  });
}
