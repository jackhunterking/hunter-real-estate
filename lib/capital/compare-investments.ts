import { parsePerformancePercentage } from "./performance";
import type { LocalizedText, OfferingBundle } from "./types";

/**
 * Pure, server-safe engine for the "Compare Investments" resource tool.
 *
 * Two tangible, present-tense questions — deliberately NOT a forward guess:
 *   1. What monthly cash flow does a rental throw off, underwritten like a real
 *      deal (vacancy, repairs, management, taxes, insurance, debt service)?
 *   2. What would the SAME cash have earned in the fund, using its published
 *      historical returns (last year, the year before, since inception)?
 *
 * The property is paid all-cash by default, so the price entered is exactly the
 * cash invested on both sides. A mortgage is opt-in: when enabled, the cash
 * invested becomes the down payment + closing, and the fund is compared against
 * that same cash. Nothing here is advice; the fund side is entirely
 * backward-looking — real past figures, not a projection.
 */

export type PropertyType = "condo" | "house";

export type CashFlowInputs = {
  propertyType: PropertyType;
  purchasePrice: number;
  /** When false the property is bought all-cash (no down payment / mortgage). */
  mortgageEnabled: boolean;
  downPaymentPct: number; // share of price paid in cash (mortgage only)
  closingCostPct: number; // land transfer + legal, share of price
  mortgageRatePct: number; // annual nominal
  amortizationYears: number;
  monthlyRent: number;
  vacancyPct: number; // vacancy + bad debt, share of gross rent
  repairsPct: number; // repairs + maintenance, share of gross rent
  propertyTaxPct: number; // annual, share of price
  insuranceAnnual: number; // annual $
  propertyMgmtPct: number; // share of collected rent
  /** Condo only: monthly condo / HOA fee. */
  condoFeeMonthly: number;
  /** Any other monthly expenses the owner wants to include (defaults to 0). */
  miscMonthly: number;
};

/** All figures are monthly dollars unless the name says otherwise. */
export type CashFlowResult = {
  initialCash: number; // cash to acquire: price (or down payment) + closing
  closing: number; // one-time closing cost (part of initialCash)
  grossRent: number;
  vacancy: number;
  repairs: number;
  management: number;
  condoFee: number;
  propertyTax: number;
  insurance: number;
  misc: number;
  mortgage: number; // monthly debt service (0 when all-cash)
  noi: number; // net operating income (before debt service)
  netMonthly: number; // NOI − debt service
  netAnnual: number;
  cashOnCashPct: number; // net annual cash flow / cash in
};

