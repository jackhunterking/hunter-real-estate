import { parsePerformancePercentage } from "./performance";
import type { LocalizedText, OfferingBundle } from "./types";

/**
 * Pure, server-safe engine for the "Compare Investments" resource tool.
 *
 * Two tangible, present-tense questions — deliberately NOT a forward guess:
 *   1. What monthly cash flow does a rental throw off after every cost?
 *   2. What would the SAME cash have earned in the fund, using its published
 *      historical returns (last year, the year before, since inception)?
 *
 * The rental is modelled on a best-case footing (always rented, no vacancy)
 * so the comparison never understates direct ownership. Nothing here is advice;
 * the fund side is entirely backward-looking — real past figures, not a
 * projection.
 */

export type PropertyType = "condo" | "house";

export type CashFlowInputs = {
  propertyType: PropertyType;
  purchasePrice: number;
  downPaymentPct: number; // share of price paid in cash
  closingCostPct: number; // land transfer + legal, share of price
  mortgageRatePct: number; // annual nominal
  amortizationYears: number;
  monthlyRent: number;
  propertyTaxPct: number; // annual, share of price
  insuranceAnnual: number; // annual $
  propertyMgmtPct: number; // share of collected rent
  /** Condo only: monthly maintenance / condo fee. */
  condoFeeMonthly: number;
  /** House only: annual maintenance + capex reserve as share of price. */
  maintenanceReservePct: number;
};

/** All figures are monthly dollars unless the name says otherwise. */
export type CashFlowResult = {
  initialCash: number;
  grossRent: number;
  mortgage: number;
  condoFee: number;
  propertyTax: number;
  insurance: number;
  management: number;
  maintenance: number;
  totalCosts: number;
  netMonthly: number;
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
    downPaymentPct,
    closingCostPct,
    mortgageRatePct,
    amortizationYears,
    monthlyRent,
    propertyTaxPct,
    insuranceAnnual,
    propertyMgmtPct,
    condoFeeMonthly,
    maintenanceReservePct,
  } = input;

  const downPayment = purchasePrice * (downPaymentPct / 100);
  const initialCash = downPayment + purchasePrice * (closingCostPct / 100);
  const loanPrincipal = Math.max(purchasePrice - downPayment, 0);

  const grossRent = monthlyRent;
  const mortgage = monthlyMortgagePayment(loanPrincipal, mortgageRatePct, amortizationYears);
  const condoFee = propertyType === "condo" ? condoFeeMonthly : 0;
  const maintenance = propertyType === "house" ? (purchasePrice * (maintenanceReservePct / 100)) / 12 : 0;
  const propertyTax = (purchasePrice * (propertyTaxPct / 100)) / 12;
  const insurance = insuranceAnnual / 12;
  const management = grossRent * (propertyMgmtPct / 100);

  const totalCosts = mortgage + condoFee + maintenance + propertyTax + insurance + management;
  const netMonthly = grossRent - totalCosts;
  const netAnnual = netMonthly * 12;
  const cashOnCashPct = initialCash > 0 ? (netAnnual / initialCash) * 100 : 0;

  return {
    initialCash,
    grossRent,
    mortgage,
    condoFee,
    propertyTax,
    insurance,
    management,
    maintenance,
    totalCosts,
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
