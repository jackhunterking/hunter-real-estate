export type Lang = "en" | "tr";
export type LocalizedText = Record<Lang, string>;
export type Approval = "approved-public" | "review-required" | "private";
export type MetricClassification = "historical" | "current" | "target" | "illustrative";

/**
 * Optional media slot. Real photos/renders drop in here later without any
 * component change; when `src` is absent, the presentation layer falls back to
 * an elegant generated placeholder (see lib/capital/present.ts).
 */
export type ImageSlot = {
  src?: string;
  alt?: LocalizedText;
  kind?: "photo" | "render";
  sourceId?: string;
  verifiedAt?: string;
};

export type MediaSet = {
  card?: ImageSlot;
  banner?: ImageSlot;
  logo?: ImageSlot;
  gallery?: ImageSlot[];
};

export type SourceReference = {
  id: string;
  title: string;
  effectiveDate: string;
  visibility: "public" | "approved-investor" | "dealer-only";
};

export type SourcedValue<T = string | number> = {
  value: T;
  classification: MetricClassification;
  asOfDate: string;
  sourceId: string;
  sourcePage?: number;
  approval: Approval;
};

/**
 * A label and value published by the fund. The interface must display both
 * verbatim and may only show a class-specific fact for the selected class.
 */
export type FundDefinedFact = {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
  category: "target" | "fee" | "liquidity" | "lockup" | "early-exit" | "term";
  shareClassId?: string;
  sourceId: string;
  sourcePage?: number;
  effectiveDate: string;
  approval: Approval;
};

export type Manager = {
  id: string;
  slug: string;
  name: LocalizedText;
  headquarters: { city: string; province: string; country: string };
  description: LocalizedText;
  website?: string;
  officeAddress?: LocalizedText;
};

export type ShareClass = {
  id: string;
  offeringId: string;
  name: string;
  minimumInvestment?: SourcedValue<number>;
  unitPrice?: SourcedValue<number>;
  targetReturn?: SourcedValue<string>;
  targetDistribution?: SourcedValue<string>;
  distributionPerUnit?: SourcedValue<string>;
  term?: SourcedValue<string>;
  redemptionTerms?: LocalizedText;
  drip?: LocalizedText;
  registeredAccountTypes: string[];
  fundDefinedFacts?: FundDefinedFact[];
};

export type Property = {
  id: string;
  offeringIds: string[];
  managerId: string;
  name: LocalizedText;
  address?: LocalizedText;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  assetClassId: string;
  units?: SourcedValue<number>;
  squareFeet?: SourcedValue<number>;
  status: "stabilized" | "new-construction" | "value-add" | "commercial";
  image?: string;
  media?: MediaSet;
  verificationStatus: "verified" | "partial" | "pending";
  listingUrl?: string; // external rental listing page for this building
};

export type OfferingDocument = {
  id: string;
  offeringId: string;
  title: LocalizedText;
  description?: LocalizedText;
  type: "fact-sheet" | "presentation" | "offering-memorandum" | "term-sheet" | "subscription-agreement" | "report";
  effectiveDate: string;
  version: string;
  sourceId?: string;
  visibility: "public" | "approved-investor" | "private";
  href?: string;
};

export type TrailingReturn = {
  period: LocalizedText;
  value: string;
  note?: LocalizedText;
};

export type ProviderInfo = {
  name: string;
  url?: string;
};

export type ServiceProviders = {
  auditor?: ProviderInfo;
  legalCounsel?: ProviderInfo;
  appraiser?: ProviderInfo;
};

export type Offering = {
  id: string;
  slug: string;
  managerId: string;
  name: LocalizedText;
  shortName: LocalizedText;
  summary: LocalizedText;
  thesis: LocalizedText;
  status: "available" | "coming-soon" | "paused" | "closed";
  strategyIds: string[];
  assetClassIds: string[];
  regionIds: string[];
  shareClassIds: string[];
  propertyIds: string[];
  documentIds: string[];
  featured: boolean;
  portfolioFacts: SourcedValue<string>[];
  risks: LocalizedText[];
  fundDefinedFacts?: FundDefinedFact[];
  media?: MediaSet;
  offeringSize?: SourcedValue<number>;
  unitsTotal?: SourcedValue<number>;
  // Fact-sheet fields (all optional)
  fundType?: LocalizedText;
  fundStatus?: LocalizedText;
  inceptionDate?: string;
  aum?: SourcedValue<string>;
  amountRaised?: SourcedValue<number>;
  fundingPercent?: number;
  managementFee?: LocalizedText;
  valuationFrequency?: LocalizedText;
  distributionFrequency?: LocalizedText;
  riskProfile?: LocalizedText;
  highlights?: LocalizedText[];
  trailingReturns?: TrailingReturn[];
  trailingReturnsNote?: LocalizedText;
  serviceProviders?: ServiceProviders;
  complianceProfile: OfferingComplianceProfile;
  lastUpdated?: string;
  verifiedAt: string;
};

