import { assessOntarioInvestor, type OntarioInvestorAssessment } from "./ontario-investor-assessment.ts";
import type {
  ClientAccountType,
  ClientJurisdiction,
  ClientQualificationCriterion,
  InvestorReadinessAnswer,
  InvestorReadinessCriterion,
  OfferingComplianceProfile,
} from "./types";

const criterionMap: Partial<Record<ClientQualificationCriterion, InvestorReadinessCriterion>> = {
  "ai-financial-assets": "individual-financial-assets",
  "ai-income-individual": "individual-income",
  "ai-income-with-spouse": "individual-spousal-income",
  "ai-net-assets": "individual-net-assets",
  "eligible-net-assets": "eligible-net-assets",
  "eligible-income-individual": "eligible-income",
  "eligible-income-with-spouse": "eligible-spousal-income",
  "entity-ai-net-assets": "entity-net-assets",
  "entity-ai-other": "entity-regulated-category",
};

export type InvestorAssessmentInput = {
  accountType: ClientAccountType;
  jurisdiction: ClientJurisdiction;
  qualificationCriteria: ClientQualificationCriterion[];
  investmentAmount?: number;
  omInvestmentsLast12Months?: number;
  requiredFuturePayments?: number;
  registeredAdviceForHigherOmLimit?: boolean;
  relationshipType?: string;
  relationshipVerified?: boolean;
  entityBuysAsPrincipal?: boolean;
  entityCanPayAtTrade?: boolean;
  entitySingleIssuer?: boolean;
  entityNotCreatedSolelyForExemption?: boolean;
  offeringCompliance?: OfferingComplianceProfile;
};

export type InvestorAssessment = OntarioInvestorAssessment;

/** @deprecated Pass the canonical statement answers directly to assessOntarioInvestor. */
export function assessInvestor(input: InvestorAssessmentInput): InvestorAssessment {
  const answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>> = {};
  for (const criterion of input.qualificationCriteria) {
    const mapped = criterionMap[criterion];
    if (mapped) answers[mapped] = "yes";
  }
  if (input.accountType === "entity" && input.entityNotCreatedSolelyForExemption) {
    answers["entity-not-created-solely-for-accredited-exemption"] = "yes";
  }
  return assessOntarioInvestor({
    jurisdiction: input.jurisdiction,
    accountType: input.accountType,
    answers,
    offeringCompliance: input.offeringCompliance,
    proposedAcquisitionCostCad: input.investmentAmount,
    priorOmAcquisitionCostCad: input.omInvestmentsLast12Months,
    requiredFuturePaymentsCad: input.requiredFuturePayments,
    registeredSuitabilityAdvice: input.registeredAdviceForHigherOmLimit ? "recorded" : "not-recorded",
    relationshipClaimed: Boolean(input.relationshipType),
    relationshipVerified: input.relationshipVerified,
    entityBuysAsPrincipal: input.entityBuysAsPrincipal,
    entityPaysCashAtDistribution: input.entityCanPayAtTrade,
    entityPurchasesSingleIssuer: input.entitySingleIssuer,
    entityNotCreatedSolelyForMinimumAmount: input.entityNotCreatedSolelyForExemption,
  });
}
