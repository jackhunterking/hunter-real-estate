import {
  assessOntarioInvestor,
  ENTITY_ACCREDITED_CRITERIA,
  INDIVIDUAL_ACCREDITED_CRITERIA,
  INDIVIDUAL_ELIGIBLE_CRITERIA,
  omContextForResult,
  type OntarioInvestorAssessment,
} from "./ontario-investor-assessment.ts";
import { READINESS_RULESET } from "./readiness-rules.ts";
import type {
  ClientAccountType,
  ClientJurisdiction,
  InvestorFinancialResult,
  InvestorJurisdictionReview,
  InvestorReadinessAnswer,
  InvestorReadinessCriterion,
  InvestorReadinessResult,
} from "./types";

export { ENTITY_ACCREDITED_CRITERIA, INDIVIDUAL_ACCREDITED_CRITERIA, INDIVIDUAL_ELIGIBLE_CRITERIA, omContextForResult };

export type InvestorReadinessInput = {
  jurisdiction: ClientJurisdiction;
  accountType: ClientAccountType;
  answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>;
};

export type CanadianFinancialProfileInput = {
  accountType: ClientAccountType;
  answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>;
};

export type InvestorQualificationBands = {
  registration?: InvestorReadinessAnswer;
  financialAssets?: "above-million" | "million-or-less" | "unsure";
  individualIncome?: "above-200" | "above-75-to-200" | "75-or-less" | "unsure";
  spousalIncome?: "above-300" | "above-125-to-300" | "125-or-less" | "not-applicable" | "unsure";
  netAssets?: "five-million-plus" | "above-400-under-five" | "400-or-less" | "unsure";
};

export type CanadianFinancialProfileDecision = {
  financialResult: InvestorFinancialResult;
  /** Legacy value retained for existing client records and profile views. */
  result: InvestorReadinessResult;
  qualifyingCriteria: InvestorReadinessCriterion[];
  rulesetId: string;
  sourceUrls: string[];
};

export type RegisteredSuitabilityAdvice = "yes" | "no" | "unsure";

export type PreliminaryMaximumInvestment =
  | { status: "limit"; limitCad: number; periodMonths: 12; adviceConfirmed: boolean }
  | { status: "no-individual-om-limit" }
  | { status: "needs-information" }
  | { status: "entity-review" };

const ALL_INDIVIDUAL_CRITERIA = [
  ...INDIVIDUAL_ACCREDITED_CRITERIA,
  ...INDIVIDUAL_ELIGIBLE_CRITERIA,
] as const;

export function financialResultToLegacyResult(result: InvestorFinancialResult): InvestorReadinessResult {
  if (result === "potentially-accredited" || result === "potentially-eligible" || result === "potentially-non-eligible") {
    return result;
  }
  return "manual-review";
}

/** Map the five mutually exclusive financial questions to the legacy criteria. */
export function qualificationBandsToReadinessAnswers(
  profile: InvestorQualificationBands,
): Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>> {
  const answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>> = {};
  if (profile.registration) answers["individual-registration"] = profile.registration;
  if (profile.financialAssets) {
    answers["individual-financial-assets"] = profile.financialAssets === "unsure"
      ? "unsure"
      : profile.financialAssets === "above-million" ? "yes" : "no";
  }
  if (profile.individualIncome) {
    const unsure = profile.individualIncome === "unsure";
    answers["individual-income"] = unsure ? "unsure" : profile.individualIncome === "above-200" ? "yes" : "no";
    answers["eligible-income"] = unsure ? "unsure" : profile.individualIncome === "75-or-less" ? "no" : "yes";
  }
  if (profile.spousalIncome) {
    const unsure = profile.spousalIncome === "unsure";
    answers["individual-spousal-income"] = unsure ? "unsure" : profile.spousalIncome === "above-300" ? "yes" : "no";
    answers["eligible-spousal-income"] = unsure
      ? "unsure"
      : profile.spousalIncome === "above-300" || profile.spousalIncome === "above-125-to-300" ? "yes" : "no";
  }
  if (profile.netAssets) {
    const unsure = profile.netAssets === "unsure";
    answers["individual-net-assets"] = unsure ? "unsure" : profile.netAssets === "five-million-plus" ? "yes" : "no";
    answers["eligible-net-assets"] = unsure ? "unsure" : profile.netAssets === "400-or-less" ? "no" : "yes";
  }
  return answers;
}

