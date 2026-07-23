import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";

const Body = z.object({
  investorAccountType: z.enum(["individual", "entity"]),
  qualificationCategory: z.enum(["accredited", "eligible", "entity", "review"]),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid self-check result." }, { status: 400 });
  }
  const input = parsed.data;
  return portalRpc("set_investor_qualification", {
    p_investor_account_type: input.investorAccountType,
    p_qualification_category: input.qualificationCategory,
  });
}
