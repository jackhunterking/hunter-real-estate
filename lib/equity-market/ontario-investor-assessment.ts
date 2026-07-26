import { READINESS_RULESET } from "./readiness-rules.ts";
import type {
  ClientAccountType,
  ClientExemptionRoute,
  ClientJurisdiction,
  InvestorReadinessAnswer,
  InvestorReadinessCriterion,
  InvestorReadinessOmCalculation,
  InvestorReadinessOmContext,
  InvestorReadinessReassessmentTrigger,
  InvestorReadinessResult,
  InvestorReadinessReviewReason,
  OfferingComplianceProfile,
} from "./types";

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

export type OntarioInvestorAssessmentInput = {
  jurisdiction: ClientJurisdiction;
  accountType: ClientAccountType;
  /**
   * Exact financial facts can be supplied by an approved partner workflow.
   * They are evaluated using the thresholds below; public experiences should
   * use the plain-language statements instead of collecting these values.
   */
  financialFacts?: {
    individual?: {
      financialAssetsCad?: number;
      financialAssetRelatedLiabilitiesCad?: number;
      individualIncomePriorYearOneCad?: number;
      individualIncomePriorYearTwoCad?: number;
      individualIncomeCurrentYearExpectedCad?: number;
      combinedIncomePriorYearOneCad?: number;
      combinedIncomePriorYearTwoCad?: number;
      combinedIncomeCurrentYearExpectedCad?: number;
      totalAssetsCad?: number;
      totalLiabilitiesCad?: number;
    };
    entity?: {
      totalAssetsCad?: number;
      totalLiabilitiesCad?: number;
    };
  };
  answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>;
  offeringCompliance?: OfferingComplianceProfile;
  proposedAcquisitionCostCad?: number;
  priorOmAcquisitionCostCad?: number;
  requiredFuturePaymentsCad?: number;
  registeredSuitabilityAdvice?: "recorded" | "not-recorded" | "unknown";
  relationshipClaimed?: boolean;
  relationshipVerified?: boolean;
  entityBuysAsPrincipal?: boolean;
  entityPaysCashAtDistribution?: boolean;
  entityPurchasesSingleIssuer?: boolean;
  entityNotCreatedSolelyForMinimumAmount?: boolean;
};

export type OntarioInvestorAssessment = {
  result: InvestorReadinessResult;
  qualifyingCriteria: InvestorReadinessCriterion[];
  omContext: InvestorReadinessOmContext;
  omCalculation: InvestorReadinessOmCalculation;
  candidateRoutes: ClientExemptionRoute[];
  reviewReasons: InvestorReadinessReviewReason[];
  rulesetId: string;
  sourceUrls: string[];
  reassessmentTriggers: InvestorReadinessReassessmentTrigger[];
};

const REASSESSMENT_TRIGGERS: InvestorReadinessReassessmentTrigger[] = [
  "jurisdiction",
  "purchaser-type",
  "offering",
  "proposed-acquisition-cost",
  "prior-om-acquisition-cost",
  "required-future-payments",
  "registered-suitability-advice",
  "relationship-facts",
  "entity-facts",
  "offering-compliance-metadata",
  "financial-facts",
];

function hasYes(criteria: readonly InvestorReadinessCriterion[], answers: OntarioInvestorAssessmentInput["answers"]) {
  return criteria.filter((criterion) => answers[criterion] === "yes");
}

function hasUnknown(criteria: readonly InvestorReadinessCriterion[], answers: OntarioInvestorAssessmentInput["answers"]) {
  return criteria.some((criterion) => answers[criterion] === "unsure" || answers[criterion] === undefined);
}

function nonNegativeNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function allAbove(threshold: number, values: Array<number | undefined>) {
  const normalized = values.map((value) => typeof value === "number" && Number.isFinite(value) ? value : undefined);
  return normalized.every((value) => value !== undefined)
    ? normalized.every((value) => (value as number) > threshold)
    : undefined;
}

function netAmount(assets: number | undefined, liabilities: number | undefined) {
  const normalizedAssets = nonNegativeNumber(assets);
  const normalizedLiabilities = nonNegativeNumber(liabilities);
  return normalizedAssets !== undefined && normalizedLiabilities !== undefined
    ? normalizedAssets - normalizedLiabilities
    : undefined;
}

/**
 * Keep a caller's explicit statement answer intact. Partner workflows may
 * alternatively provide exact financial facts, from which the legal test can
 * be derived. Missing facts remain unresolved rather than being treated as no.
 */
