import assert from "node:assert/strict";
import test from "node:test";
import type { InvestorReadinessAnswer, InvestorReadinessCriterion } from "../lib/capital/types.ts";
import {
  assessInvestorReadiness,
  ENTITY_ACCREDITED_CRITERIA,
  INDIVIDUAL_ACCREDITED_CRITERIA,
  INDIVIDUAL_ELIGIBLE_CRITERIA,
} from "../lib/capital/investor-readiness.ts";
import { assessOntarioInvestor } from "../lib/capital/ontario-investor-assessment.ts";
import { READINESS_RULESET } from "../lib/capital/readiness-rules.ts";
import { en, tr } from "../lib/i18n/dictionaries.ts";
import type { OfferingComplianceProfile } from "../lib/capital/types.ts";

function answers(
  criteria: readonly InvestorReadinessCriterion[],
  value: InvestorReadinessAnswer = "no",
) {
  return Object.fromEntries(criteria.map((criterion) => [criterion, value])) as Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>;
}

test("every individual accredited indicator takes precedence", () => {
  for (const criterion of INDIVIDUAL_ACCREDITED_CRITERIA) {
    const decision = assessInvestorReadiness({
      jurisdiction: "ontario",
      accountType: "individual",
      answers: { [criterion]: "yes" },
    });
    assert.equal(decision.result, "potentially-accredited");
    assert.deepEqual(decision.qualifyingCriteria, [criterion]);
    assert.equal(decision.omContext.kind, "accredited");
  }
});

test("every individual eligible indicator classifies after accredited indicators are declined", () => {
  for (const criterion of INDIVIDUAL_ELIGIBLE_CRITERIA) {
    const decision = assessInvestorReadiness({
      jurisdiction: "ontario",
      accountType: "individual",
      answers: { ...answers(INDIVIDUAL_ACCREDITED_CRITERIA), [criterion]: "yes" },
    });
    assert.equal(decision.result, "potentially-eligible");
    assert.deepEqual(decision.qualifyingCriteria, [criterion]);
    assert.deepEqual(decision.omContext, {
      kind: "eligible",
      baseLimitCad: 30_000,
      higherLimitCad: 100_000,
      periodMonths: 12,
    });
  }
});

test("exact financial facts apply strict and inclusive Ontario threshold boundaries", () => {
  const financialFacts = (overrides: Record<string, number> = {}) => ({
    financialAssetsCad: 0,
    financialAssetRelatedLiabilitiesCad: 0,
    individualIncomePriorYearOneCad: 0,
    individualIncomePriorYearTwoCad: 0,
    individualIncomeCurrentYearExpectedCad: 0,
    combinedIncomePriorYearOneCad: 0,
    combinedIncomePriorYearTwoCad: 0,
    combinedIncomeCurrentYearExpectedCad: 0,
    totalAssetsCad: 0,
    totalLiabilitiesCad: 0,
    ...overrides,
  });
  const assessFacts = (facts: Record<string, number>) => assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: { "individual-registration": "no" },
    financialFacts: { individual: facts },
  });

  // Financial assets are strict > $1M and are net of only related liabilities.
  assert.equal(assessFacts(financialFacts({ financialAssetsCad: 1_000_000 })).result, "potentially-non-eligible");
  assert.equal(assessFacts(financialFacts({ financialAssetsCad: 1_000_002, financialAssetRelatedLiabilitiesCad: 1 })).result, "potentially-accredited");

  // Net assets include all assets less all liabilities: $400k is not eligible,
  // while $5M is an accredited threshold expressed as >=.
  assert.equal(assessFacts(financialFacts({ totalAssetsCad: 400_000 })).result, "potentially-non-eligible");
  assert.equal(assessFacts(financialFacts({ totalAssetsCad: 400_001 })).result, "potentially-eligible");
  assert.equal(assessFacts(financialFacts({ totalAssetsCad: 5_000_000 })).result, "potentially-accredited");

  assert.equal(assessFacts(financialFacts({ individualIncomePriorYearOneCad: 200_000, individualIncomePriorYearTwoCad: 200_000, individualIncomeCurrentYearExpectedCad: 200_000 })).result, "potentially-eligible");
  assert.equal(assessFacts(financialFacts({ individualIncomePriorYearOneCad: 200_001, individualIncomePriorYearTwoCad: 200_001, individualIncomeCurrentYearExpectedCad: 200_001 })).result, "potentially-accredited");
  assert.equal(assessFacts(financialFacts({ combinedIncomePriorYearOneCad: 300_001, combinedIncomePriorYearTwoCad: 300_001, combinedIncomeCurrentYearExpectedCad: 300_001 })).result, "potentially-accredited");
  assert.equal(assessFacts(financialFacts({ individualIncomePriorYearOneCad: 75_000, individualIncomePriorYearTwoCad: 75_000, individualIncomeCurrentYearExpectedCad: 75_000 })).result, "potentially-non-eligible");
  assert.equal(assessFacts(financialFacts({ individualIncomePriorYearOneCad: 75_001, individualIncomePriorYearTwoCad: 75_001, individualIncomeCurrentYearExpectedCad: 75_001 })).result, "potentially-eligible");
  assert.equal(assessFacts(financialFacts({ combinedIncomePriorYearOneCad: 125_001, combinedIncomePriorYearTwoCad: 125_001, combinedIncomeCurrentYearExpectedCad: 125_001 })).result, "potentially-eligible");
});

