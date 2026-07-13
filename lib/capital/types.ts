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
