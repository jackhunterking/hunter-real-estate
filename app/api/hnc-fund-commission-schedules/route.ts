import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portalRpc } from "@/lib/capital/portal-route";

const CreateSchedule = z.object({
  offeringId: z.string().trim().min(1),
  grossCommissionBps: z.number().positive().max(10_000),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  internalNote: z.string().trim().max(1000).nullable().optional(),
});

const PublishSchedule = z.object({
  scheduleId: z.string().uuid(),
});

type ScheduleRow = {
  id: string;
  offering_id: string;
  gross_commission_bps: number;
  status: string;
  effective_from: string;
  effective_to: string | null;
  internal_note?: string | null;
  created_by?: string;
  published_by?: string | null;
  published_at: string | null;
  superseded_by?: string | null;
  created_at: string;
  updated_at: string;
};

function serializeSchedule(row: ScheduleRow) {
  return {
    id: row.id,
    offeringId: row.offering_id,
    grossCommissionBps: Number(row.gross_commission_bps),
    status: row.status,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to ?? undefined,
    internalNote: row.internal_note ?? undefined,
    createdBy: row.created_by,
    publishedBy: row.published_by ?? undefined,
    publishedAt: row.published_at ?? undefined,
    supersededBy: row.superseded_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: "Service unavailable." }, { status: 503 });
  }
  const claims = await supabase.auth.getClaims();
  if (!claims.data?.claims?.sub) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const admin = params.get("scope") === "admin";
  const offeringId = params.get("offeringId")?.trim();
  if (!admin && (!offeringId || offeringId.length > 200)) {
    return Response.json({ error: "A valid offering is required." }, { status: 400 });
  }
  const result = admin
    ? await supabase.rpc("list_fund_commission_schedules_admin")
    : await supabase
        .from("fund_commission_schedules")
        .select("id,offering_id,gross_commission_bps,status,effective_from,effective_to,published_at,created_at,updated_at")
        .eq("status", "published")
        .eq("offering_id", offeringId as string)
        .lte("effective_from", new Date().toISOString().slice(0, 10))
        .order("effective_from", { ascending: false })
        .limit(1);

  if (result.error) {
    return Response.json({ error: "Fund schedules are not available." }, { status: 403 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const schedules = ((result.data ?? []) as ScheduleRow[])
    .filter((row) => (admin || !row.effective_to || row.effective_to >= today) && (!offeringId || row.offering_id === offeringId))
    .map(serializeSchedule);
  return Response.json(
    { data: schedules },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const parsed = CreateSchedule.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid fund commission schedule." }, { status: 400 });
  }
  return portalRpc("create_fund_commission_schedule", {
    p_offering_id: parsed.data.offeringId,
    p_gross_commission_bps: parsed.data.grossCommissionBps,
    p_effective_from: parsed.data.effectiveFrom,
    p_internal_note: parsed.data.internalNote ?? null,
  });
}

export async function PATCH(request: Request) {
  const parsed = PublishSchedule.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid fund commission schedule." }, { status: 400 });
  }
  return portalRpc("publish_fund_commission_schedule", {
    p_schedule_id: parsed.data.scheduleId,
  });
}
