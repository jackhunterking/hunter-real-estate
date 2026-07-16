import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
const Body = z.object({ membershipId: z.string().uuid(), decision: z.enum(["approve", "reject", "suspend"]), fallbackReason: z.string().nullable().optional(), evidenceStoragePath: z.string().nullable().optional() });
export async function PATCH(request: Request) {
  const p = Body.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: "Invalid membership decision." }, { status: 400 });
  return portalRpc("decide_firm_membership", { p_membership_id: p.data.membershipId, p_decision: p.data.decision, p_fallback_reason: p.data.fallbackReason ?? null, p_evidence_storage_path: p.data.evidenceStoragePath ?? null });
}
