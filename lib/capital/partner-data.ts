import type {
  ClientDocument,
  ClientDocumentStatus,
  ClientRecord,
  ClientSuitabilityProfile,
  InvestorReadinessAssessment,
  InvestorReadinessCriterion,
  InvestorReadinessResult,
  PartnerSummary,
  PartnerTier,
  ReferralStatus,
} from "./types";
import { omContextForResult } from "./investor-readiness";
import { READINESS_RULESET } from "./readiness";

export const PARTNER_TIER_THRESHOLDS: Record<PartnerTier, number> = {
  associate: 50_000,
  principal: 1_000_000,
  managingPartner: 5_000_000,
};

export const partnerSummary: PartnerSummary = {
  partnerName: "Marmara Wealth Partners",
  annualClearedCapital: 650_000,
  tier: "associate",
  nextTier: "principal",
  nextTierThreshold: PARTNER_TIER_THRESHOLDS.principal,
  activeProducts: 2,
  referralCount: 4,
  partnerId: "HNC-MWP-001",
  accountStatus: "active",
  relationshipSince: "2026-01-01",
  // Fictional production-style demo data for the partner portal preview.
  organizationAddress: {
    line1: "Büyükdere Caddesi No: 201",
    line2: "Levent",
    city: "Şişli",
    region: "İstanbul",
    postalCode: "34394",
    country: "Türkiye",
  },
  primaryContact: {
    fullName: "Selin Aydın",
    role: "Managing Partner",
    email: "selin.aydin@marmarawealth.example",
    phone: "+90 212 555 01 48",
  },
  relationshipManager: "Jack Hunter",
  profileReviewedAt: "2026-07-01",
};

const documentLabels = {
  identity: { en: "Government-issued identification", tr: "Resmî kimlik belgesi" },
  address: { en: "Proof of address", tr: "Adres kanıtı" },
  eligibility: { en: "Eligibility support", tr: "Uygunluk desteği" },
  funds: { en: "Source-of-funds support", tr: "Fon kaynağı desteği" },
  subscription: { en: "Fund subscription package", tr: "Fon abonelik paketi" },
} as const;

function clientDocuments(statuses: ClientDocumentStatus[]): ClientDocument[] {
  const definitions: Array<[string, ClientDocument["label"], ClientDocument["category"]]> = [
    ["identity", documentLabels.identity, "identity-address"],
    ["address", documentLabels.address, "identity-address"],
    ["eligibility", documentLabels.eligibility, "eligibility"],
    ["funds", documentLabels.funds, "source-of-funds"],
    ["subscription", documentLabels.subscription, "fund-specific"],
  ];
  return definitions.map(([id, label, category], index) => {
    const status = statuses[index] ?? "missing";
    const hasFile = status !== "missing";
    return {
      id,
      label,
      category,
      status,
      filename: hasFile ? `${id}-document.pdf` : undefined,
      size: hasFile ? 420_000 + index * 73_000 : undefined,
      mimeType: hasFile ? "application/pdf" : undefined,
      uploadedAt: hasFile ? `2026-07-${String(8 + index).padStart(2, "0")}T14:30:00.000Z` : undefined,
    };
  });
}

const commonSuitability: ClientSuitabilityProfile = {
  objective: "Balanced income and growth",
  horizon: "5+ years",
  riskTolerance: "Moderate",
  lossCapacity: "Some loss",
  liquidityNeed: "Low",
  experience: "Some private market experience",
};

function seedAssessment(input: {
  clientId: string;
  accountType: ClientRecord["accountType"];
  jurisdiction: ClientRecord["jurisdiction"];
  result: InvestorReadinessResult;
  assessedAt: string;
  criterion?: InvestorReadinessCriterion;
}): InvestorReadinessAssessment {
  return {
    id: `${input.clientId}-readiness-1`,
    clientId: input.clientId,
    accountType: input.accountType,
    jurisdiction: input.jurisdiction,
    answers: input.criterion ? { [input.criterion]: "yes" } : {},
    result: input.result,
    qualifyingCriteria: input.criterion ? [input.criterion] : [],
    omContext: omContextForResult(input.result),
    rulesetId: READINESS_RULESET.id,
    assessor: "Marmara Wealth Partners",
    acknowledgementAt: input.assessedAt,
    assessedAt: input.assessedAt,
  };
}

