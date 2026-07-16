import type {
  ClientAccountType,
  ClientExemptionRoute,
  ClientInvestmentLimitStatus,
  ClientInvestorCategory,
  ClientJurisdiction,
  ClientQualificationCriterion,
} from "./types";

const INDIVIDUAL_ACCREDITED = new Set<ClientQualificationCriterion>([
  "ai-financial-assets",
  "ai-income-individual",
  "ai-income-with-spouse",
  "ai-net-assets",
]);

const INDIVIDUAL_ELIGIBLE = new Set<ClientQualificationCriterion>([
  "eligible-net-assets",
  "eligible-income-individual",
  "eligible-income-with-spouse",
]);

const ENTITY_ACCREDITED = new Set<ClientQualificationCriterion>([
  "entity-ai-net-assets",
  "entity-ai-other",
]);

export type InvestorAssessmentInput = {
  accountType: ClientAccountType;
  jurisdiction: ClientJurisdiction;
  qualificationCriteria: ClientQualificationCriterion[];
  investmentAmount: number;
  omInvestmentsLast12Months: number;
  registeredAdviceForHigherOmLimit: boolean;
  relationshipType?: string;
  entityBuysAsPrincipal: boolean;
  entityCanPayAtTrade: boolean;
};

export type InvestorAssessment = {
  investorCategory: ClientInvestorCategory;
  preliminaryCategory: string;
  potentialExemptionRoutes: ClientExemptionRoute[];
  preliminaryInvestmentLimit?: number;
  investmentLimitStatus: ClientInvestmentLimitStatus;
};

export function assessInvestor(input: InvestorAssessmentInput): InvestorAssessment {
  if (input.jurisdiction === "manual-review") {
    return {
      investorCategory: "cross-border-review",
      preliminaryCategory: "Cross-border investor - licensed review required",
      potentialExemptionRoutes: ["licensed-review"],
      investmentLimitStatus: "review-required",
    };
  }

  const selected = new Set(input.qualificationCriteria);
  const meetsIndividualAccredited = [...INDIVIDUAL_ACCREDITED].some((criterion) => selected.has(criterion));
  const meetsIndividualEligible = [...INDIVIDUAL_ELIGIBLE].some((criterion) => selected.has(criterion));
  const meetsEntityAccredited = [...ENTITY_ACCREDITED].some((criterion) => selected.has(criterion));

  let investorCategory: ClientInvestorCategory;
  if (input.accountType === "entity") {
    investorCategory = meetsEntityAccredited ? "accredited-investor" : "entity-review";
  } else if (meetsIndividualAccredited) {
    investorCategory = "accredited-investor";
  } else if (meetsIndividualEligible) {
    investorCategory = "eligible-investor";
  } else {
    investorCategory = "non-eligible-investor";
  }

  const routes: ClientExemptionRoute[] = [];
  if (investorCategory === "accredited-investor") routes.push("accredited-investor");
  if (input.accountType === "individual") routes.push("offering-memorandum");
  if (input.relationshipType?.startsWith("ffba:")) routes.push("family-friends-business-associates");
  if (input.relationshipType?.startsWith("private:")) routes.push("private-issuer");
  if (
    input.accountType === "entity" &&
    input.investmentAmount >= 150_000 &&
    input.entityBuysAsPrincipal &&
    input.entityCanPayAtTrade
  ) routes.push("minimum-amount");
  if (!routes.length) routes.push("licensed-review");

  let preliminaryInvestmentLimit: number | undefined;
  let investmentLimitStatus: ClientInvestmentLimitStatus = "not-applicable";
  if (input.accountType === "individual" && investorCategory !== "accredited-investor") {
    preliminaryInvestmentLimit = investorCategory === "eligible-investor"
      ? input.registeredAdviceForHigherOmLimit ? 100_000 : 30_000
      : 10_000;
    investmentLimitStatus = input.omInvestmentsLast12Months + input.investmentAmount <= preliminaryInvestmentLimit
      ? "within-preliminary-limit"
      : "exceeds-preliminary-limit";
  } else if (investorCategory === "entity-review") {
    investmentLimitStatus = "review-required";
  }

  const preliminaryCategory = investorCategory === "accredited-investor"
    ? "Accredited investor indicator - licensed verification required"
    : investorCategory === "eligible-investor"
      ? "Eligible investor indicator - licensed verification required"
      : investorCategory === "non-eligible-investor"
        ? "Non-eligible investor - OM route and limits require licensed review"
        : "Entity classification - licensed review required";

  return {
    investorCategory,
    preliminaryCategory,
    potentialExemptionRoutes: routes,
    preliminaryInvestmentLimit,
    investmentLimitStatus,
  };
}
