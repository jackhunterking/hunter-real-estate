/**
 * Presentation layer for the capital data.
 *
 * This module NEVER mutates the underlying data. It only derives display
 * strings, localized labels, metric tiles, image fallbacks, and map view-models
 * so screens stay thin. The English canonical strings in data.ts are the source
 * of truth; Turkish display values are derived here at render time.
 */
import { tx } from "../i18n/localize.ts";
import { taxonomyLabel, type TaxonomyItem } from "./taxonomies.ts";
import type {
  ImageSlot,
  Lang,
  LocalizedText,
  MetricClassification,
  OfferingBundle,
  Property,
  RiskEntry,
  ShareClass,
  SourcedValue,
} from "./types.ts";

/**
 * Reads a risk written in either shape. Published snapshots flatten `risks` to
 * plain LocalizedText, but a draft bundle straight from the editor may carry
 * `{ text, category }`, so every reader goes through here.
 */
export function riskText(entry: RiskEntry): LocalizedText {
  return "text" in entry ? entry.text : entry;
}

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
  return tx(STATUS[status], lang);
}

export function localizeVerification(status: Property["verificationStatus"], lang: Lang) {
  return tx(VERIFICATION[status], lang);
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
  const parts: string[] = [tx(CLASSIFICATION[value.classification], lang), value.asOfDate];
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
  // The published ranges sign both sides ("10%-14%"), so the inner sign is
  // optional — otherwise each number is prefixed on its own: "%10-%14".
  out = out.replace(/(\d+(?:\.\d+)?)\s*%?\s*[-–—]\s*(\d+(?:\.\d+)?)\s*%/g, (_m, a: string, b: string) =>
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

/**
 * Target-return copy → the figure alone: "12 - 15 % annually" and
 * "10%-14% targeted annual net return" both collapse to a tight "10–14%". The
 * card headline carries the number only; the qualifying prose belongs in the
 * detail view. Falls back to the input when there is no percentage to pull out.
 *
 * Published ranges carry a percent sign on BOTH sides, so the sign between the
 * two numbers is optional here — reading only up to the first "%" would print
 * the bottom of the range as if it were the whole target.
 */
export function tightRange(text: string) {
  const range = text.match(/(\d+(?:[.,]\d+)?)\s*%?\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*%/);
  if (range) return `${range[1]}–${range[2]}%`;
  const single = text.match(/\d+(?:[.,]\d+)?\s*%/);
  return single ? single[0].replace(/\s+/g, "") : text;
}

const T = (lang: Lang, en: string, tr: string) => (lang === "tr" ? tr : en);

/**
 * Payout cadences, matched most-specific-first: the "annualized"/"annually" in
 * a *rate* must never outrank the "paid monthly" that is the real cadence.
 */
const DISTRIBUTION_CADENCES = [
  { key: "monthly", match: /month|ayl[ıi]k/i, en: "Monthly", tr: "Aylık" },
  { key: "quarterly", match: /quarter|üç ayl[ıi]k|uc ayl[ıi]k/i, en: "Quarterly", tr: "Üç aylık" },
  { key: "semiannual", match: /semi-?annual|alt[ıi] ayl[ıi]k/i, en: "Semi-annual", tr: "Altı aylık" },
  { key: "annual", match: /annual|yearly|y[ıi]ll[ıi]k/i, en: "Annual", tr: "Yıllık" },
] as const;

/**
 * Distribution copy → "Monthly; 7–8% annually" — the cadence and the rate, and
 * nothing else. Marketing sentences like "7%-8% targeted annualized cash
 * distribution, paid monthly" read as prose that wraps to two lines on a fund
 * tile, so every offering is normalised to that one lean shape. "up to"
 * survives because it qualifies the number. Copy with no percentage in it (a
 * per-unit dollar amount, say) has no rate to lift out, so it is only localized.
 *
 * Pass the raw canonical (English) value: this localizes internally, so wrapping
 * the input in `formatReturnPhrase` first would corrupt the percent it looks for.
 */
export function tightDistribution(text: string, lang: Lang) {
  const percent = tightRange(text);
  if (percent === text) return formatReturnPhrase(text, lang);
  const rate = `${/up to|en fazla|azami/i.test(text) ? T(lang, "up to ", "en fazla ") : ""}${percent}`;
  const annualised = T(lang, `${rate} annually`, `yıllık ${rate}`);
  const cadence = DISTRIBUTION_CADENCES.find((c) => c.match.test(text));
  // No cadence to lead with → the rate stands alone, so it starts the sentence.
  if (!cadence || cadence.key === "annual") {
    return annualised.charAt(0).toLocaleUpperCase(lang) + annualised.slice(1);
  }
  return `${T(lang, cadence.en, cadence.tr)}; ${annualised}`;
}

/**
 * Investment-term copy → the structure alone. "Open-ended trust; Units offered
 * on a continuous basis" collapses to its lead clause "Open-ended trust" (the
 * continuation is mechanism, not the term), and a fixed-term fund keeps its
 * duration: "5-year term". Falls back to the input untouched.
 */
export function tightTerm(text: string, lang: Lang) {
  const years = text.match(/(\d+)\s*[-–\s]?\s*(?:year|y[ıi]l)/i);
  if (years) return T(lang, `${years[1]}-year term`, `${years[1]} yıl vade`);
  const lead = text.split(/[;.]/)[0].trim();
  return lead || text;
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

export function initialsFrom(label: string): string {
  const words = label.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HG";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Calm, consistent placeholder for a building that has no photo yet — one
 * Legacy-navy tint everywhere, so a grid of not-yet-photographed buildings reads
 * as a quiet set rather than a rainbow of per-building hues. The initials still
 * come from `resolveImage`, so each tile stays distinguishable. Replaced per
 * building by its real photo (or a Google Street View) as those arrive.
 */
export const BUILDING_PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #131f4a 0%, #1e3378 58%, #33509a 100%)";

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
    alt: tx(slot?.alt, lang) ?? label,
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
  if (!/\d\s*%/.test(value)) return null;
  // Same tightening the summary card and detail header use, so one investment
  // never shows a different target on its overview tile than on its own header.
  const compact = tightRange(value);
  if (lang !== "tr") return compact;
  // Turkish leads with the sign and uses a decimal comma: "8.2%" -> "%8,2".
  return `%${compact.replace("%", "").replace(/\./g, ",")}`;
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

/* ------------------------------------------------------------------ */
/* Map view model                                                     */
/* ------------------------------------------------------------------ */

export type MapProperty = {
  id: string;
  name: string;
  address?: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  listingUrl?: string;
  status: string;
  detail: string;
  verification: string;
  assetClass: string;
  offeringName?: string;
  image?: ImageSlot;
  asOfDate?: string;
  sourceId?: string;
};

/** Portfolio buildings for the map, sourced from real lat/lng. */
export function buildMapProperties(
  bundle: OfferingBundle,
  lang: Lang,
  assetClasses: TaxonomyItem[] = [],
): MapProperty[] {
  // Image precedence per building: its own photo first, then a real offering
  // gallery photo distributed across buildings. We deliberately do NOT fall back
  // to the offering's card/banner — that is generic brand art (e.g. legacyBG),
  // and stamping it on a specific address reads as fake. A building with no photo
  // resolves to `undefined` here so the card shows the branded initials tile
  // (and, once wired, a Google Street View of the exact address). No `verifiedAt`
  // gate: portal-only path; the marketing page gates media separately.
  const gallery = (bundle.media?.gallery ?? []).filter((image) => image.src);
  return bundle.properties.map((p, index) => {
    const propertyImage = p.media?.gallery?.find((image) => image.src)
      ?? (p.media?.card?.src ? p.media.card : undefined);
    const offeringImage = gallery.length ? gallery[index % gallery.length] : undefined;
    const image = propertyImage ?? offeringImage;
    return {
      id: p.id,
      name: tx(p.name, lang),
      address: tx(p.address, lang),
      city: p.city,
      province: p.province,
      latitude: p.latitude,
      longitude: p.longitude,
      listingUrl: p.listingUrl?.startsWith("http") && !p.listingUrl.includes("TODO") ? p.listingUrl : undefined,
      status: tx(STATUS[p.status], lang),
      detail: formatUnits(p, lang) ?? "",
      verification: tx(VERIFICATION[p.verificationStatus], lang),
      assetClass: taxonomyLabel(assetClasses, p.assetClassId, lang),
      offeringName: tx(bundle.shortName, lang),
      image,
      asOfDate: image?.verifiedAt ?? bundle.verifiedAt,
      sourceId: p.units?.sourceId ?? p.squareFeet?.sourceId,
    };
  });
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

const MONTHS: { en: string[]; tr: string[] } = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
};

/** Accepts "YYYY", "YYYY-MM", or "YYYY-MM-DD". */
export function formatDate(iso: string, lang: Lang): string {
  const parts = iso.split("-");
  const year = parts[0];
  if (parts.length === 1) return year;
  const month = MONTHS[lang === "tr" ? "tr" : "en"][Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1))];
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

  const bannerImage = resolveImage(bundle.media?.banner, `${bundle.slug}-banner`, tx(bundle.shortName, lang), lang);
  const logo = resolveImage(bundle.media?.logo, `${bundle.slug}-logo`, tx(bundle.shortName, lang), lang);

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
  row("riskProfile", tx(bundle.riskProfile, lang));
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
  row("redemption", tx(sc?.redemptionTerms, lang));

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
    highlights: (bundle.highlights ?? []).map((h) => tx(h, lang)),
    trailingReturns: (bundle.trailingReturns ?? []).map((t) => ({ period: tx(t.period, lang), value: t.value, note: tx(t.note, lang) ?? null })),
    trailingReturnsNote: tx(bundle.trailingReturnsNote, lang) ?? null,
    providers,
    lastUpdated: bundle.lastUpdated ? formatDate(bundle.lastUpdated, lang) : bundle.verifiedAt ? formatDate(bundle.verifiedAt, lang) : null,
  };
}
