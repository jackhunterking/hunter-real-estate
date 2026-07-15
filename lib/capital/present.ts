/**
 * Presentation layer for the capital data.
 *
 * This module NEVER mutates the underlying data. It only derives display
 * strings, localized labels, metric tiles, image fallbacks, and map view-models
 * so screens stay thin. The English canonical strings in data.ts are the source
 * of truth; Turkish display values are derived here at render time.
 */
import {
  assetClasses,
  regions,
  strategies,
  taxonomyLabel,
} from "./taxonomies";
import type {
  ImageSlot,
  Lang,
  LocalizedText,
  MetricClassification,
  OfferingBundle,
  Property,
  ShareClass,
  SourcedValue,
} from "./types";

/* ------------------------------------------------------------------ */
/* Localized label tables                                             */
/* ------------------------------------------------------------------ */

const CLASSIFICATION: Record<MetricClassification, LocalizedText> = {
  historical: { en: "Historical", tr: "Geçmiş" },
  current: { en: "Current", tr: "Güncel" },
  target: { en: "Target", tr: "Hedef" },
  illustrative: { en: "Illustrative", tr: "Örnek" },
};

const STATUS: Record<Property["status"], LocalizedText> = {
  stabilized: { en: "Stabilized", tr: "Stabilize" },
  "new-construction": { en: "New construction", tr: "Yeni inşaat" },
  "value-add": { en: "Value-add", tr: "Değer artırma" },
  commercial: { en: "Commercial", tr: "Ticari" },
};

const VERIFICATION: Record<Property["verificationStatus"], LocalizedText> = {
  verified: { en: "Verified", tr: "Doğrulandı" },
  partial: { en: "Partial", tr: "Kısmi" },
  pending: { en: "Pending", tr: "Beklemede" },
};

export function localizeStatus(status: Property["status"], lang: Lang) {
  return STATUS[status][lang];
}

export function localizeVerification(status: Property["verificationStatus"], lang: Lang) {
  return VERIFICATION[status][lang];
}

/* ------------------------------------------------------------------ */
/* Number / currency / units formatting                               */
/* ------------------------------------------------------------------ */

export function formatCurrencyCad(value: number, lang: Lang): string {
  const locale = lang === "tr" ? "tr-TR" : "en-CA";
  const grouped = new Intl.NumberFormat(locale, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
  return lang === "tr" ? `${grouped} CAD` : `$${grouped} CAD`;
}

function formatCount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA").format(value);
}

