import { NextRequest, NextResponse } from "next/server";
import { verifyResendWebhook } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event;
  try {
    event = verifyResendWebhook({ payload, id, timestamp, signature });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (
    !event.type.startsWith("email.") ||
    !("email_id" in event.data) ||
    !("to" in event.data)
  ) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
  const result = await supabase.rpc("record_resend_event", {
    p_event_id: id,
    p_event_type: event.type,
    p_event_at: event.created_at,
    p_resend_email_id: event.data.email_id,
    p_recipient: event.data.to[0] ?? null,
    p_event_data: {
      bounce: "bounce" in event.data ? event.data.bounce : null,
      failed: "failed" in event.data ? event.data.failed : null,
      suppressed: "suppressed" in event.data ? event.data.suppressed : null,
    } as unknown as Json,
  });
  if (result.error) {
    console.error("resend_webhook_persist_failed", { code: result.error.code });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