function resolvedAnswers(input: OntarioInvestorAssessmentInput) {
  const answers = { ...input.answers };
  if (input.accountType === "individual") {
    const facts = input.financialFacts?.individual;
    if (!facts) return answers;
    const financialAssets = netAmount(facts.financialAssetsCad, facts.financialAssetRelatedLiabilitiesCad);
    const netAssets = netAmount(facts.totalAssetsCad, facts.totalLiabilitiesCad);
    const individualIncome = allAbove(200_000, [
      facts.individualIncomePriorYearOneCad,
      facts.individualIncomePriorYearTwoCad,
      facts.individualIncomeCurrentYearExpectedCad,
    ]);
    const combinedIncome = allAbove(300_000, [
      facts.combinedIncomePriorYearOneCad,
      facts.combinedIncomePriorYearTwoCad,
      facts.combinedIncomeCurrentYearExpectedCad,
    ]);
    const eligibleIncome = allAbove(75_000, [
      facts.individualIncomePriorYearOneCad,
      facts.individualIncomePriorYearTwoCad,
      facts.individualIncomeCurrentYearExpectedCad,
    ]);
    const eligibleCombinedIncome = allAbove(125_000, [
      facts.combinedIncomePriorYearOneCad,
      facts.combinedIncomePriorYearTwoCad,
      facts.combinedIncomeCurrentYearExpectedCad,
    ]);
    const set = (criterion: InvestorReadinessCriterion, value: boolean | undefined) => {
      if (answers[criterion] === undefined && value !== undefined) answers[criterion] = value ? "yes" : "no";
    };
    set("individual-financial-assets", financialAssets === undefined ? undefined : financialAssets > 1_000_000);
    set("individual-income", individualIncome);
    set("individual-spousal-income", combinedIncome);
    set("individual-net-assets", netAssets === undefined ? undefined : netAssets >= 5_000_000);
    set("eligible-net-assets", netAssets === undefined ? undefined : netAssets > 400_000);
    set("eligible-income", eligibleIncome);
    set("eligible-spousal-income", eligibleCombinedIncome);
    return answers;
  }

  const facts = input.financialFacts?.entity;
  const netAssets = facts && netAmount(facts.totalAssetsCad, facts.totalLiabilitiesCad);
  if (answers["entity-net-assets"] === undefined && netAssets !== undefined) {
    answers["entity-net-assets"] = netAssets >= 5_000_000 ? "yes" : "no";
  }
  return answers;
}

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
    return { kind: "non-eligible", baseLimitCad: READINESS_RULESET.omLimits.nonEligible, periodMonths: 12 };
  }
  return { kind: "manual-review" };
}

function safelyAdd(...values: Array<number | undefined>) {
  return values.reduce<number>((sum, value) => {
    const normalized = typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
    return sum + normalized;
  }, 0);
}

