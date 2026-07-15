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
};

export type MediaSet = {
  card?: ImageSlot;
  banner?: ImageSlot;
  logo?: ImageSlot;
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
};

export type Property = {
  id: string;
  offeringIds: string[];
  managerId: string;
  name: LocalizedText;
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
  lastUpdated?: string;
  verifiedAt: string;
};

export type OfferingBundle = Offering & {
  manager: Manager;
  shareClasses: ShareClass[];
  properties: Property[];
  documents: OfferingDocument[];
};

export type PartnerTier = "associate" | "principal" | "managingPartner";

export type ReferralStatus =
  | "introduced"
  | "contacted"
  | "compliance-review"
  | "accepted"
  | "funded";

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
  primaryMarket?: LocalizedText;
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

export type ClientReadiness = {
  objective: string;
  horizon: string;
  riskTolerance: string;
  lossCapacity: string;
  liquidityNeed: string;
  experience: string;
  preliminaryCategory: string;
  investorCategory: ClientInvestorCategory;
  potentialExemptionRoutes: ClientExemptionRoute[];
  qualificationCriteria: ClientQualificationCriterion[];
  omInvestmentsLast12Months: number;
  registeredAdviceForHigherOmLimit: boolean;
  preliminaryInvestmentLimit?: number;
  investmentLimitStatus: ClientInvestmentLimitStatus;
  relationshipType?: string;
  relationshipPerson?: string;
  entityBuysAsPrincipal: boolean;
  entityCanPayAtTrade: boolean;
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
  accountType: ClientAccountType;
  firstName: string;
  lastName: string;
  displayName: string;
  organization?: string;
  email: string;
  phone?: string;
  nationality: string;
  city: string;
  country: string;
  region?: string;
  jurisdiction: ClientJurisdiction;
  status: ReferralStatus;
  introducedAt: string;
  updatedAt: string;
  nextAction: LocalizedText;
  fundInterests: ClientFundInterest[];
  readiness: ClientReadiness;
  documents: ClientDocument[];
  activity: ClientActivity[];
  contactConsentAt: string;
  accuracyConsentAt: string;
};
