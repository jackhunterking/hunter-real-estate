import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OfferingBundle } from "./types";

export type OfferingAdminRow = {
  id: string;
  slug: string;
  status: string;
  marketStatus: string | null;
  latestVersion: string | null;
  updatedAt: string;
  /** The full editable bundle (app.offerings.draft_content). */
  bundle: OfferingBundle;
};

/**
 * Admin-only editable offering rows, read from `api.offering_admin` (the view is
 * gated to Hunter admins). Returns each offering's working `draft_content` as the
 * editable bundle. Returns [] for non-admins or when the backend is unconfigured.
 */
export async function getOfferingAdminRows(): Promise<OfferingAdminRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const result = await supabase
    .from("offering_admin")
    .select("id,slug,status,market_status,latest_version,draft_content,updated_at")
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
    }];
  });
}
