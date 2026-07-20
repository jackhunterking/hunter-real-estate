import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
import type { Json } from "@/lib/supabase/database.types";

const Body = z.object({
  referralId: z.string().uuid(),
  assessment: z.object({
    jurisdiction: z.string().min(1),
    accountType: z.enum(["individual", "entity"]),
    answers: z.record(z.string(), z.unknown()),
    result: z.string().min(1),
    financialResult: z.string().optional(),
    jurisdictionReview: z.string().optional(),
    residenceCountryCode: z.string().optional(),
    residenceRegionCode: z.string().optional(),
    qualifyingCriteria: z.array(z.string()),
    omContext: z.record(z.string(), z.unknown()),
    candidateRoutes: z.array(z.string()).optional(),
    reviewReasons: z.array(z.string()).optional(),
    omCalculation: z.record(z.string(), z.unknown()).optional(),
    assessmentInput: z.record(z.string(), z.unknown()).optional(),
    rulesetId: z.string().min(1),
    sourceUrls: z.array(z.string().url()).optional(),
    reassessmentTriggers: z.array(z.string()).optional(),
    acknowledgementAt: z.string().datetime(),
  }),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid qualification assessment." }, { status: 400 });
  return portalRpc("create_referral_qualification_assessment", {
    p_referral_id: parsed.data.referralId,
    p_input: parsed.data.assessment as unknown as Json,
  });
}