export const initialClients: ClientRecord[] = [
  {
    id: "ref-1042", ownerUserId: "demo-partner", firmId: "org-marmara", accountType: "individual", firstName: "Ayşe", lastName: "Demir", displayName: "A. Demir", organization: "Demir Family Office", email: "ayse.demir@example.com", phone: "+90 212 555 0142", nationality: "Türkiye", city: "Istanbul", country: "Türkiye", jurisdiction: "manual-review", status: "funded", introducedAt: "2026-06-18", updatedAt: "2026-07-12T10:00:00.000Z", nextAction: { en: "Monitor funded position", tr: "Fonlanan pozisyonu takip edin" },
    fundInterests: [{ id: "interest-1042-1", offeringId: "lankin-apartment-reit", shareClassId: "lankin-class-a", amount: 250_000, timeline: "Now", accountPreference: "Corporate/entity", primary: true, createdAt: "2026-06-18T12:00:00.000Z" }], suitabilityProfile: commonSuitability, investorReadinessAssessments: [seedAssessment({ clientId: "ref-1042", accountType: "individual", jurisdiction: "manual-review", result: "manual-review", assessedAt: "2026-06-18T12:00:00.000Z" })], documents: clientDocuments(["approved", "approved", "approved", "approved", "approved"]), contactConsentAt: "2026-06-18T12:00:00.000Z", accuracyConsentAt: "2026-06-18T12:00:00.000Z", activity: [
      { id: "a-1042-3", kind: "status", description: { en: "Investment marked as funded", tr: "Yatırım fonlandı olarak işaretlendi" }, occurredAt: "2026-07-12T10:00:00.000Z" },
      { id: "a-1042-2", kind: "document", description: { en: "Subscription package approved", tr: "Abonelik paketi onaylandı" }, occurredAt: "2026-07-08T10:00:00.000Z" },
      { id: "a-1042-1", kind: "created", description: { en: "Client introduction created", tr: "Müşteri tanıştırması oluşturuldu" }, occurredAt: "2026-06-18T12:00:00.000Z" },
    ],
  },
  {
    id: "ref-1048", ownerUserId: "demo-partner", firmId: "org-marmara", accountType: "individual", firstName: "Selim", lastName: "Kaya", displayName: "S. Kaya", email: "selim.kaya@example.com", nationality: "Türkiye", city: "Toronto", country: "Canada", region: "Ontario", jurisdiction: "ontario", status: "accepted", introducedAt: "2026-06-27", updatedAt: "2026-07-11T15:15:00.000Z", nextAction: { en: "Complete subscription package", tr: "Abonelik paketini tamamlayın" },
    fundInterests: [{ id: "interest-1048-1", offeringId: "legacy-epiphany", shareClassId: "legacy-class-a", amount: 400_000, timeline: "Now", accountPreference: "Non-registered", primary: true, createdAt: "2026-06-27T13:00:00.000Z" }], suitabilityProfile: commonSuitability, investorReadinessAssessments: [seedAssessment({ clientId: "ref-1048", accountType: "individual", jurisdiction: "ontario", result: "potentially-accredited", criterion: "individual-financial-assets", assessedAt: "2026-06-27T13:00:00.000Z" })], documents: clientDocuments(["approved", "approved", "approved", "under-review", "received"]), contactConsentAt: "2026-06-27T13:00:00.000Z", accuracyConsentAt: "2026-06-27T13:00:00.000Z", activity: [
      { id: "a-1048-2", kind: "status", description: { en: "Client accepted after licensed review", tr: "Müşteri lisanslı inceleme sonrası kabul edildi" }, occurredAt: "2026-07-11T15:15:00.000Z" },
      { id: "a-1048-1", kind: "created", description: { en: "Client introduction created", tr: "Müşteri tanıştırması oluşturuldu" }, occurredAt: "2026-06-27T13:00:00.000Z" },
    ],
  },
  {
    id: "ref-1051", ownerUserId: "demo-partner", firmId: "org-marmara", accountType: "entity", firstName: "Mert", lastName: "Aydın", displayName: "M. Aydın", organization: "Aydın Holdings", email: "mert.aydin@example.com", phone: "+90 212 555 0151", nationality: "Türkiye", city: "Istanbul", country: "Türkiye", jurisdiction: "manual-review", status: "compliance-review", introducedAt: "2026-07-03", updatedAt: "2026-07-13T09:20:00.000Z", nextAction: { en: "Licensed document review in progress", tr: "Lisanslı belge incelemesi sürüyor" },
    fundInterests: [{ id: "interest-1051-1", offeringId: "lankin-apartment-reit", shareClassId: "lankin-class-a", amount: 150_000, timeline: "1-3 months", accountPreference: "Corporate/entity", primary: true, createdAt: "2026-07-03T11:00:00.000Z" }], suitabilityProfile: commonSuitability, investorReadinessAssessments: [seedAssessment({ clientId: "ref-1051", accountType: "entity", jurisdiction: "manual-review", result: "manual-review", assessedAt: "2026-07-03T11:00:00.000Z" })], documents: clientDocuments(["approved", "under-review", "under-review", "action-required", "missing"]), contactConsentAt: "2026-07-03T11:00:00.000Z", accuracyConsentAt: "2026-07-03T11:00:00.000Z", activity: [
      { id: "a-1051-2", kind: "document", description: { en: "Source-of-funds support needs replacement", tr: "Fon kaynağı desteğinin değiştirilmesi gerekiyor" }, occurredAt: "2026-07-13T09:20:00.000Z" },
      { id: "a-1051-1", kind: "created", description: { en: "Client introduction created", tr: "Müşteri tanıştırması oluşturuldu" }, occurredAt: "2026-07-03T11:00:00.000Z" },
    ],
  },
  {
    id: "ref-1056", ownerUserId: "demo-partner", firmId: "org-marmara", accountType: "individual", firstName: "Emre", lastName: "Yılmaz", displayName: "E. Yılmaz", email: "emre.yilmaz@example.com", nationality: "Türkiye", city: "Ankara", country: "Türkiye", jurisdiction: "manual-review", status: "contacted", introducedAt: "2026-07-09", updatedAt: "2026-07-14T08:45:00.000Z", nextAction: { en: "Upload requested identity documents", tr: "İstenen kimlik belgelerini yükleyin" },
    fundInterests: [{ id: "interest-1056-1", offeringId: "legacy-epiphany", shareClassId: "legacy-class-a", amount: 100_000, timeline: "3-6 months", accountPreference: "Unsure", primary: true, createdAt: "2026-07-09T09:00:00.000Z" }], suitabilityProfile: commonSuitability, investorReadinessAssessments: [seedAssessment({ clientId: "ref-1056", accountType: "individual", jurisdiction: "manual-review", result: "manual-review", assessedAt: "2026-07-09T09:00:00.000Z" })], documents: clientDocuments(["missing", "missing", "received", "missing", "missing"]), contactConsentAt: "2026-07-09T09:00:00.000Z", accuracyConsentAt: "2026-07-09T09:00:00.000Z", activity: [
      { id: "a-1056-2", kind: "status", description: { en: "Client contacted; documents requested", tr: "Müşteriyle iletişime geçildi; belgeler istendi" }, occurredAt: "2026-07-14T08:45:00.000Z" },
      { id: "a-1056-1", kind: "created", description: { en: "Client introduction created", tr: "Müşteri tanıştırması oluşturuldu" }, occurredAt: "2026-07-09T09:00:00.000Z" },
    ],
  },
];

export const REFERRAL_STATUS_ORDER: ReferralStatus[] = [
  "introduced",
  "contacted",
  "compliance-review",
  "accepted",
  "funded",
];