/** Standard fully-amortizing monthly mortgage payment. */
export function monthlyMortgagePayment(principal: number, annualRatePct: number, amortizationYears: number): number {
  if (principal <= 0) return 0;
  const n = Math.round(amortizationYears * 12);
  const r = annualRatePct / 100 / 12;
  if (n <= 0) return principal;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function computeCashFlow(input: CashFlowInputs): CashFlowResult {
  const {
    propertyType,
    purchasePrice,
    mortgageEnabled,
    downPaymentPct,
    closingCostPct,
    mortgageRatePct,
    amortizationYears,
    monthlyRent,
    vacancyPct,
    repairsPct,
    propertyTaxPct,
    insuranceAnnual,
    propertyMgmtPct,
    condoFeeMonthly,
    miscMonthly,
  } = input;

  // Acquisition cash. All-cash by default (the whole price); with a mortgage,
  // just the down payment. Closing costs apply either way.
  const closing = purchasePrice * (closingCostPct / 100);
  let cashBase: number;
  let mortgage: number;
  if (mortgageEnabled) {
    const downPayment = purchasePrice * (downPaymentPct / 100);
    cashBase = downPayment;
    const loanPrincipal = Math.max(purchasePrice - downPayment, 0);
    mortgage = monthlyMortgagePayment(loanPrincipal, mortgageRatePct, amortizationYears);
  } else {
    cashBase = purchasePrice;
    mortgage = 0;
  }
  const initialCash = cashBase + closing;

  // Income and operating expenses, underwritten off gross rent.
  const grossRent = monthlyRent;
  const vacancy = grossRent * (vacancyPct / 100);
  const repairs = grossRent * (repairsPct / 100);
  const management = grossRent * (propertyMgmtPct / 100);
  const condoFee = propertyType === "condo" ? condoFeeMonthly : 0;
  const propertyTax = (purchasePrice * (propertyTaxPct / 100)) / 12;
  const insurance = insuranceAnnual / 12;
  const misc = Math.max(miscMonthly, 0);

  const noi = grossRent - vacancy - repairs - management - condoFee - propertyTax - insurance - misc;
  const netMonthly = noi - mortgage;
  const netAnnual = netMonthly * 12;
  const cashOnCashPct = initialCash > 0 ? (netAnnual / initialCash) * 100 : 0;

  return {
    initialCash,
    closing,
    grossRent,
    vacancy,
    repairs,
    management,
    condoFee,
    propertyTax,
    insurance,
    misc,
    mortgage,
    noi,
    netMonthly,
    netAnnual,
    cashOnCashPct,
  };
}

/** A single backward-looking period for a fund, with the actual return earned. */
export type FundPeriod = {
  key: string;
  role: "last" | "prior" | "older" | "inception";
  year?: number;
  pct: number;
};

export type FundComparable = {
  id: string;
  slug: string;
  shortName: LocalizedText;
  managerName: LocalizedText;
  /** Small brand logo, shown beside the fund name in the picker. */
  logoSrc?: string;
  /** Backward-looking periods, most recent first, ending with "since inception". */
  periods: FundPeriod[];
  targetReturnPhrase?: LocalizedText;
  distributionFrequency?: LocalizedText;
  minimumInvestment?: number;
};

/** Given cash invested and a return %, what it would have earned. */
export function historicalEarnings(initialCash: number, pct: number): { annual: number; monthly: number } {
  const annual = initialCash * (pct / 100);
  return { annual, monthly: annual / 12 };
}

/**
 * Extract COMPLETE calendar-year returns from a fund's trailing figures.
 * A bare "2024" row is a full year; a "2024 Q4" cumulative-YTD row is treated
 * as that year's full-year total. Partial years (latest quarter, no Q4) are
 * ignored so we never present an incomplete year as a full one.
 */
function extractCalendarYears(bundle: OfferingBundle): { year: number; pct: number }[] {
  const byYear = new Map<number, number>();
  for (const row of bundle.trailingReturns ?? []) {
    const pct = parsePerformancePercentage(row.value);
    if (pct === null) continue;
    const label = `${row.period.en} ${row.period.tr}`;
    const yearMatch = label.match(/(20\d{2})/);
    if (!yearMatch) continue;
    const year = Number(yearMatch[1]);
    const quarterMatch = label.match(/Q\s*([1-4])|([1-4])\s*[QÇ]/i);
    if (!quarterMatch) {
      byYear.set(year, pct); // bare calendar year
    } else if (/4/.test(quarterMatch[0])) {
      byYear.set(year, pct); // Q4 cumulative-YTD == full year
    }
  }
  return [...byYear.entries()].map(([year, pct]) => ({ year, pct })).sort((a, b) => b.year - a.year);
}

/** Annualized "since inception" figure, if the fund publishes one explicitly. */
function extractSinceInception(bundle: OfferingBundle): number | null {
  for (const row of bundle.trailingReturns ?? []) {
    if (/since inception|kurulu/i.test(`${row.period.en} ${row.period.tr}`)) {
      return parsePerformancePercentage(row.value);
    }
  }
  return null;
}

/**
 * Project an offering into the client-safe comparable, or null if it lacks
 * usable historical returns.
 */
export function toFundComparable(bundle: OfferingBundle): FundComparable | null {
  const years = extractCalendarYears(bundle);
  const inception = extractSinceInception(bundle);
  const periods: FundPeriod[] = [];

  years.forEach((entry, index) => {
    periods.push({
      key: `year-${entry.year}`,
      role: index === 0 ? "last" : index === 1 ? "prior" : "older",
      year: entry.year,
      pct: entry.pct,
    });
  });

  const inceptionPct = inception ?? (years.length ? years.reduce((sum, y) => sum + y.pct, 0) / years.length : null);
  if (inceptionPct !== null) {
    periods.push({ key: "since-inception", role: "inception", pct: inceptionPct });
  }

  if (!periods.length) return null;

  const primaryClass = bundle.shareClasses[0];
  return {
    id: bundle.id,
    slug: bundle.slug,
    shortName: bundle.shortName,
    managerName: bundle.manager.name,
    logoSrc: bundle.media?.logo?.src,
    periods,
    targetReturnPhrase: primaryClass?.targetReturn
      ? { en: primaryClass.targetReturn.value, tr: primaryClass.targetReturn.value }
      : undefined,
    distributionFrequency: bundle.distributionFrequency,
    minimumInvestment: primaryClass?.minimumInvestment?.value,
  };
}