function decision(
  result: InvestorReadinessResult,
  qualifyingCriteria: InvestorReadinessCriterion[],
  reviewReasons: InvestorReadinessReviewReason[],
  input: OntarioInvestorAssessmentInput,
): OntarioInvestorAssessment {
  const offering = input.offeringCompliance;
  const offeringApproved = Boolean(offering?.reviewedAt);
  const omAvailable = Boolean(
    offeringApproved
      && offering
      && !offering.isInvestmentFund
      && offering.approvedOntarioExemptions.includes("offering-memorandum"),
  );
  const routes: ClientExemptionRoute[] = [];

  if (!offeringApproved) reviewReasons.push("offering-compliance-not-confirmed");
  if (offeringApproved && offering && !omAvailable) reviewReasons.push("offering-does-not-support-om");

  if (
    result === "potentially-accredited"
    && offeringApproved
    && offering?.approvedOntarioExemptions.includes("accredited-investor")
  ) {
    routes.push("accredited-investor");
  }

  if (input.accountType === "individual" && omAvailable && result !== "manual-review") {
    routes.push("offering-memorandum");
  }

  if (input.relationshipClaimed && !input.relationshipVerified) {
    reviewReasons.push("relationship-claim-requires-verification");
  }
  if (
    input.relationshipClaimed
    && input.relationshipVerified
    && offeringApproved
    && offering
    && !offering.isInvestmentFund
    && offering.approvedOntarioExemptions.includes("family-friends-business-associates")
  ) {
    routes.push("family-friends-business-associates");
  }

  const minimumAmountConditions = Boolean(input.accountType === "entity"
    && input.entityBuysAsPrincipal
    && input.entityPaysCashAtDistribution
    && input.entityPurchasesSingleIssuer
    && input.entityNotCreatedSolelyForMinimumAmount
    && safelyAdd(input.proposedAcquisitionCostCad) >= 150_000);
  if (input.accountType === "entity" && !minimumAmountConditions) {
    reviewReasons.push("minimum-amount-conditions-not-confirmed");
  }
  if (
    minimumAmountConditions
    && offeringApproved
    && offering?.approvedOntarioExemptions.includes("minimum-amount")
  ) {
    routes.push("minimum-amount");
  }

  const omContext = omContextForResult(result);
  let omCalculation: InvestorReadinessOmCalculation = { status: "not-requested" };
  if (input.accountType !== "individual" || result === "manual-review") {
    omCalculation = { status: "manual-review" };
  } else if (!omAvailable) {
    omCalculation = { status: "not-available" };
  } else if (result === "potentially-accredited") {
    omCalculation = { status: "not-applicable" };
  } else if (input.proposedAcquisitionCostCad !== undefined) {
    const prior = safelyAdd(input.priorOmAcquisitionCostCad);
    const proposed = safelyAdd(input.proposedAcquisitionCostCad);
    const future = safelyAdd(input.requiredFuturePaymentsCad);
    const limit = result === "potentially-eligible"
      ? input.registeredSuitabilityAdvice === "recorded"
        ? READINESS_RULESET.omLimits.eligibleWithAdvice
        : READINESS_RULESET.omLimits.eligible
      : READINESS_RULESET.omLimits.nonEligible;
    if (result === "potentially-eligible" && input.registeredSuitabilityAdvice === "unknown") {
      reviewReasons.push("registered-advice-not-recorded");
    }
    const total = prior + proposed + future;
    omCalculation = {
      status: "calculated",
      limitCad: limit,
      priorAcquisitionCostCad: prior,
      proposedAcquisitionCostCad: proposed,
      requiredFuturePaymentsCad: future,
      totalAfterProposedCad: total,
      remainingCapacityCad: Math.max(limit - prior, 0),
      withinPreliminaryLimit: total <= limit,
    };
  }

  if (!routes.length) routes.push("licensed-review");
  return {
    result,
    qualifyingCriteria,
    omContext,
    omCalculation,
    candidateRoutes: routes,
    reviewReasons: [...new Set(reviewReasons)],
    rulesetId: READINESS_RULESET.id,
    sourceUrls: [...READINESS_RULESET.sources],
    reassessmentTriggers: REASSESSMENT_TRIGGERS,
  };
}

export function assessOntarioInvestor(input: OntarioInvestorAssessmentInput): OntarioInvestorAssessment {
  const answers = resolvedAnswers(input);
  const reviewReasons: InvestorReadinessReviewReason[] = [];
  if (input.jurisdiction !== "ontario") {
    return decision("manual-review", [], ["outside-ontario"], input);
  }

  if (input.accountType === "entity") {
    const accredited = hasYes(ENTITY_ACCREDITED_CRITERIA, answers);
    if (answers["entity-not-created-solely-for-accredited-exemption"] !== "yes") {
      reviewReasons.push("entity-anti-syndication-not-confirmed");
    }
    if (answers["entity-regulated-category"] === "yes") {
      reviewReasons.push("entity-category-requires-verification");
    }
    if (accredited.length && answers["entity-not-created-solely-for-accredited-exemption"] === "yes") {
      return decision("potentially-accredited", accredited, reviewReasons, input);
    }
    return decision("manual-review", [], reviewReasons, input);
  }

  const accredited = hasYes(INDIVIDUAL_ACCREDITED_CRITERIA, answers);
  if (accredited.length) return decision("potentially-accredited", accredited, reviewReasons, input);
  if (hasUnknown(INDIVIDUAL_ACCREDITED_CRITERIA, answers)) {
    return decision("manual-review", [], ["incomplete-or-uncertain-financial-facts"], input);
  }

  const eligible = hasYes(INDIVIDUAL_ELIGIBLE_CRITERIA, answers);
  if (eligible.length) return decision("potentially-eligible", eligible, reviewReasons, input);
  if (hasUnknown(INDIVIDUAL_ELIGIBLE_CRITERIA, answers)) {
    return decision("manual-review", [], ["incomplete-or-uncertain-financial-facts"], input);
  }
  return decision("potentially-non-eligible", [], reviewReasons, input);
}
