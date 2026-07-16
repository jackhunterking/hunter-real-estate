import {
  assessOntarioInvestor,
  ENTITY_ACCREDITED_CRITERIA,
  INDIVIDUAL_ACCREDITED_CRITERIA,
  INDIVIDUAL_ELIGIBLE_CRITERIA,
  omContextForResult,
  type OntarioInvestorAssessment,
} from "./ontario-investor-assessment.ts";
import type {
  ClientAccountType,
  ClientJurisdiction,
  InvestorReadinessAnswer,
  InvestorReadinessCriterion,
} from "./types";

export { ENTITY_ACCREDITED_CRITERIA, INDIVIDUAL_ACCREDITED_CRITERIA, INDIVIDUAL_ELIGIBLE_CRITERIA, omContextForResult };

export type InvestorReadinessInput = {
  jurisdiction: ClientJurisdiction;
  accountType: ClientAccountType;
  answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>;
};

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
