import { assessOntarioInvestor } from "./ontario-investor-assessment.ts";
import type { ClientQualificationCriterion, InvestorReadinessAnswer, InvestorReadinessCriterion } from "./types";
export { READINESS_RULESET } from "./readiness-rules.ts";
import { READINESS_RULESET } from "./readiness-rules.ts";

export type PreliminaryCategory = "potentially-accredited" | "potentially-eligible" | "potentially-non-eligible" | "manual-review";

export function classifyOntario(input: {
  qualificationCriteria: ClientQualificationCriterion[];
}): PreliminaryCategory {
  const map: Partial<Record<ClientQualificationCriterion, InvestorReadinessCriterion>> = {
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
    const mapped = map[criterion];
    if (mapped) answers[mapped] = "yes";
  }
  return assessOntarioInvestor({ jurisdiction: "ontario", accountType: "individual", answers }).result;
}

export function preliminaryOmLimit(category: PreliminaryCategory, registeredAdvice: boolean) {
  if (category === "potentially-accredited" || category === "manual-review") return undefined;
  if (category === "potentially-eligible") return registeredAdvice ? READINESS_RULESET.omLimits.eligibleWithAdvice : READINESS_RULESET.omLimits.eligible;
  return READINESS_RULESET.omLimits.nonEligible;
}
