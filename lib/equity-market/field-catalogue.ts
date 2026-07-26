/**
 * The canonical description of what a complete investment profile contains.
 *
 * One catalogue drives three things, for every investment — the two live today
 * and any added later:
 *
 *   1. **Completeness score** — how finished a profile is, and which required
 *      fields are still empty. This is the acceptance gate for publishing.
 *   2. **Quarterly refresh checklist** — only the `per-period` fields move when
 *      a manager publishes a new fact sheet (about a dozen); everything else is
 *      `static` until the Offering Memorandum changes. Knowing the difference is
 *      what turns a refresh from "re-read the whole profile" into a short list.
 *   3. **Gap report** — what to request from the manager.
 *
 * `sourceRequired` marks the fields that must cite a registered source
 * (app.offering_sources) rather than merely being non-empty: every number an
 * investor sees should be traceable to a document.
 *
 * This is a plain constant rather than a table on purpose — it is a statement
 * about the *shape* of a profile, it changes with the code that renders it, and
 * it belongs in version control next to that code.
 */
import type { LocalizedText, OfferingBundle } from "./types";

export type FieldTier = "required" | "recommended" | "optional";
/** `per-period` fields change every reporting cycle; `static` fields do not. */
export type FieldVolatility = "per-period" | "static";

export type CatalogueField = {
  key: string;
  label: LocalizedText;
  tier: FieldTier;
  volatility: FieldVolatility;
  sourceRequired: boolean;
  /** Which part of the admin editor holds this field. */
  section: "identity" | "facts" | "performance" | "terms" | "portfolio" | "media" | "documents" | "governance";
  filled: (bundle: OfferingBundle) => boolean;
};

const hasText = (value?: LocalizedText) => Boolean(value?.en?.trim() && value?.tr?.trim());
const hasList = (value?: unknown[]) => Array.isArray(value) && value.length > 0;
const hasValue = (value?: { value?: string | number }) =>
  value?.value !== undefined && value.value !== null && String(value.value).trim() !== "";

