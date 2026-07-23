import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";

const Body = z.object({
  userId: z.string().uuid(),
  role: z.literal("master_admin"),
  enabled: z.boolean(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid platform role update." }, { status: 400 });
  }

  return portalRpc("set_platform_role", {
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
    p_enabled: parsed.data.enabled,
  });
}
