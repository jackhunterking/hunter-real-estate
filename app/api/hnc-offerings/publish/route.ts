import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { portalRpc } from "@/lib/capital/portal-route";

/**
 * Compose + publish an offering (new immutable content version). Body:
 * `{ offeringId }`. Gated by `api.publish_offering` (Hunter admin only); it also
 * enforces bilingual name + >=1 share class + >=1 property before publishing.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { offeringId?: string } | null;
  const offeringId = body?.offeringId?.trim();
  if (!offeringId) return NextResponse.json({ error: "Missing offering id." }, { status: 400 });
  return portalRpc("publish_offering", { p_offering_id: offeringId });
}