/**
 * Product-specific facts that must be approved by compliance before an
 * investor assessment may surface a possible prospectus-exemption route.
 * This intentionally describes distribution availability, not investor status.
 */
export type OfferingComplianceProfile = {
  issuerLegalType: "corporation" | "trust" | "partnership" | "other";
  isInvestmentFund: boolean;
  approvedOntarioExemptions: ClientExemptionRoute[];
  reviewOwner: string;
  reviewedAt?: string;
};

export type OfferingBundle = Offering & {
  manager: Manager;
  shareClasses: ShareClass[];
  properties: Property[];
  documents: OfferingDocument[];
};

export type PartnerTier = "associate" | "principal" | "managingPartner";
export type PartnerCommissionAllocationPercentage = 30 | 40 | 50;

export type FundCommissionScheduleStatus =
  | "draft"
  | "published"
  | "superseded"
  | "withdrawn";

export type FundCommissionSchedule = {
  id: string;
  offeringId: string;
  grossCommissionBps: number;
  status: FundCommissionScheduleStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  internalNote?: string;
  createdBy?: string;
  publishedBy?: string;
  publishedAt?: string;
  supersededBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReferralStatus =
  | "introduced"
  | "contacted"
  | "compliance-review"
  | "accepted"
  | "funded";

export const REFERRAL_STATUS_ORDER: ReferralStatus[] = [
  "introduced",
  "contacted",
  "compliance-review",
  "accepted",
  "funded",
];

export type PartnerAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

export type PartnerContact = {
  fullName?: string;
  role?: string;
  email?: string;
  phone?: string;
};

export type PartnerSummary = {
  partnerName: string;
  annualClearedCapital: number;
  tier: PartnerTier;
  nextTier: PartnerTier;
  nextTierThreshold: number;
  activeProducts: number;
  referralCount: number;
  partnerId?: string;
  accountStatus?: "active" | "under-review" | "inactive";
  relationshipSince?: string;
  organizationAddress?: PartnerAddress;
  primaryContact?: PartnerContact;
  relationshipManager?: string;
  profileReviewedAt?: string;
};

export type ClientAccountType = "individual" | "entity";
export type ClientJurisdiction = "ontario" | "manual-review";
export type ClientInvestorCategory =
  | "accredited-investor"
  | "eligible-investor"
  | "non-eligible-investor"
  | "entity-review"
  | "cross-border-review"
  | "undetermined";
export type ClientExemptionRoute =
  | "accredited-investor"
  | "offering-memorandum"
  | "family-friends-business-associates"
  | "private-issuer"
  | "minimum-amount"
  | "licensed-review";
export type ClientQualificationCriterion =
  | "ai-financial-assets"
  | "ai-income-individual"
  | "ai-income-with-spouse"
  | "ai-net-assets"
  | "eligible-net-assets"
  | "eligible-income-individual"
  | "eligible-income-with-spouse"
  | "entity-ai-net-assets"
  | "entity-ai-other";
export type ClientInvestmentLimitStatus =
  | "not-applicable"
  | "within-preliminary-limit"
  | "exceeds-preliminary-limit"
  | "review-required";
export type ClientDocumentStatus =
  | "missing"
  | "received"
  | "under-review"
  | "approved"
  | "action-required";
export type ClientDocumentCategory =
  | "identity-address"
  | "eligibility"
  | "source-of-funds"
  | "fund-specific";

export type ClientFundInterest = {
  id: string;
  offeringId: string;
  shareClassId?: string;
  shareQuantity?: number;
  amount: number;
  timeline: string;
  accountPreference: string;
  primary: boolean;
  createdAt: string;
};

export type ClientSuitabilityProfile = {
  objective: string;
  horizon: string;
  riskTolerance: string;
  lossCapacity: string;
  liquidityNeed: string;
  experience: string;
};

export type InvestorReadinessAnswer = "yes" | "no" | "unsure";

export type InvestorReadinessCriterion =
  | "individual-registration"
  | "individual-financial-assets"
  | "individual-income"
  | "individual-spousal-income"
  | "individual-net-assets"
  | "eligible-net-assets"
  | "eligible-income"
  | "eligible-spousal-income"
  | "entity-net-assets"
  | "entity-regulated-category"
  | "entity-not-created-solely-for-accredited-exemption";

export type InvestorReadinessResult =
  | "potentially-accredited"
  | "potentially-eligible"
  | "potentially-non-eligible"
  | "manual-review";

export type InvestorFinancialResult =
  | "potentially-accredited"
  | "potentially-eligible"
  | "potentially-non-eligible"
  | "needs-information"
  | "entity-review";

export type InvestorJurisdictionReview =
  | "ontario-licensed-review"
  | "canada-outside-ontario-review"
  | "cross-border-review";

export type InvestorReadinessOmContext = {
  kind: "accredited" | "eligible" | "non-eligible" | "manual-review";
  baseLimitCad?: number;
  higherLimitCad?: number;
  periodMonths?: number;
};

export type InvestorReadinessReviewReason =
  | "outside-ontario"
  | "incomplete-or-uncertain-financial-facts"
  | "entity-category-requires-verification"
  | "entity-anti-syndication-not-confirmed"
  | "offering-compliance-not-confirmed"
  | "offering-does-not-support-om"
  | "relationship-claim-requires-verification"
  | "minimum-amount-conditions-not-confirmed"
  | "registered-advice-not-recorded";

export type InvestorReadinessOmCalculation = {
  status: "not-requested" | "not-available" | "manual-review" | "calculated" | "not-applicable";
  limitCad?: number;
  priorAcquisitionCostCad?: number;
  proposedAcquisitionCostCad?: number;
  requiredFuturePaymentsCad?: number;
  totalAfterProposedCad?: number;
  remainingCapacityCad?: number;
  withinPreliminaryLimit?: boolean;
};

export type InvestorReadinessReassessmentTrigger =
  | "jurisdiction"
  | "purchaser-type"
  | "offering"
  | "proposed-acquisition-cost"
  | "prior-om-acquisition-cost"
  | "required-future-payments"
  | "registered-suitability-advice"
  | "relationship-facts"
  | "entity-facts"
  | "offering-compliance-metadata"
  | "financial-facts";

export type InvestorReadinessAssessment = {
  id: string;
  clientId: string;
  jurisdiction: ClientJurisdiction;
  accountType: ClientAccountType;
  answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>;
  result: InvestorReadinessResult;
  /**
   * New assessments keep the financial threshold result separate from the
   * residence/compliance review. Older records may only have `result`.
   */
  financialResult?: InvestorFinancialResult;
  jurisdictionReview?: InvestorJurisdictionReview;
  residenceCountryCode?: string;
  residenceRegionCode?: string;
  qualifyingCriteria: InvestorReadinessCriterion[];
  omContext: InvestorReadinessOmContext;
  candidateRoutes?: ClientExemptionRoute[];
  reviewReasons?: InvestorReadinessReviewReason[];
  omCalculation?: InvestorReadinessOmCalculation;
  assessmentInput?: Record<string, unknown>;
  rulesetId: string;
  sourceUrls?: string[];
  reassessmentTriggers?: InvestorReadinessReassessmentTrigger[];
  assessor: string;
  acknowledgementAt: string;
  assessedAt: string;
};

export type ClientDocument = {
  id: string;
  label: LocalizedText;
  category: ClientDocumentCategory;
  status: ClientDocumentStatus;
  filename?: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
  objectUrl?: string;
};

export type ClientActivity = {
  id: string;
  kind: "created" | "status" | "document" | "fund" | "note";
  description: LocalizedText;
  occurredAt: string;
};

export type ClientRecord = {
  id: string;
  ownerUserId?: string;
  firmId?: string;
  accountType: ClientAccountType;
  firstName: string;
  lastName: string;
  displayName: string;
  organization?: string;
  email: string;
  phone?: string;
  nationality?: string;
  city?: string;
  country: string;
  region?: string;
  jurisdiction: ClientJurisdiction;
  status: ReferralStatus;
  introducedAt: string;
  updatedAt: string;
  nextAction: LocalizedText;
  fundInterests: ClientFundInterest[];
  suitabilityProfile?: ClientSuitabilityProfile;
  investorReadinessAssessments: InvestorReadinessAssessment[];
  documents: ClientDocument[];
  activity: ClientActivity[];
  contactConsentAt: string;
  accuracyConsentAt: string;
};