/** "63 units" / "63 ünite" or "77,000 sq ft" / "77.000 ft²". Null if unsourced. */
export function formatUnits(property: Property, lang: Lang): string | null {
  if (property.units) {
    const n = formatCount(property.units.value, lang);
    return lang === "tr" ? `${n} ünite` : `${n} units`;
  }
  if (property.squareFeet) {
    const n = formatCount(property.squareFeet.value, lang);
    return lang === "tr" ? `${n} ft²` : `${n} sq ft`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Provenance line                                                    */
/* ------------------------------------------------------------------ */

/** "Target · 2026-01-30 · p.1" / "Hedef · 2026-01-30 · s.1" */
export function formatSourceLine(value: SourcedValue | undefined, lang: Lang): string | null {
  if (!value) return null;
  const parts: string[] = [CLASSIFICATION[value.classification][lang], value.asOfDate];
  if (value.sourcePage) parts.push(lang === "tr" ? `s.${value.sourcePage}` : `p.${value.sourcePage}`);
  return parts.join(" · ");
}

/* ------------------------------------------------------------------ */
/* Return / distribution / term phrase localization                   */
/* ------------------------------------------------------------------ */

// Exact-match table for the known canonical English strings guarantees correct
// Turkish output for real data; genericReturnTr() gracefully handles new strings.
const RETURN_PHRASES_TR: Record<string, string> = {
  "12-15% annually": "Yıllık %12-15",
  "14-18% annualized": "Yıllıklandırılmış %14-18",
  "10-14% annual net return": "Yıllık net getiri %10-14",
  "Quarterly; up to 8.2% annually": "Üç aylık; yıllık en fazla %8,2",
  "8% annually, paid monthly": "Yıllık %8; aylık ödenir",
  "7-8% annually, paid monthly": "Yıllık %7-8; aylık ödenir",
  "Open-ended fund": "Açık uçlu fon",
};

function genericReturnTr(text: string): string {
  let out = text;
  // Move "%" in front of the number and use Turkish decimal comma: "8.2%" -> "%8,2"
  out = out.replace(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%/g, (_m, a: string, b: string) =>
    `%${a.replace(".", ",")}-${b.replace(".", ",")}`,
  );
  out = out.replace(/(\d+(?:\.\d+)?)%/g, (_m, a: string) => `%${a.replace(".", ",")}`);
  // Cadence / qualifier words
  out = out
    .replace(/\bannualized\b/gi, "yıllıklandırılmış")
    .replace(/\bannually\b/gi, "yıllık")
    .replace(/\bpaid monthly\b/gi, "aylık ödenir")
    .replace(/\bmonthly\b/gi, "aylık")
    .replace(/\bQuarterly\b/g, "Üç aylık")
    .replace(/\bquarterly\b/gi, "üç aylık")
    .replace(/\bup to\b/gi, "en fazla");
  return out;
}

/** Localize a sourced return/distribution/term string. English is returned as-is. */
export function formatReturnPhrase(text: string, lang: Lang): string {
  if (lang !== "tr") return text;
  return RETURN_PHRASES_TR[text] ?? genericReturnTr(text);
}

export function formatSourcedPhrase(value: SourcedValue<string> | undefined, lang: Lang): string | null {
  if (!value) return null;
  return formatReturnPhrase(value.value, lang);
}

/* ------------------------------------------------------------------ */
/* Image slot resolution (elegant placeholder when no src)            */
/* ------------------------------------------------------------------ */

export type ResolvedImage = {
  src?: string;
  alt: string;
  gradient: string;
  initials: string;
};

function hashString(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initialsFrom(label: string): string {
  const words = label.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HG";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Deterministic muted gradient + initials fallback; uses `slot.src` when present. */
export function resolveImage(
  slot: ImageSlot | undefined,
  seed: string,
  label: string,
  lang: Lang,
  accent?: string,
): ResolvedImage {
  const hue = hashString(seed) % 360;
  const base = accent ?? `hsl(${hue}, 22%, 34%)`;
  const dark = accent ? `${accent}` : `hsl(${hue}, 26%, 22%)`;
  const gradient = `linear-gradient(135deg, ${dark} 0%, ${base} 60%, hsl(${(hue + 24) % 360}, 18%, 46%) 100%)`;
  return {
    src: slot?.src,
    alt: slot?.alt?.[lang] ?? label,
    gradient,
    initials: initialsFrom(label),
  };
}

/* ------------------------------------------------------------------ */
/* View models                                                        */
/* ------------------------------------------------------------------ */

export function primaryShareClass(bundle: OfferingBundle): ShareClass | undefined {
  return bundle.shareClasses[0];
}

export type MetricTile = {
  key: string;
  label: string;
  value: string;
  source: string | null;
};

function compactPercent(value: string, lang: Lang): string | null {
  const match = value.match(/\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?%/);
  if (!match) return null;
  const percent = match[0].replace(".", ",");
  return lang === "tr" ? `%${percent.replace("%", "")}` : percent;
}

function compactSummaryMetric(value: string, fallbackLabel: string, lang: Lang): Pick<MetricTile, "label" | "value"> {
  const percent = compactPercent(value, lang);
  if (!percent) return { label: fallbackLabel, value: formatReturnPhrase(value, lang) };

  if (/net return/i.test(value)) {
    return {
      label: lang === "tr" ? "Yıllık net getiri" : "Annual net return",
      value: percent,
    };
  }

  if (/paid monthly/i.test(value)) {
    return {
      label: lang === "tr" ? "Aylık ödenir" : "Paid monthly",
      value: percent,
    };
  }

  return { label: fallbackLabel, value: percent };
}

/**
 * Metric tiles for a fund's overview/terms. `plain` returns only the headline
 * few (overview, lighter); full includes unit price + accounts (terms, denser).
 */
export function offeringMetrics(bundle: OfferingBundle, lang: Lang, variant: "plain" | "full" = "plain"): MetricTile[] {
  const sc = primaryShareClass(bundle);
  if (!sc) return [];
  const tiles: MetricTile[] = [];
  const L = (en: string, tr: string) => (lang === "tr" ? tr : en);

  if (sc.targetReturn) {
    tiles.push({
      key: "return",
      label: L("Target return", "Hedeflenen yıllık net getiri"),
      value: formatReturnPhrase(sc.targetReturn.value, lang),
      source: formatSourceLine(sc.targetReturn, lang),
    });
  }
  if (sc.targetDistribution) {
    tiles.push({
      key: "distribution",
      label: L("Target distribution", "Hedef dağıtım"),
      value: formatReturnPhrase(sc.targetDistribution.value, lang),
      source: formatSourceLine(sc.targetDistribution, lang),
    });
  }
  tiles.push({
    key: "minimum",
    label: L("Minimum", "Minimum"),
    value: sc.minimumInvestment
      ? formatCurrencyCad(sc.minimumInvestment.value, lang)
      : L("Review required", "İnceleme gerekir"),
    source: sc.minimumInvestment ? formatSourceLine(sc.minimumInvestment, lang) : null,
  });
  if (sc.term) {
    tiles.push({
      key: "term",
      label: L("Term", "Vade"),
      value: formatReturnPhrase(sc.term.value, lang),
      source: formatSourceLine(sc.term, lang),
    });
  }

  if (variant === "full") {
    if (sc.unitPrice) {
      tiles.push({
        key: "unit-price",
        label: L("Unit price", "Birim fiyat"),
        value: formatCurrencyCad(sc.unitPrice.value, lang),
        source: formatSourceLine(sc.unitPrice, lang),
      });
    }
    if (sc.registeredAccountTypes.length > 0) {
      tiles.push({
        key: "accounts",
        label: L("Eligible accounts", "Uygun hesaplar"),
        value: sc.registeredAccountTypes.join(", "),
        source: null,
      });
    }
  }

  return tiles;
}

export function offeringTaxonomyLabels(bundle: OfferingBundle, lang: Lang) {
  return {
    strategies: bundle.strategyIds.map((id) => taxonomyLabel(strategies, id, lang)),
    assetClasses: bundle.assetClassIds.map((id) => taxonomyLabel(assetClasses, id, lang)),
    regions: bundle.regionIds.map((id) => taxonomyLabel(regions, id, lang)),
  };
}

/* ------------------------------------------------------------------ */
/* Map view model                                                     */
/* ------------------------------------------------------------------ */

export type MapProperty = {
  id: string;
  name: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  listingUrl?: string;
  accent: string;
  status: string;
  detail: string;
  verification: string;
  assetClass: string;
};

/** Portfolio buildings for the map, sourced from real lat/lng. */
export function buildMapProperties(bundle: OfferingBundle, lang: Lang): MapProperty[] {
  return bundle.properties.map((p) => ({
    id: p.id,
    name: p.name[lang],
    city: p.city,
    province: p.province,
    latitude: p.latitude,
    longitude: p.longitude,
    listingUrl: p.listingUrl,
    accent: assetClasses.find((a) => a.id === p.assetClassId)?.color ?? "#2f6f4f",
    status: STATUS[p.status][lang],
    detail: formatUnits(p, lang) ?? "",
    verification: VERIFICATION[p.verificationStatus][lang],
    assetClass: taxonomyLabel(assetClasses, p.assetClassId, lang),
  }));
}

/* ------------------------------------------------------------------ */
/* Compact money + dates                                              */
/* ------------------------------------------------------------------ */

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2).replace(/\.?0+$/, "")}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (abs >= 1e3) return `${Math.round(value / 1e3)}K`;
  return String(value);
}

/** 38160000 -> "$38.16M CAD" / "38,16M CAD" */
export function formatMoneyCompact(value: number, lang: Lang): string {
  const c = lang === "tr" ? compact(value).replace(".", ",") : compact(value);
  return lang === "tr" ? `${c} CAD` : `$${c} CAD`;
}

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
};

