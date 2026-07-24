import type { Lang } from "../i18n/dictionaries.ts";
export type { Lang };

/** Public schema version for the offerings API payloads. */
export const CAPITAL_SCHEMA_VERSION = "1.0.0";
/**
 * Content-level localized string. `tr` and `en` are the authored source of
 * truth; `fr` and `es` are optional machine translations that fall back to
 * English via the `tx()` resolver (see lib/i18n/localize.ts) when absent.
 */
export type LocalizedText = { tr: string; en: string; fr?: string; es?: string };
export type Approval = "approved-public" | "review-required" | "private";
export type MetricClassification = "historical" | "current" | "target" | "illustrative";

/**
 * Optional media slot. Real photos/renders drop in here later without any
 * component change; when `src` is absent, the presentation layer falls back to
 * an elegant generated placeholder (see lib/capital/present.ts).
 */
export type ImageSlot = {
  src?: string;
  /**
   * Supabase Storage reference. When present, the server read layer
   * (lib/capital/repository-server.ts) resolves `{bucket,path}` to a public
   * `src` URL. `src` may still carry a legacy /public path during migration;
   * a resolved Storage URL takes precedence.
   */
  bucket?: string;
  path?: string;
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
 * Who a published fact is written for. `advisor` marks dealer-compensation
 * disclosures — selling commission, trailer fee, the sales channel that names
 * the dealer — which belong in the Offering Memorandum and in the advisor view,
 * not on the page an investor is deciding from. Absent means `investor`.
 */
export type FactAudience = "investor" | "advisor";

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
  audience?: FactAudience;
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
  /**
   * Plain unit count, promoted out of `units` so the portfolio can be summed.
   * A fund's published unit total must equal the sum of these across its
   * buildings; a mismatch means a property is missing or miscounted.
   */
  unitCount?: number;
  acquiredOn?: string;
  purchasePrice?: number;
  /** e.g. "50% JV ownership" — qualifies how much of the asset the fund holds. */
  ownershipNote?: LocalizedText;
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
  /**
   * Direct URL for a public document. For public-bucket files the server read
   * layer overrides this with a resolved Supabase public URL; it may also carry
   * a legacy /public path or an external link during migration.
   */
  href?: string;
  /**
   * Supabase Storage reference. Public-bucket docs resolve to a public `href`;
   * private-bucket docs keep `{bucket,path}` (no href) and are opened via a
   * short-lived signed URL from /api/hnc-offering-documents.
   */
  bucket?: "offering-public" | "offering-private";
  path?: string;
};

export type TrailingReturn = {
  period: LocalizedText;
  value: string;
  note?: LocalizedText;
};

export type RiskCategory =
  | "investment"
  | "regulatory"
  | "leverage"
  | "business"
  | "redemption"
  | "tax"
  | "other";

/**
 * A risk as authored. Fund documents group risks (investment / regulatory /
 * leverage / …), so the authoring form carries a category; the published
 * snapshot flattens `risks` to plain LocalizedText for the presenter and emits
 * the grouped view separately as `riskGroups`. Both shapes are accepted on
 * write — use `riskText()` (lib/capital/present.ts) to read one.
 */
export type RiskEntry = LocalizedText | { text: LocalizedText; category?: RiskCategory };

export type RiskGroup = { category: RiskCategory; items: LocalizedText[] };

/**
 * A point from the manager's own materials: what makes the fund distinctive
 * (`differentiator`), how it acquires (`strategy`), or an operating programme
 * with a quantified target (`initiative`).
 */
export type StrategyPoint = {
  id?: string;
  kind: "differentiator" | "strategy" | "initiative";
  label: LocalizedText;
  body?: LocalizedText;
  metric?: LocalizedText;
  sourceId?: string;
  sourcePage?: number;
};

/**
 * The document a `SourcedValue.sourceId` points at. Without these rows a
 * sourceId is an unresolvable string and provenance cannot be shown or audited.
 */
export type OfferingSource = {
  id: string;
  title: LocalizedText;
  publisher?: string;
  publishedOn?: string;
  documentSlug?: string;
  url?: string;
};

/** How often the manager publishes updated figures for this investment. */
export type UpdateCadence = "quarterly" | "semi-annual" | "annual" | "ad-hoc";

/** Derived from `next_review_due_at` — see app.offering_freshness_status(). */
export type FreshnessStatus = "current" | "due-soon" | "overdue" | "unscheduled";

export type ReviewOutcome = "updated" | "no-change" | "awaiting-source";

/**
 * An independent third party on the file. `scope` and `asOfDate` say what the
 * firm actually did and when — an auditor's opinion covers a stated fiscal year
 * and carries its own report date, which is not the date Hunter last checked the
 * profile. Without them the name alone invites the reader to attach whatever
 * date is nearby to the audit.
 */
export type ProviderInfo = {
  name: string;
  url?: string;
  scope?: LocalizedText;
  asOfDate?: string;
  sourceId?: string;
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
  risks: RiskEntry[];
  /** Categorised view of `risks`, emitted by compose. Read-only. */
  riskGroups?: RiskGroup[];
  strategyPoints?: StrategyPoint[];
  sources?: OfferingSource[];
  fundDefinedFacts?: FundDefinedFact[];
  media?: MediaSet;
  offeringSize?: SourcedValue<number>;
  unitsTotal?: SourcedValue<number>;
  // Fact-sheet fields (all optional)
  fundType?: LocalizedText;
  /**
   * The one-line legal form ("Open-ended unincorporated investment trust
   * (Ontario)"). `fundType` carries the full statement including its securities-
   * law caveat, which reads as a disclosure and belongs with the document rather
   * than in a three-column summary card.
   */
  structureLabel?: LocalizedText;
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
  /**
   * Data-freshness contract. `dataAsOf` is the reporting period END the figures
   * describe (a date, so it does arithmetic); `dataPeriodLabel` is the manager's
   * own words for it ("Q1 2026"), shown verbatim. `managerPublicUrl` is the
   * manager's own fund page — the first thing a reviewer opens to check whether
   * our figures have fallen behind theirs.
   */
  updateCadence?: UpdateCadence;
  dataAsOf?: string;
  dataPeriodLabel?: string;
  managerPublicUrl?: string;
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

/**
 * Deliberately small projection used by the unauthenticated marketing page.
 * Full offering bundles must stay inside authenticated portal surfaces.
 */
export type PublicOfferingPropertyPreview = {
  id: string;
  name: LocalizedText;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  assetClassId: string;
  status: Property["status"];
  media?: Pick<MediaSet, "card" | "gallery">;
};

export type PublicOfferingPreview = {
  id: string;
  slug: string;
  name: LocalizedText;
  shortName: LocalizedText;
  managerName: LocalizedText;
  summary: LocalizedText;
  status: Offering["status"];
  media?: Pick<MediaSet, "card" | "banner" | "logo" | "gallery">;
  strategyIds: string[];
  assetClassIds: string[];
  regionIds: string[];
  minimumInvestment?: SourcedValue<number>;
  targetReturn?: SourcedValue<string>;
  targetDistribution?: SourcedValue<string>;
  portfolioFacts: SourcedValue<string>[];
  aum?: SourcedValue<string>;
  term?: SourcedValue<string>;
  riskProfile?: LocalizedText;
  registeredAccountTypes?: string[];
  performance?: { period: LocalizedText; value: string }[];
  performanceNote?: LocalizedText;
  properties: PublicOfferingPropertyPreview[];
  /** True when an independent auditor is on file — drives the trust badge. */
  audited: boolean;
  verifiedAt: string;
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