test("a complete set of negative individual answers is potentially non-eligible", () => {
  const decision = assessInvestorReadiness({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: { ...answers(INDIVIDUAL_ACCREDITED_CRITERIA), ...answers(INDIVIDUAL_ELIGIBLE_CRITERIA) },
  });
  assert.equal(decision.result, "potentially-non-eligible");
  assert.deepEqual(decision.omContext, { kind: "non-eligible", baseLimitCad: 10_000, periodMonths: 12 });
});

test("unresolved higher-priority individual answers require manual review", () => {
  const unresolvedAccredited = assessInvestorReadiness({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: {
      ...answers(INDIVIDUAL_ACCREDITED_CRITERIA),
      ...answers(INDIVIDUAL_ELIGIBLE_CRITERIA),
      "individual-financial-assets": "unsure",
      "eligible-income": "yes",
    },
  });
  assert.equal(unresolvedAccredited.result, "manual-review");

  const unresolvedEligible = assessInvestorReadiness({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: {
      ...answers(INDIVIDUAL_ACCREDITED_CRITERIA),
      ...answers(INDIVIDUAL_ELIGIBLE_CRITERIA),
      "eligible-net-assets": "unsure",
    },
  });
  assert.equal(unresolvedEligible.result, "manual-review");
  assert.equal(unresolvedEligible.omContext.kind, "manual-review");
});

test("missing individual answers never default to non-eligible", () => {
  const decision = assessInvestorReadiness({ jurisdiction: "ontario", accountType: "individual", answers: {} });
  assert.equal(decision.result, "manual-review");
});

test("common entity accredited indicators classify, while all other entity cases require review", () => {
  for (const criterion of ENTITY_ACCREDITED_CRITERIA) {
    const decision = assessInvestorReadiness({
      jurisdiction: "ontario",
      accountType: "entity",
      answers: { [criterion]: "yes", "entity-not-created-solely-for-accredited-exemption": "yes" },
    });
    assert.equal(decision.result, "potentially-accredited");
  }

  const declined = assessInvestorReadiness({
    jurisdiction: "ontario",
    accountType: "entity",
    answers: answers(ENTITY_ACCREDITED_CRITERIA),
  });
  assert.equal(declined.result, "manual-review");

  const unresolved = assessInvestorReadiness({
    jurisdiction: "ontario",
    accountType: "entity",
    answers: { "entity-net-assets": "unsure", "entity-regulated-category": "no" },
  });
  assert.equal(unresolved.result, "manual-review");
});

const omEligibleOffering: OfferingComplianceProfile = {
  issuerLegalType: "corporation",
  isInvestmentFund: false,
  approvedOntarioExemptions: ["offering-memorandum", "accredited-investor", "family-friends-business-associates", "minimum-amount"],
  reviewOwner: "Licensed compliance",
  reviewedAt: "2026-07-16",
};

function individualAnswers(overrides: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>> = {}) {
  return {
    ...answers(INDIVIDUAL_ACCREDITED_CRITERIA),
    ...answers(INDIVIDUAL_ELIGIBLE_CRITERIA),
    ...overrides,
  };
}

test("OM capacity is calculated only for a compliance-approved non-fund offering and includes future payments", () => {
  const assessment = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: individualAnswers({ "eligible-income": "yes" }),
    offeringCompliance: omEligibleOffering,
    priorOmAcquisitionCostCad: 5_000,
    proposedAcquisitionCostCad: 20_000,
    requiredFuturePaymentsCad: 1_000,
    registeredSuitabilityAdvice: "not-recorded",
  });

  assert.equal(assessment.result, "potentially-eligible");
  assert.deepEqual(assessment.candidateRoutes, ["offering-memorandum"]);
  assert.deepEqual(assessment.omCalculation, {
    status: "calculated",
    limitCad: 30_000,
    priorAcquisitionCostCad: 5_000,
    proposedAcquisitionCostCad: 20_000,
    requiredFuturePaymentsCad: 1_000,
    totalAfterProposedCad: 26_000,
    remainingCapacityCad: 25_000,
    withinPreliminaryLimit: true,
  });
});

test("recorded registered suitability advice raises only the eligible OM preliminary cap", () => {
  const assessment = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: individualAnswers({ "eligible-net-assets": "yes" }),
    offeringCompliance: omEligibleOffering,
    proposedAcquisitionCostCad: 99_000,
    registeredSuitabilityAdvice: "recorded",
  });

  assert.equal(assessment.omCalculation.limitCad, 100_000);
  assert.equal(assessment.omCalculation.withinPreliminaryLimit, true);
});