/** Accepts "YYYY", "YYYY-MM", or "YYYY-MM-DD". */
export function formatDate(iso: string, lang: Lang): string {
  const parts = iso.split("-");
  const year = parts[0];
  if (parts.length === 1) return year;
  const month = MONTHS[lang][Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1))];
  if (parts.length === 2) return `${month} ${year}`;
  const day = parseInt(parts[2], 10);
  return lang === "tr" ? `${day} ${month} ${year}` : `${month} ${day}, ${year}`;
}

/* ------------------------------------------------------------------ */
/* Fund detail view model                                             */
/* ------------------------------------------------------------------ */

export type LabeledRow = { key: string; value: string };
export type ProviderRow = LabeledRow & { url?: string };

export type FundDetailViewModel = {
  bannerImage: ResolvedImage;
  logo: ResolvedImage;
  headline: string | null; // offering size or AUM
  fundingPercent: number | null;
  summaryTiles: MetricTile[];
  fundDetails: LabeledRow[];
  highlights: string[];
  trailingReturns: { period: string; value: string; note: string | null }[];
  trailingReturnsNote: string | null;
  providers: ProviderRow[];
  lastUpdated: string | null;
};

/** Headline figure for a card/banner: offering size, else AUM, else null. */
export function fundHeadline(bundle: OfferingBundle, lang: Lang): string | null {
  if (bundle.offeringSize) return formatMoneyCompact(Number(bundle.offeringSize.value), lang);
  if (bundle.aum) return String(bundle.aum.value);
  return null;
}

