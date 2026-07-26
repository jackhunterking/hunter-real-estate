import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns a short-lived URL for an offering document, resolved server-side so
 * the client never handles Storage paths or the private bucket directly.
 *
 *  - Requires an authenticated portal session.
 *  - The document row (app.offering_documents) is looked up by offering + doc
 *    slug SERVER-SIDE, so a caller cannot request an arbitrary object path.
 *  - Public-bucket docs return their stable public URL; private-bucket docs
 *    return a 60s signed URL minted with the service role (the private bucket's
 *    RLS blocks non-admin reads, so signing must happen server-side after this
 *    entitlement check).
 *
 * NOTE: entitlement is currently "authenticated portal user". Investor-approval
 * gating (canUseWorkspace / approved-investor) should be layered on before real
 * private offering documents are published.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const claims = await supabase.auth.getClaims();
  if (!claims.data?.claims?.sub) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { offeringSlug?: string; documentSlug?: string }
    | null;
  const offeringSlug = body?.offeringSlug?.trim();
  const documentSlug = body?.documentSlug?.trim();
  if (!offeringSlug || !documentSlug) {
    return NextResponse.json({ error: "Missing document reference." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_WEB_SECRET_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const admin = createClient(url, serviceKey, {
    db: { schema: "app" },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: offering } = await admin.from("offerings").select("id").eq("slug", offeringSlug).maybeSingle();
  if (!offering) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: doc } = await admin
    .from("offering_documents")
    .select("bucket_id,storage_path,status,visibility,withdrawal_at")
    .eq("offering_id", offering.id)
    .eq("slug", documentSlug)
    .maybeSingle();

  if (
    !doc ||
    doc.status !== "published" ||
    !doc.storage_path ||
    (doc.withdrawal_at && new Date(doc.withdrawal_at) <= new Date())
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (doc.bucket_id === "offering-public") {
    return NextResponse.json(
      { url: `${url.replace(/\/$/, "")}/storage/v1/object/public/${doc.bucket_id}/${doc.storage_path}` },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { data: signed, error } = await admin.storage.from(doc.bucket_id).createSignedUrl(doc.storage_path, 60);
  if (error || !signed) return NextResponse.json({ error: "Unavailable." }, { status: 404 });
  return NextResponse.json({ url: signed.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
