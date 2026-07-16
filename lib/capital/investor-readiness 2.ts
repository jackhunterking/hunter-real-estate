import type {
  ClientAccountType,
  ClientJurisdiction,
  InvestorReadinessAnswer,
  InvestorReadinessCriterion,
  InvestorReadinessOmContext,
  InvestorReadinessResult,
} from "./types";
import { READINESS_RULESET } from "./readiness.ts";

export const INDIVIDUAL_ACCREDITED_CRITERIA = [
  "individual-registration",
  "individual-financial-assets",
  "individual-income",
  "individual-spousal-income",
  "individual-net-assets",
] as const satisfies readonly InvestorReadinessCriterion[];

export const INDIVIDUAL_ELIGIBLE_CRITERIA = [
  "eligible-net-assets",
  "eligible-income",
  "eligible-spousal-income",
] as const satisfies readonly InvestorReadinessCriterion[];

export const ENTITY_ACCREDITED_CRITERIA = [
  "entity-net-assets",
  "entity-regulated-category",
] as const satisfies readonly InvestorReadinessCriterion[];

export type InvestorReadinessInput = {
  jurisdiction: ClientJurisdiction;
  accountType: ClientAccountType;
  answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>;
};

export type InvestorReadinessDecision = {
  result: InvestorReadinessResult;
  qualifyingCriteria: InvestorReadinessCriterion[];
  omContext: InvestorReadinessOmContext;
  rulesetId: string;
};

export function omContextForResult(result: InvestorReadinessResult): InvestorReadinessOmContext {
  if (result === "potentially-accredited") return { kind: "accredited" };
  if (result === "potentially-eligible") {
    return {
      kind: "eligible",
      baseLimitCad: READINESS_RULESET.omLimits.eligible,
      higherLimitCad: READINESS_RULESET.omLimits.eligibleWithAdvice,
      periodMonths: 12,
    };
  }
  if (result === "potentially-non-eligible") {
    return {
      kind: "non-eligible",
      baseLimitCad: READINESS_RULESET.omLimits.nonEligible,
      periodMonths: 12,
    };
  }
  return { kind: "manual-review" };
}

function confirmed(
  criteria: readonly InvestorReadinessCriterion[],
  answers: InvestorReadinessInput["answers"],
) {
  return criteria.filter((criterion) => answers[criterion] === "yes");
}

function unresolved(
  criteria: readonly InvestorReadinessCriterion[],
  answers: InvestorReadinessInput["answers"],
) {
  return criteria.some((criterion) => answers[criterion] === "unsure" || answers[criterion] === undefined);
}

function decision(result: InvestorReadinessResult, qualifyingCriteria: InvestorReadinessCriterion[]): InvestorReadinessDecision {
  return {
    result,
    qualifyingCriteria,
    omContext: omContextForResult(result),
    rulesetId: READINESS_RULESET.id,
  };
}

export function assessInvestorReadiness(input: InvestorReadinessInput): InvestorReadinessDecision {
  if (input.jurisdiction !== "ontario") return decision("manual-review", []);

  if (input.accountType === "entity") {
    const entityAccredited = confirmed(ENTITY_ACCREDITED_CRITERIA, input.answers);
    if (entityAccredited.length) return decision("potentially-accredited", entityAccredited);
    return decision("manual-review", []);
  }

  const accredited = confirmed(INDIVIDUAL_ACCREDITED_CRITERIA, input.answers);
  if (accredited.length) return decision("potentially-accredited", accredited);
  if (unresolved(INDIVIDUAL_ACCREDITED_CRITERIA, input.answers)) return decision("manual-review", []);

  const eligible = confirmed(INDIVIDUAL_ELIGIBLE_CRITERIA, input.answers);
  if (eligible.length) return decision("potentially-eligible", eligible);
  if (unresolved(INDIVIDUAL_ELIGIBLE_CRITERIA, input.answers)) return decision("manual-review", []);

  return decision("potentially-non-eligible", []);
}