export function buildFundDetailViewModel(bundle: OfferingBundle, lang: Lang): FundDetailViewModel {
  const sc = primaryShareClass(bundle);

  const bannerImage = resolveImage(bundle.media?.banner, `${bundle.slug}-banner`, bundle.shortName[lang], lang);
  const logo = resolveImage(bundle.media?.logo, `${bundle.slug}-logo`, bundle.shortName[lang], lang);

  // Overview highlights: target return, AUM, buildings, and units.
  const summaryTiles: MetricTile[] = [];
  const L = (en: string, tr: string) => (lang === "tr" ? tr : en);
  const portfolioFactNumber = (pattern: RegExp) => {
    const fact = bundle.portfolioFacts.find(({ value }) => pattern.test(value));
    return fact?.value.match(/[\d,.]+/)?.[0] ?? null;
  };

  if (sc?.targetReturn) {
    summaryTiles.push({
      key: "return",
      label: L("Target return", "Hedeflenen yıllık net getiri"),
      value: compactPercent(sc.targetReturn.value, lang) ?? formatReturnPhrase(sc.targetReturn.value, lang),
      source: null,
    });
  }
  if (bundle.aum) summaryTiles.push({ key: "aum", label: L("Total assets under management", "Toplam yönetilen varlıklar"), value: String(bundle.aum.value), source: null });

  const buildings = portfolioFactNumber(/\b(properties|buildings)\b/i) ?? (bundle.properties.length ? String(bundle.properties.length) : null);
  if (buildings) summaryTiles.push({ key: "buildings", label: L("Number of buildings", "Bina sayısı"), value: buildings, source: null });

  const units = bundle.unitsTotal ? String(bundle.unitsTotal.value) : portfolioFactNumber(/\bunits\b/i);
  if (units) summaryTiles.push({ key: "units", label: L("Number of units", "Daire"), value: units, source: null });

  // Fund details rows (only those with data)
  const fundDetails: LabeledRow[] = [];
  const row = (key: string, value?: string | null) => { if (value) fundDetails.push({ key, value }); };
  row("riskProfile", bundle.riskProfile?.[lang]);
  row(
    "projectedReturn",
    sc?.targetReturn
      ? lang === "tr"
        ? `${compactPercent(sc.targetReturn.value, lang) ?? formatReturnPhrase(sc.targetReturn.value, lang)} Yıllık net getiri`
        : formatReturnPhrase(sc.targetReturn.value, lang)
      : null,
  );
  row("startDate", bundle.inceptionDate ? formatDate(bundle.inceptionDate, lang) : null);
  row("unitPrice", sc?.unitPrice ? formatCurrencyCad(sc.unitPrice.value, lang) : null);
  row("minimum", sc?.minimumInvestment ? formatCurrencyCad(sc.minimumInvestment.value, lang) : null);
  row("distribution", sc?.distributionPerUnit ? formatReturnPhrase(sc.distributionPerUnit.value, lang) : null);
  row("redemption", sc?.redemptionTerms?.[lang]);

  const providers: ProviderRow[] = [];
  const provider = (key: string, value?: { name: string; url?: string }) => {
    if (value) providers.push({ key, value: value.name, url: value.url });
  };
  provider("auditor", bundle.serviceProviders?.auditor);
  provider("legalCounsel", bundle.serviceProviders?.legalCounsel);
  provider("appraiser", bundle.serviceProviders?.appraiser);

  return {
    bannerImage,
    logo,
    headline: fundHeadline(bundle, lang),
    fundingPercent: typeof bundle.fundingPercent === "number" ? bundle.fundingPercent : null,
    summaryTiles,
    fundDetails,
    highlights: (bundle.highlights ?? []).map((h) => h[lang]),
    trailingReturns: (bundle.trailingReturns ?? []).map((t) => ({ period: t.period[lang], value: t.value, note: t.note?.[lang] ?? null })),
    trailingReturnsNote: bundle.trailingReturnsNote?.[lang] ?? null,
    providers,
    lastUpdated: bundle.lastUpdated ? formatDate(bundle.lastUpdated, lang) : bundle.verifiedAt ? formatDate(bundle.verifiedAt, lang) : null,
  };
}
