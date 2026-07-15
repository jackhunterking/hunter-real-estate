import type {
  ClientDocument,
  ClientDocumentStatus,
  ClientRecord,
  PartnerSummary,
  PartnerTier,
  ReferralStatus,
} from "./types";

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

const commonReadiness = {
  objective: "Balanced income and growth",
  horizon: "5+ years",
  riskTolerance: "Moderate",
  lossCapacity: "Some loss",
  liquidityNeed: "Low",
  experience: "Some private market experience",
  preliminaryCategory: "Eligible investor — licensed review required",
  accreditedIncome: false,
  accreditedFinancialAssets: false,
  accreditedNetAssets: false,
  eligibleIncome: true,
  eligibleNetAssets: true,
  priorOmAmount: "$0",
};

export const initialClients: ClientRecord[] = [
  {
    id: "ref-1042", accountType: "individual", firstName: "Ayşe", lastName: "Demir", displayName: "A. Demir", organization: "Demir Family Office", email: "ayse.demir@example.com", phone: "+90 212 555 0142", preferredLanguage: "tr", city: "Istanbul", country: "Türkiye", jurisdiction: "turkey-cross-border", status: "funded", introducedAt: "2026-06-18", updatedAt: "2026-07-12T10:00:00.000Z", nextAction: { en: "Monitor funded position", tr: "Fonlanan pozisyonu takip edin" },
    fundInterests: [{ id: "interest-1042-1", offeringId: "lankin-apartment-reit", shareClassId: "lankin-class-a", amount: 250_000, timeline: "Now", accountPreference: "Corporate/entity", primary: true, createdAt: "2026-06-18T12:00:00.000Z" }], readiness: { ...commonReadiness, preliminaryCategory: "Cross-border manual review completed" }, documents: clientDocuments(["approved", "approved", "approved", "approved", "approved"]), contactConsentAt: "2026-06-18T12:00:00.000Z", accuracyConsentAt: "2026-06-18T12:00:00.000Z", activity: [
      { id: "a-1042-3", kind: "status", description: { en: "Investment marked as funded", tr: "Yatırım fonlandı olarak işaretlendi" }, occurredAt: "2026-07-12T10:00:00.000Z" },
      { id: "a-1042-2", kind: "document", description: { en: "Subscription package approved", tr: "Abonelik paketi onaylandı" }, occurredAt: "2026-07-08T10:00:00.000Z" },
      { id: "a-1042-1", kind: "created", description: { en: "Client introduction created", tr: "Müşteri tanıştırması oluşturuldu" }, occurredAt: "2026-06-18T12:00:00.000Z" },
    ],
  },
  {
    id: "ref-1048", accountType: "individual", firstName: "Selim", lastName: "Kaya", displayName: "S. Kaya", email: "selim.kaya@example.com", preferredLanguage: "both", city: "Toronto", country: "Canada", jurisdiction: "ontario", status: "accepted", introducedAt: "2026-06-27", updatedAt: "2026-07-11T15:15:00.000Z", nextAction: { en: "Complete subscription package", tr: "Abonelik paketini tamamlayın" },
    fundInterests: [{ id: "interest-1048-1", offeringId: "legacy-epiphany", shareClassId: "legacy-class-a", amount: 400_000, timeline: "Now", accountPreference: "Non-registered", primary: true, createdAt: "2026-06-27T13:00:00.000Z" }], readiness: { ...commonReadiness, accreditedFinancialAssets: true, preliminaryCategory: "Accredited investor — licensed review completed" }, documents: clientDocuments(["approved", "approved", "approved", "under-review", "received"]), contactConsentAt: "2026-06-27T13:00:00.000Z", accuracyConsentAt: "2026-06-27T13:00:00.000Z", activity: [
      { id: "a-1048-2", kind: "status", description: { en: "Client accepted after licensed review", tr: "Müşteri lisanslı inceleme sonrası kabul edildi" }, occurredAt: "2026-07-11T15:15:00.000Z" },
      { id: "a-1048-1", kind: "created", description: { en: "Client introduction created", tr: "Müşteri tanıştırması oluşturuldu" }, occurredAt: "2026-06-27T13:00:00.000Z" },
    ],
  },
  {
    id: "ref-1051", accountType: "entity", firstName: "Mert", lastName: "Aydın", displayName: "M. Aydın", organization: "Aydın Holdings", email: "mert.aydin@example.com", phone: "+90 212 555 0151", preferredLanguage: "tr", city: "Istanbul", country: "Türkiye", jurisdiction: "turkey-cross-border", status: "compliance-review", introducedAt: "2026-07-03", updatedAt: "2026-07-13T09:20:00.000Z", nextAction: { en: "Licensed document review in progress", tr: "Lisanslı belge incelemesi sürüyor" },
    fundInterests: [{ id: "interest-1051-1", offeringId: "lankin-apartment-reit", shareClassId: "lankin-class-a", amount: 150_000, timeline: "1-3 months", accountPreference: "Corporate/entity", primary: true, createdAt: "2026-07-03T11:00:00.000Z" }], readiness: { ...commonReadiness, preliminaryCategory: "Cross-border manual review required" }, documents: clientDocuments(["approved", "under-review", "under-review", "action-required", "missing"]), contactConsentAt: "2026-07-03T11:00:00.000Z", accuracyConsentAt: "2026-07-03T11:00:00.000Z", activity: [
      { id: "a-1051-2", kind: "document", description: { en: "Source-of-funds support needs replacement", tr: "Fon kaynağı desteğinin değiştirilmesi gerekiyor" }, occurredAt: "2026-07-13T09:20:00.000Z" },
      { id: "a-1051-1", kind: "created", description: { en: "Client introduction created", tr: "Müşteri tanıştırması oluşturuldu" }, occurredAt: "2026-07-03T11:00:00.000Z" },
    ],
  },
  {
    id: "ref-1056", accountType: "individual", firstName: "Emre", lastName: "Yılmaz", displayName: "E. Yılmaz", email: "emre.yilmaz@example.com", preferredLanguage: "tr", city: "Ankara", country: "Türkiye", jurisdiction: "turkey-cross-border", status: "contacted", introducedAt: "2026-07-09", updatedAt: "2026-07-14T08:45:00.000Z", nextAction: { en: "Upload requested identity documents", tr: "İstenen kimlik belgelerini yükleyin" },
    fundInterests: [{ id: "interest-1056-1", offeringId: "legacy-epiphany", shareClassId: "legacy-class-a", amount: 100_000, timeline: "3-6 months", accountPreference: "Unsure", primary: true, createdAt: "2026-07-09T09:00:00.000Z" }], readiness: { ...commonReadiness, preliminaryCategory: "Cross-border manual review required" }, documents: clientDocuments(["missing", "missing", "received", "missing", "missing"]), contactConsentAt: "2026-07-09T09:00:00.000Z", accuracyConsentAt: "2026-07-09T09:00:00.000Z", activity: [
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
