import type { ClientQualificationCriterion } from "./types";

export const READINESS_RULESET = {
  id: "ontario-ni-45-106-2026-07",
  effectiveDate: "2026-07-12",
  sources: [
    "National Instrument 45-106 Prospectus Exemptions",
    "OSC Companion Policy 45-106CP",
  ],
  omLimits: { nonEligible: 10000, eligible: 30000, eligibleWithAdvice: 100000 },
};

export type PreliminaryCategory = "potentially-accredited" | "potentially-eligible" | "potentially-non-eligible" | "manual-review";

export function classifyOntario(input: {
  qualificationCriteria: ClientQualificationCriterion[];
}): PreliminaryCategory {
  if (input.qualificationCriteria.some((criterion) => criterion.startsWith("ai-"))) return "potentially-accredited";
  if (input.qualificationCriteria.some((criterion) => criterion.startsWith("eligible-"))) return "potentially-eligible";
  return "potentially-non-eligible";
}

export function preliminaryOmLimit(category: PreliminaryCategory, registeredAdvice: boolean) {
  if (category === "potentially-accredited" || category === "manual-review") return undefined;
  if (category === "potentially-eligible") return registeredAdvice ? READINESS_RULESET.omLimits.eligibleWithAdvice : READINESS_RULESET.omLimits.eligible;
  return READINESS_RULESET.omLimits.nonEligible;
}