export const OFFERING_FIELD_CATALOGUE: CatalogueField[] = [
  // ---- identity -----------------------------------------------------------
  { key: "name", label: { en: "Name", tr: "Ad" }, tier: "required", volatility: "static", sourceRequired: false, section: "identity", filled: (b) => hasText(b.name) },
  { key: "shortName", label: { en: "Short name", tr: "Kısa ad" }, tier: "required", volatility: "static", sourceRequired: false, section: "identity", filled: (b) => hasText(b.shortName) },
  { key: "summary", label: { en: "Summary", tr: "Özet" }, tier: "required", volatility: "static", sourceRequired: false, section: "identity", filled: (b) => hasText(b.summary) },
  { key: "thesis", label: { en: "Thesis", tr: "Tez" }, tier: "required", volatility: "static", sourceRequired: false, section: "identity", filled: (b) => hasText(b.thesis) },
  { key: "strategyIds", label: { en: "Strategy tags", tr: "Strateji etiketleri" }, tier: "required", volatility: "static", sourceRequired: false, section: "identity", filled: (b) => hasList(b.strategyIds) },
  { key: "assetClassIds", label: { en: "Asset classes", tr: "Varlık sınıfları" }, tier: "required", volatility: "static", sourceRequired: false, section: "identity", filled: (b) => hasList(b.assetClassIds) },
  { key: "regionIds", label: { en: "Regions", tr: "Bölgeler" }, tier: "required", volatility: "static", sourceRequired: false, section: "identity", filled: (b) => hasList(b.regionIds) },

  // ---- facts --------------------------------------------------------------
  { key: "fundType", label: { en: "Fund type", tr: "Fon türü" }, tier: "required", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasText(b.fundType) },
  { key: "fundStatus", label: { en: "Fund status", tr: "Fon durumu" }, tier: "required", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasText(b.fundStatus) },
  { key: "inceptionDate", label: { en: "Inception", tr: "Başlangıç" }, tier: "required", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => Boolean(b.inceptionDate) },
  { key: "aum", label: { en: "Assets under management", tr: "Yönetilen varlıklar" }, tier: "required", volatility: "per-period", sourceRequired: true, section: "facts", filled: (b) => hasValue(b.aum) },
  { key: "portfolioFacts", label: { en: "Portfolio facts", tr: "Portföy verileri" }, tier: "required", volatility: "per-period", sourceRequired: true, section: "facts", filled: (b) => hasList(b.portfolioFacts) },
  { key: "riskProfile", label: { en: "Risk profile", tr: "Risk profili" }, tier: "required", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasText(b.riskProfile) },
  { key: "managementFee", label: { en: "Management fee", tr: "Yönetim ücreti" }, tier: "required", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasText(b.managementFee) },
  { key: "valuationFrequency", label: { en: "Valuation frequency", tr: "Değerleme sıklığı" }, tier: "recommended", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasText(b.valuationFrequency) },
  { key: "distributionFrequency", label: { en: "Distribution frequency", tr: "Dağıtım sıklığı" }, tier: "recommended", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasText(b.distributionFrequency) },
  { key: "highlights", label: { en: "Highlights", tr: "Öne çıkanlar" }, tier: "required", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasList(b.highlights) },
  { key: "fundDefinedFacts", label: { en: "Fund-defined facts", tr: "Fon tanımlı veriler" }, tier: "recommended", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasList(b.fundDefinedFacts) || b.shareClasses.some((sc) => hasList(sc.fundDefinedFacts)) },
  { key: "strategyPoints", label: { en: "Strategy & initiatives", tr: "Strateji ve girişimler" }, tier: "optional", volatility: "static", sourceRequired: true, section: "facts", filled: (b) => hasList(b.strategyPoints) },

  // ---- performance --------------------------------------------------------
  { key: "trailingReturns", label: { en: "Trailing returns", tr: "Geçmiş getiriler" }, tier: "required", volatility: "per-period", sourceRequired: true, section: "performance", filled: (b) => hasList(b.trailingReturns) },
  { key: "trailingReturnsNote", label: { en: "Returns note", tr: "Getiri notu" }, tier: "recommended", volatility: "per-period", sourceRequired: false, section: "performance", filled: (b) => hasText(b.trailingReturnsNote) },

  // ---- terms (share class) ------------------------------------------------
  { key: "shareClasses", label: { en: "Share classes", tr: "Pay sınıfları" }, tier: "required", volatility: "static", sourceRequired: false, section: "terms", filled: (b) => hasList(b.shareClasses) },
  { key: "shareClasses.minimumInvestment", label: { en: "Minimum investment", tr: "Asgari yatırım" }, tier: "required", volatility: "static", sourceRequired: true, section: "terms", filled: (b) => b.shareClasses.some((sc) => hasValue(sc.minimumInvestment)) },
  { key: "shareClasses.targetReturn", label: { en: "Target return", tr: "Hedef getiri" }, tier: "required", volatility: "per-period", sourceRequired: true, section: "terms", filled: (b) => b.shareClasses.some((sc) => hasValue(sc.targetReturn)) },
  { key: "shareClasses.targetDistribution", label: { en: "Target distribution", tr: "Hedef dağıtım" }, tier: "required", volatility: "per-period", sourceRequired: true, section: "terms", filled: (b) => b.shareClasses.some((sc) => hasValue(sc.targetDistribution)) },
  { key: "shareClasses.unitPrice", label: { en: "Unit price / NAV", tr: "Birim fiyatı / NAV" }, tier: "recommended", volatility: "per-period", sourceRequired: true, section: "terms", filled: (b) => b.shareClasses.some((sc) => hasValue(sc.unitPrice)) },
  { key: "shareClasses.term", label: { en: "Term", tr: "Vade" }, tier: "required", volatility: "static", sourceRequired: true, section: "terms", filled: (b) => b.shareClasses.some((sc) => hasValue(sc.term)) },
  { key: "shareClasses.redemptionTerms", label: { en: "Redemption terms", tr: "İtfa koşulları" }, tier: "required", volatility: "static", sourceRequired: true, section: "terms", filled: (b) => b.shareClasses.some((sc) => hasText(sc.redemptionTerms)) },
  { key: "shareClasses.registeredAccountTypes", label: { en: "Registered accounts", tr: "Kayıtlı hesaplar" }, tier: "recommended", volatility: "static", sourceRequired: true, section: "terms", filled: (b) => b.shareClasses.some((sc) => hasList(sc.registeredAccountTypes)) },

  // ---- portfolio ----------------------------------------------------------
  { key: "properties", label: { en: "Properties", tr: "Mülkler" }, tier: "required", volatility: "per-period", sourceRequired: true, section: "portfolio", filled: (b) => hasList(b.properties) },
  { key: "properties.coordinates", label: { en: "Property coordinates", tr: "Mülk koordinatları" }, tier: "required", volatility: "static", sourceRequired: false, section: "portfolio", filled: (b) => hasList(b.properties) && b.properties.every((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) },
  { key: "properties.address", label: { en: "Property addresses", tr: "Mülk adresleri" }, tier: "recommended", volatility: "static", sourceRequired: true, section: "portfolio", filled: (b) => hasList(b.properties) && b.properties.every((p) => hasText(p.address)) },
  { key: "properties.unitCount", label: { en: "Property unit counts", tr: "Mülk daire sayıları" }, tier: "required", volatility: "per-period", sourceRequired: true, section: "portfolio", filled: (b) => hasList(b.properties) && b.properties.every((p) => typeof p.unitCount === "number") },
  { key: "properties.media", label: { en: "Property photos", tr: "Mülk fotoğrafları" }, tier: "recommended", volatility: "static", sourceRequired: true, section: "portfolio", filled: (b) => hasList(b.properties) && b.properties.every((p) => Boolean(p.media?.card?.path ?? p.media?.card?.src ?? p.image)) },

  // ---- media --------------------------------------------------------------
  { key: "media.card", label: { en: "Card image", tr: "Kart görseli" }, tier: "required", volatility: "static", sourceRequired: false, section: "media", filled: (b) => Boolean(b.media?.card?.path ?? b.media?.card?.src) },
  { key: "media.banner", label: { en: "Banner image", tr: "Afiş görseli" }, tier: "recommended", volatility: "static", sourceRequired: false, section: "media", filled: (b) => Boolean(b.media?.banner?.path ?? b.media?.banner?.src) },
  { key: "media.logo", label: { en: "Manager logo", tr: "Yönetici logosu" }, tier: "recommended", volatility: "static", sourceRequired: false, section: "media", filled: (b) => Boolean(b.media?.logo?.path ?? b.media?.logo?.src) },

  // ---- documents ----------------------------------------------------------
  { key: "documents", label: { en: "Documents", tr: "Belgeler" }, tier: "required", volatility: "per-period", sourceRequired: false, section: "documents", filled: (b) => hasList(b.documents) },
  { key: "documents.factSheet", label: { en: "Current fact sheet", tr: "Güncel bilgi formu" }, tier: "required", volatility: "per-period", sourceRequired: false, section: "documents", filled: (b) => b.documents.some((d) => d.type === "fact-sheet" && Boolean(d.path ?? d.href)) },
  { key: "documents.offeringMemorandum", label: { en: "Offering memorandum", tr: "Teklif muhtırası" }, tier: "required", volatility: "static", sourceRequired: false, section: "documents", filled: (b) => b.documents.some((d) => d.type === "offering-memorandum") },
  { key: "sources", label: { en: "Registered sources", tr: "Kayıtlı kaynaklar" }, tier: "required", volatility: "per-period", sourceRequired: false, section: "documents", filled: (b) => hasList(b.sources) },

  // ---- governance ---------------------------------------------------------
  { key: "manager", label: { en: "Manager profile", tr: "Yönetici profili" }, tier: "required", volatility: "static", sourceRequired: false, section: "governance", filled: (b) => hasText(b.manager?.name) && hasText(b.manager?.description) },
  { key: "serviceProviders.auditor", label: { en: "Auditor", tr: "Denetçi" }, tier: "required", volatility: "static", sourceRequired: true, section: "governance", filled: (b) => Boolean(b.serviceProviders?.auditor?.name) },
  { key: "serviceProviders.legalCounsel", label: { en: "Legal counsel", tr: "Hukuk danışmanı" }, tier: "recommended", volatility: "static", sourceRequired: true, section: "governance", filled: (b) => Boolean(b.serviceProviders?.legalCounsel?.name) },
  { key: "risks", label: { en: "Risks", tr: "Riskler" }, tier: "required", volatility: "static", sourceRequired: true, section: "governance", filled: (b) => hasList(b.risks) },
  { key: "complianceProfile", label: { en: "Compliance profile", tr: "Uyum profili" }, tier: "required", volatility: "static", sourceRequired: false, section: "governance", filled: (b) => Boolean(b.complianceProfile?.issuerLegalType && b.complianceProfile?.reviewOwner) },
  { key: "dataAsOf", label: { en: "Data as of", tr: "Veri tarihi" }, tier: "required", volatility: "per-period", sourceRequired: false, section: "governance", filled: (b) => Boolean(b.dataAsOf) },
  { key: "managerPublicUrl", label: { en: "Manager fund page", tr: "Yönetici fon sayfası" }, tier: "recommended", volatility: "static", sourceRequired: false, section: "governance", filled: (b) => Boolean(b.managerPublicUrl) },
];

/** The fields a quarterly refresh actually has to revisit. */
export const PER_PERIOD_FIELDS = OFFERING_FIELD_CATALOGUE.filter((f) => f.volatility === "per-period");

export type CompletenessReport = {
  /** Percentage of required + recommended fields that are filled (0-100). */
  percent: number;
  filled: number;
  total: number;
  missingRequired: CatalogueField[];
  missingRecommended: CatalogueField[];
  /** True when every `required` field is filled — the gate for publishing. */
  publishable: boolean;
};

/**
 * Scores a bundle against the catalogue. `optional` fields are excluded from
 * the denominator so a profile can reach 100% without carrying every nicety;
 * they still appear in the gap report when empty.
 */
export function scoreOfferingCompleteness(bundle: OfferingBundle): CompletenessReport {
  const counted = OFFERING_FIELD_CATALOGUE.filter((f) => f.tier !== "optional");
  const missingRequired: CatalogueField[] = [];
  const missingRecommended: CatalogueField[] = [];
  let filled = 0;

  for (const field of counted) {
    let ok = false;
    try {
      ok = field.filled(bundle);
    } catch {
      // A malformed bundle must not crash the admin panel; treat it as missing.
      ok = false;
    }
    if (ok) {
      filled += 1;
    } else if (field.tier === "required") {
      missingRequired.push(field);
    } else {
      missingRecommended.push(field);
    }
  }

  return {
    percent: counted.length ? Math.round((filled / counted.length) * 100) : 0,
    filled,
    total: counted.length,
    missingRequired,
    missingRecommended,
    publishable: missingRequired.length === 0,
  };
}

/** Every unfilled field, including `optional` ones — what to ask the manager for. */
export function offeringGapReport(bundle: OfferingBundle): CatalogueField[] {
  return OFFERING_FIELD_CATALOGUE.filter((field) => {
    try {
      return !field.filled(bundle);
    } catch {
      return true;
    }
  });
}
