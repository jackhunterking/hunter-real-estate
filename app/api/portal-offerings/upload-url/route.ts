import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKETS = new Set(["offering-public", "offering-private"]);

/**
 * Returns a signed upload URL for an offering asset. Body: `{ bucket, path }`.
 *
 * Uses the CALLER's session client, so the Storage RLS `private_offering_hunter_only`
 * policy (admin + MFA) governs whether the upload URL is granted — no service key,
 * no separate admin check needed. The client PUTs the file to `signedUrl`, then
 * records `{bucket,path}` on the offering bundle's media/document entry and saves.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const claims = await supabase.auth.getClaims();
  if (!claims.data?.claims?.sub) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { bucket?: string; path?: string } | null;
  const bucket = body?.bucket?.trim();
  const path = body?.path?.trim().replace(/^\/+/, "");
  if (!bucket || !BUCKETS.has(bucket) || !path) {
    return NextResponse.json({ error: "Invalid upload target." }, { status: 400 });
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
  if (error || !data) {
    return NextResponse.json({ error: "Upload was not permitted." }, { status: 403 });
  }
  return NextResponse.json(
    { signedUrl: data.signedUrl, path: data.path, bucket },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
