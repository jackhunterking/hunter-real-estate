import { z } from "zod";
import { portalRpc } from "@/lib/equity-market/portal-route";

const Body = z.object({
  applicationId: z.string().uuid(),
  status: z.enum([
    "draft",
    "submitted",
    "compliance_review",
    "approved_for_subscription",
    "accepted",
    "funded",
    "declined",
    "withdrawn",
    "closed",
  ]),
});

export async function PATCH(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid investment status update." }, { status: 400 });
  }

  return portalRpc("set_investment_status", {
    p_application_id: parsed.data.applicationId,
    p_new_status: parsed.data.status,
  });
}
