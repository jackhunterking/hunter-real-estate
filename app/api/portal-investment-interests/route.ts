import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portalRpc } from "@/lib/equity-market/portal-route";

const CreateBody = z.object({
  offeringId: z.string().uuid(),
  message: z.string().trim().max(2000).optional().default(""),
  preferredChannel: z.enum(["email", "phone", "whatsapp"]),
  contactConsent: z.literal(true),
});

const UpdateBody = z.object({
  interestId: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "closed"]),
  reviewerNotes: z.string().trim().max(4000).optional().default(""),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Service unavailable." }, { status: 503 });
  const claims = await supabase.auth.getClaims();
  if (!claims.data?.claims?.sub) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }
  const adminResult = await supabase.rpc("list_investment_interest_admin");
  if (!adminResult.error) {
    return Response.json({ data: adminResult.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const result = await supabase
    .from("investment_interest_requests")
    .select("id,user_id,offering_id,message,preferred_channel,status,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (result.error) {
    return Response.json({ error: "Interest requests could not be loaded." }, { status: 403 });
  }
  return Response.json({ data: result.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const parsed = CreateBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid interest request." }, { status: 400 });
  }
  return portalRpc("create_investment_interest", {
    p_offering_id: parsed.data.offeringId,
    p_message: parsed.data.message,
    p_preferred_channel: parsed.data.preferredChannel,
    p_contact_consent: parsed.data.contactConsent,
  });
}

export async function PATCH(request: Request) {
  const parsed = UpdateBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid status update." }, { status: 400 });
  }
  return portalRpc("set_investment_interest_status", {
    p_interest_id: parsed.data.interestId,
    p_status: parsed.data.status,
    p_reviewer_notes: parsed.data.reviewerNotes,
  });
}
