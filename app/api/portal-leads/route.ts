import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LeadStatus = z.enum(["new", "reviewing", "contacted", "qualified", "converted", "closed", "spam"]);
const Update = z.object({
  leadId: z.string().uuid(),
  status: LeadStatus,
  assignedTo: z.string().uuid().nullable(),
  followUpAt: z.string().datetime().nullable(),
});
const Note = z.object({
  leadId: z.string().uuid(),
  note: z.string().trim().min(1).max(5000),
});

async function authenticatedClient() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const claims = await supabase.auth.getClaims();
  return claims.data?.claims?.sub ? supabase : null;
}

export async function PATCH(request: Request) {
  const parsed = Update.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const supabase = await authenticatedClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 401 });
  const result = await supabase.rpc("update_lead", {
    p_lead_id: parsed.data.leadId,
    p_status: parsed.data.status,
    p_assigned_to: parsed.data.assignedTo,
    p_follow_up_at: parsed.data.followUpAt,
  });
  if (result.error) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const parsed = Note.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const supabase = await authenticatedClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 401 });
  const result = await supabase.rpc("add_lead_note", {
    p_lead_id: parsed.data.leadId,
    p_note: parsed.data.note,
  });
  if (result.error) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, noteId: result.data });
}