test("the non-eligible OM preliminary cap is $10,000 and uses the rolling post-trade total", () => {
  const assessment = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: individualAnswers(),
    offeringCompliance: omEligibleOffering,
    priorOmAcquisitionCostCad: 9_000,
    proposedAcquisitionCostCad: 1_001,
  });
  assert.equal(assessment.result, "potentially-non-eligible");
  assert.equal(assessment.omCalculation.limitCad, 10_000);
  assert.equal(assessment.omCalculation.totalAfterProposedCad, 10_001);
  assert.equal(assessment.omCalculation.withinPreliminaryLimit, false);
});

test("investment-fund and unreviewed offering profiles suppress OM and relationship routes", () => {
  const investmentFund = {
    ...omEligibleOffering,
    isInvestmentFund: true,
  };
  const assessment = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: individualAnswers({ "eligible-net-assets": "yes" }),
    offeringCompliance: investmentFund,
    proposedAcquisitionCostCad: 1_000,
    relationshipClaimed: true,
    relationshipVerified: true,
  });
  assert.deepEqual(assessment.candidateRoutes, ["licensed-review"]);
  assert.equal(assessment.omCalculation.status, "not-available");

  const unreviewed = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: individualAnswers({ "eligible-net-assets": "yes" }),
    offeringCompliance: { ...omEligibleOffering, reviewedAt: undefined },
    proposedAcquisitionCostCad: 1_000,
  });
  assert.ok(unreviewed.reviewReasons.includes("offering-compliance-not-confirmed"));
  assert.equal(unreviewed.omCalculation.status, "not-available");
});

test("relationship assertions and entity minimum amount checks are never automatic shortcuts", () => {
  const relationship = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: individualAnswers(),
    offeringCompliance: omEligibleOffering,
    relationshipClaimed: true,
    relationshipVerified: false,
  });
  assert.deepEqual(relationship.candidateRoutes, ["offering-memorandum"]);
  assert.ok(relationship.reviewReasons.includes("relationship-claim-requires-verification"));

  const individualMinimum = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: individualAnswers(),
    offeringCompliance: omEligibleOffering,
    proposedAcquisitionCostCad: 150_000,
  });
  assert.ok(!individualMinimum.candidateRoutes.includes("minimum-amount"));

  const entityMinimum = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "entity",
    answers: { "entity-not-created-solely-for-accredited-exemption": "no" },
    offeringCompliance: omEligibleOffering,
    proposedAcquisitionCostCad: 150_000,
    entityBuysAsPrincipal: true,
    entityPaysCashAtDistribution: true,
    entityPurchasesSingleIssuer: true,
    entityNotCreatedSolelyForMinimumAmount: true,
  });
  assert.ok(entityMinimum.candidateRoutes.includes("minimum-amount"));

  const deferredAmount = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "entity",
    answers: { "entity-not-created-solely-for-accredited-exemption": "no" },
    offeringCompliance: omEligibleOffering,
    proposedAcquisitionCostCad: 149_999,
    requiredFuturePaymentsCad: 1,
    entityBuysAsPrincipal: true,
    entityPaysCashAtDistribution: true,
    entityPurchasesSingleIssuer: true,
    entityNotCreatedSolelyForMinimumAmount: true,
  });
  assert.ok(!deferredAmount.candidateRoutes.includes("minimum-amount"));
});

test("every non-Ontario assessment routes to manual review", () => {
  const decision = assessInvestorReadiness({
    jurisdiction: "manual-review",
    accountType: "individual",
    answers: { "individual-financial-assets": "yes" },
  });
  assert.equal(decision.result, "manual-review");
  assert.deepEqual(decision.qualifyingCriteria, []);
});

test("the ruleset is versioned from a verifiable source-effective date", () => {
  const decision = assessInvestorReadiness({ jurisdiction: "manual-review", accountType: "individual", answers: {} });
  assert.equal(decision.rulesetId, "ontario-ni-45-106-2023-09-13");
});

test("the public reference uses canonical OM amounts and explains OM and EMD in Turkish", () => {
  assert.deepEqual(READINESS_RULESET.omLimits, {
    nonEligible: 10_000,
    eligible: 30_000,
    eligibleWithAdvice: 100_000,
  });
  const trReference = tr.capitalApp.detail.guide.reference;
  const enReference = en.capitalApp.detail.guide.reference;
  assert.match(trReference.omTitle, /Teklif Muhtırası/);
  assert.match(trReference.emdTitle, /Muaf Piyasa Satıcısı/);
  assert.match(trReference.emdTitle, /Exempt Market Dealer/);
  assert.match(trReference.emdDefinition, /portfolio manager/);
  assert.match(trReference.emdDefinition, /investment dealer/);
  assert.match(enReference.emdDefinition, /speaking with any adviser is not enough/i);
});
