import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
const Body = z.object({ membershipId: z.string().uuid(), roles: z.array(z.enum(["representative", "membership_admin", "finance_admin"])).min(1), reason: z.string().min(1) });
export async function PATCH(request: Request) {
  const p = Body.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: "Invalid membership roles." }, { status: 400 });
  return portalRpc("assign_firm_membership_roles", { p_membership_id: p.data.membershipId, p_roles: p.data.roles, p_reason: p.data.reason });
}
