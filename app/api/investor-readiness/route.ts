import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedOfferings } from "@/lib/equity-market/repository-server";
import { assessOntarioInvestor } from "@/lib/equity-market/ontario-investor-assessment";
import { READINESS_RULESET } from "@/lib/equity-market/readiness";
import type { InvestorReadinessAnswer, InvestorReadinessCriterion } from "@/lib/equity-market/types";
import { deliverEmailJob } from "@/lib/email";
import { persistPublicSubmission } from "@/lib/public-submissions";
import { verifyTurnstile } from "@/lib/security/turnstile";

const Body = z.object({
  offeringId: z.string().min(1),
  shareClassId: z.string().optional(),
  jurisdiction: z.enum(["ontario", "turkey-cross-border"]),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().min(1).max(120),
  objective: z.string().min(1),
  horizon: z.string().min(1),
  riskTolerance: z.string().min(1),
  lossCapacity: z.string().min(1),
  liquidityNeed: z.string().min(1),
  experience: z.string().min(1),
  intendedAmount: z.string().min(1),
  accountPreference: z.string().min(1),
  qualificationCriteria: z.array(z.enum([
    "ai-financial-assets", "ai-income-individual", "ai-income-with-spouse",
    "ai-net-assets", "eligible-net-assets", "eligible-income-individual",
    "eligible-income-with-spouse",
  ])),
  contactConsent: z.literal(true),
  accuracyConsent: z.literal(true),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile" },
      { status: 400 },
    );
  }

  const challenge = await verifyTurnstile({
    token: parsed.data.turnstileToken,
    remoteIp:
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for"),
  });
  if (!challenge.ok) {
    return NextResponse.json(
      { error: "Security verification failed. Please try again." },
      { status: 403 },
    );
  }

  const { turnstileToken: _turnstileToken, ...input } = parsed.data;
  void _turnstileToken;
  const offering = (await getPublishedOfferings()).find((item) => item.id === input.offeringId);
  if (!offering || (input.shareClassId && !offering.shareClassIds.includes(input.shareClassId))) {
    return NextResponse.json({ error: "Unknown offering or share class" }, { status: 400 });
  }

  const criteriaMap: Record<string, InvestorReadinessCriterion> = {
    "ai-financial-assets": "individual-financial-assets",
    "ai-income-individual": "individual-income",
    "ai-income-with-spouse": "individual-spousal-income",
    "ai-net-assets": "individual-net-assets",
    "eligible-net-assets": "eligible-net-assets",
    "eligible-income-individual": "eligible-income",
    "eligible-income-with-spouse": "eligible-spousal-income",
  };
  const answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>> = {
    "individual-registration": "no",
    "individual-financial-assets": "no",
    "individual-income": "no",
    "individual-spousal-income": "no",
    "individual-net-assets": "no",
    "eligible-net-assets": "no",
    "eligible-income": "no",
    "eligible-spousal-income": "no",
  };
  for (const criterion of input.qualificationCriteria) {
    answers[criteriaMap[criterion]] = "yes";
  }

  const assessment = assessOntarioInvestor({
    jurisdiction: input.jurisdiction === "ontario" ? "ontario" : "manual-review",
    accountType: input.accountPreference === "Corporate/entity" ? "entity" : "individual",
    answers,
    offeringCompliance: offering.complianceProfile,
  });
  const warnings = input.jurisdiction === "ontario"
    ? [
        "Educational preliminary result only. A licensed reviewer must verify purchaser facts, exemption availability, and suitability.",
        "Personalized OM capacity is verified in the licensed workflow.",
        `Ruleset: ${READINESS_RULESET.id}`,
      ]
    : [
        "Cross-border legal, tax, AML, source-of-funds, and product-permission review is required.",
        "No eligibility determination has been made.",
      ];

  try {
    const submission = await persistPublicSubmission("submit_investor_readiness", {
      ...input,
      offering_version_id: offering.id,
      preliminary_category: assessment.result,
      warnings,
      ruleset_id: assessment.rulesetId,
      ruleset_version: READINESS_RULESET.effectiveDate,
      immutable_input_snapshot: input,
      calculated_at: new Date().toISOString(),
    });
    const notificationStatus = await deliverEmailJob(submission.email_job_id);
    return NextResponse.json({
      submissionId: submission.submission_id,
      offeringId: input.offeringId,
      shareClassId: input.shareClassId || undefined,
      jurisdictionPath: input.jurisdiction,
      preliminaryCategory: assessment.result,
      qualificationCriteria: input.qualificationCriteria,
      nextStep: "licensed-review",
      warnings,
      notificationStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "Your assessment could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