/**
 * Classify Canadian financial-threshold statements without using residence as
 * a gate. Jurisdiction and transaction permission are resolved separately.
 */
export function assessCanadianFinancialProfile(
  input: CanadianFinancialProfileInput,
): CanadianFinancialProfileDecision {
  if (input.accountType === "entity") {
    return {
      financialResult: "entity-review",
      result: "manual-review",
      qualifyingCriteria: [],
      rulesetId: READINESS_RULESET.id,
      sourceUrls: [...READINESS_RULESET.sources],
    };
  }

  const hasUnresolvedAnswer = ALL_INDIVIDUAL_CRITERIA.some(
    (criterion) => input.answers[criterion] === undefined || input.answers[criterion] === "unsure",
  );
  if (hasUnresolvedAnswer) {
    return {
      financialResult: "needs-information",
      result: "manual-review",
      qualifyingCriteria: [],
      rulesetId: READINESS_RULESET.id,
      sourceUrls: [...READINESS_RULESET.sources],
    };
  }

  const accredited = INDIVIDUAL_ACCREDITED_CRITERIA.filter(
    (criterion) => input.answers[criterion] === "yes",
  );
  if (accredited.length) {
    return {
      financialResult: "potentially-accredited",
      result: "potentially-accredited",
      qualifyingCriteria: accredited,
      rulesetId: READINESS_RULESET.id,
      sourceUrls: [...READINESS_RULESET.sources],
    };
  }

  const eligible = INDIVIDUAL_ELIGIBLE_CRITERIA.filter(
    (criterion) => input.answers[criterion] === "yes",
  );
  const financialResult: InvestorFinancialResult = eligible.length
    ? "potentially-eligible"
    : "potentially-non-eligible";
  return {
    financialResult,
    result: financialResultToLegacyResult(financialResult),
    qualifyingCriteria: eligible,
    rulesetId: READINESS_RULESET.id,
    sourceUrls: [...READINESS_RULESET.sources],
  };
}

export function resolveInvestorJurisdiction(input: {
  residenceCountryCode: string;
  residenceRegionCode?: string;
}): InvestorJurisdictionReview {
  const country = input.residenceCountryCode.trim().toUpperCase();
  const region = input.residenceRegionCode?.trim().toUpperCase();
  if (country === "CA" && region === "ON") return "ontario-licensed-review";
  if (country === "CA") return "canada-outside-ontario-review";
  return "cross-border-review";
}

/**
 * Return the preliminary individual ceiling for the Canadian offering screen.
 * Residence is deliberately excluded: it changes the separate jurisdiction
 * review, not the Canadian financial category or displayed OM ceiling. This is
 * an aggregate rolling 12-month ceiling, not a remaining balance, suitability
 * determination, or transaction approval.
 */
export function preliminaryMaximumInvestment(input: {
  financialResult: InvestorFinancialResult;
  registeredSuitabilityAdvice?: RegisteredSuitabilityAdvice;
}): PreliminaryMaximumInvestment {
  if (input.financialResult === "entity-review") return { status: "entity-review" };
  if (input.financialResult === "needs-information") return { status: "needs-information" };
  if (input.financialResult === "potentially-accredited") {
    return { status: "no-individual-om-limit" };
  }
  if (input.financialResult === "potentially-eligible") {
    const adviceConfirmed = input.registeredSuitabilityAdvice === "yes";
    return {
      status: "limit",
      limitCad: adviceConfirmed
        ? READINESS_RULESET.omLimits.eligibleWithAdvice
        : READINESS_RULESET.omLimits.eligible,
      periodMonths: 12,
      adviceConfirmed,
    };
  }
  return {
    status: "limit",
    limitCad: READINESS_RULESET.omLimits.nonEligible,
    periodMonths: 12,
    adviceConfirmed: false,
  };
}

/** @deprecated Use assessOntarioInvestor when product and purchase facts are available. */
export type InvestorReadinessDecision = OntarioInvestorAssessment;

/**
 * Compatibility boundary for the offering-independent portal resource. It
 * deliberately cannot calculate a product-specific OM amount without a
 * compliance-approved offering profile and purchase facts.
 */
export function assessInvestorReadiness(input: InvestorReadinessInput): InvestorReadinessDecision {
  return assessOntarioInvestor(input);
}
