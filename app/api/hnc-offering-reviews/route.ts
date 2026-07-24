import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { portalRpc } from "@/lib/capital/portal-route";
import type { ReviewOutcome } from "@/lib/capital/types";

const OUTCOMES = new Set<ReviewOutcome>(["updated", "no-change", "awaiting-source"]);

/**
 * Record that a human reconciled an investment profile against the manager's
 * source documents. Body: `{ offeringId, outcome, dataAsOf?, periodLabel?,
 * fieldsChanged?, note? }`.
 *
 * `api.record_offering_review` (Hunter admin only) does three things in one
 * transaction — stamp the offering's freshness fields, recompute the next due
 * date, and append to the review log — so those can never drift apart.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    offeringId?: string;
    outcome?: string;
    dataAsOf?: string;
    periodLabel?: string;
    fieldsChanged?: string[];
    note?: string;
  } | null;

  const offeringId = body?.offeringId?.trim();
  const outcome = body?.outcome?.trim() as ReviewOutcome | undefined;
  if (!offeringId) return NextResponse.json({ error: "Missing offering id." }, { status: 400 });
  if (!outcome || !OUTCOMES.has(outcome)) {
    return NextResponse.json({ error: "Unknown review outcome." }, { status: 400 });
  }
  // An 'updated' review asserts the figures now describe a period, so it must
  // name one; 'no-change' and 'awaiting-source' carry the existing period.
  const dataAsOf = body?.dataAsOf?.trim() || null;
  if (outcome === "updated" && !dataAsOf) {
    return NextResponse.json({ error: "An updated review needs the period end date." }, { status: 400 });
  }

  return portalRpc("record_offering_review", {
    p_offering_id: offeringId,
    p_outcome: outcome,
    p_data_as_of: dataAsOf,
    p_period_label: body?.periodLabel?.trim() || null,
    p_fields_changed: body?.fieldsChanged ?? [],
    p_note: body?.note?.trim() || null,
  });
}
