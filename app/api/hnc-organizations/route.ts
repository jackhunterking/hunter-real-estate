import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
const Body = z.object({ organizationId: z.string().uuid(), status: z.enum(["pending", "active", "suspended", "terminated"]), reason: z.string().min(1) });
export async function PATCH(request: Request) {
  const p = Body.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: "Invalid organization decision." }, { status: 400 });
  return portalRpc("decide_organization", { p_organization_id: p.data.organizationId, p_status: p.data.status, p_reason: p.data.reason });
}
