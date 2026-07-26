import { z } from "zod";
import { portalRpc } from "@/lib/equity-market/portal-route";

const Body = z.discriminatedUnion("accountIntent", [
  z.object({
    accountIntent: z.literal("investor"),
    investorAccountType: z.enum(["individual", "entity"]),
    residenceJurisdiction: z.string().trim().min(2).max(120),
    agreed: z.literal(true),
  }),
  z.object({
    accountIntent: z.literal("turkiye_licensed_professional_or_firm"),
    investorAccountType: z.null().optional(),
    residenceJurisdiction: z.string().trim().min(2).max(120),
    agreed: z.literal(true),
  }),
]);

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid onboarding details." }, { status: 400 });
  }
  const input = parsed.data;
  return portalRpc("complete_hnc_onboarding", {
    p_account_intent: input.accountIntent,
    p_investor_account_type: input.investorAccountType ?? null,
    p_residence_jurisdiction: input.residenceJurisdiction,
    p_investment_objective: "",
    p_time_horizon: "",
    p_risk_acknowledged: input.agreed,
    p_contact_consent: input.agreed,
  });
}
