import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { portalRpc } from "@/lib/capital/portal-route";

/**
 * Save an offering's working content (no publish). Body: `{ bundle }`, the full
 * OfferingBundle. Gated by `api.save_offering_draft` (Hunter admin only).
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { bundle?: unknown } | null;
  if (!body?.bundle || typeof body.bundle !== "object") {
    return NextResponse.json({ error: "Missing offering bundle." }, { status: 400 });
  }
  return portalRpc("save_offering_draft", { p_bundle: body.bundle as never });
}
