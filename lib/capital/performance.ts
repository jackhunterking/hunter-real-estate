import type { TrailingReturn } from "./types";

/**
 * Convert a published percentage string into a chartable number without
 * changing the original display value used by the performance table.
 */
export function parsePerformancePercentage(value: string): number | null {
  const match = value.trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*%$/);
  if (!match) return null;

  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Aggregate periods (for example, "Year 3" or "Since inception") belong in
 * the exact-value table but not on a chronological chart axis.
 */
export function isChronologicalPerformancePeriod(period: string): boolean {
  const normalized = period.trim();
  return /^\d{4}$/.test(normalized)
    || /^\d{4}\s+(?:Q[1-4]|[1-4][QÇ])$/iu.test(normalized);
}

/**
 * Midpoint of a free-text target-return string, as a number.
 * "10%-14% targeted annual net return" → 12; "8% annually" → 8;
 * "Quarterly; up to 8.2% annually" → 8.2; "Open-ended fund" → null.
 *
 * Published ranges sign both numbers, so the inner sign is optional — reading
 * only to the first "%" would pass the floor off as the midpoint.
 */
export function parseTargetMidpoint(text: string): number | null {
  if (!text) return null;
  const range = text.match(/(\d+(?:[.,]\d+)?)\s*%?\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*%/);
  if (range) {
    const a = Number(range[1].replace(",", "."));
    const b = Number(range[2].replace(",", "."));
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
  }
  const single = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (single) {
    const n = Number(single[1].replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * A defensible "published last-12-month" return for one fund, as a number.
 *
 * Trailing-return series are heterogeneous: some funds publish cumulative
 * year-to-date quarters (where the latest value is a partial-year figure that
 * would mislead), others publish annual rows or aggregate labels. Selection
 * order, most trustworthy first:
 *   1. an explicit trailing-1-year row ("Year 1" / "1 yıl");
 *   2. else the latest complete calendar year ("2025");
 *   3. else the latest full-year quarter ("2025 Q4" / "2025 4Ç");
 *   4. else null (a partial YTD is excluded rather than shown misleadingly).
 * Reads the canonical English period text, falling back to Turkish.
 */
export type CalendarYearReturn = { year: number; pct: number };

/**
 * Complete calendar-year total returns from a fund's trailing figures, oldest
 * first. A bare "2024" row is a full year; a "2024 Q4" / "2024 4Ç"
 * cumulative-YTD row is treated as that year's full-year total. Partial latest
 * quarters and aggregate labels ("Since inception") are excluded so no
 * incomplete year is ever presented as a full one.
 *
 * Shared source of truth for both the Performance-tab income calculator and the
 * Active/Passive comparison tools (lib/capital/compare-investments.ts).
 */
export function calendarYearReturns(returns?: TrailingReturn[]): CalendarYearReturn[] {
  const byYear = new Map<number, number>();
  for (const row of returns ?? []) {
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
      byYear.set(year, pct); // Q4 cumulative-YTD == full-year total
    }
  }
  return [...byYear.entries()]
    .map(([year, pct]) => ({ year, pct }))
    .sort((a, b) => a.year - b.year);
}

export type IncomeRow = {
  year: number;
  pct: number;
  incomePerYear: number;
  incomePerMonth: number;
};

export type InvestmentIncome = {
  rows: IncomeRow[];
  avgPct: number;
  avgIncomePerYear: number;
  avgIncomePerMonth: number;
  years: number;
};

/**
 * Backward-looking illustration for the Performance tab: what a given amount
 * would have earned each published calendar year, applying the fund's own
 * historical total returns to the amount (income = amount × that year's return).
 * The average row summarizes across the published years. Returns null when the
 * fund has no usable calendar-year history, so the caller can hide the tool.
 *
 * This is history applied to a number, never a forecast — income per year is a
 * total-return figure (includes appreciation), not a promised cash distribution.
 */
export function computeInvestmentIncome(amount: number, returns?: TrailingReturn[]): InvestmentIncome | null {
  const years = calendarYearReturns(returns);
  if (!years.length) return null;

  const rows: IncomeRow[] = years.map(({ year, pct }) => {
    const incomePerYear = amount * (pct / 100);
    return { year, pct, incomePerYear, incomePerMonth: incomePerYear / 12 };
  });
  const avgPct = years.reduce((sum, y) => sum + y.pct, 0) / years.length;
  const avgIncomePerYear = amount * (avgPct / 100);
  return {
    rows,
    avgPct,
    avgIncomePerYear,
    avgIncomePerMonth: avgIncomePerYear / 12,
    years: years.length,
  };
}

export function latestPublished12mReturn(returns?: TrailingReturn[]): number | null {
  if (!returns?.length) return null;
  const periodText = (r: TrailingReturn) => (r.period.en || r.period.tr || "").trim();

  const yearOne = returns.find((r) => /^(?:year\s*1|1\s*(?:yıl|yil))$/i.test(periodText(r)));
  if (yearOne) return parsePerformancePercentage(yearOne.value);

  const byYearDesc = (a: number, b: number) => b - a;

  const fullYears = returns
    .map((r) => ({ r, m: periodText(r).match(/^(\d{4})$/) }))
    .filter((x) => x.m)
    .map((x) => ({ r: x.r, year: Number(x.m![1]) }))
    .sort((a, b) => byYearDesc(a.year, b.year));
  if (fullYears.length) return parsePerformancePercentage(fullYears[0].r.value);

  const q4s = returns
    .map((r) => ({ r, m: periodText(r).match(/^(\d{4})\s+(?:Q4|4[QÇ])$/i) }))
    .filter((x) => x.m)
    .map((x) => ({ r: x.r, year: Number(x.m![1]) }))
    .sort((a, b) => byYearDesc(a.year, b.year));
  if (q4s.length) return parsePerformancePercentage(q4s[0].r.value);

  return null;
}

export type MonthlyIncomeBreakdown = {
  monthlyCash: number;
  monthlyGrowth: number;
  monthlyTotal: number;
  annualCash: number;
  annualGrowth: number;
  annualTotal: number;
  /** Holdings that published a target-distribution rate (drove the cash figure). */
  coverage: number;
};

/**
 * Forward-looking, portfolio-level income estimate: what committed holdings
 * would throw off per month, split into the cash actually distributed and the
 * unrealized growth on top. For each holding, on committed amount A:
 *   cash   = A × (target-distribution midpoint) — the money paid out
 *   total  = A × (target-return midpoint)       — cash + appreciation
 *   growth = max(0, total − cash)               — unrealized paper gain
 * Summed across holdings, then ÷ 12 for the monthly view.
 *
 * Payout frequency is intentionally ignored: an 8%/yr fund paying quarterly and
 * one paying monthly produce the same *average* monthly amount (annual ÷ 12) —
 * frequency changes when cash lands, not the average. One formula therefore
 * withstands monthly / quarterly / semi-annual / annual vehicles alike.
 *
 * This is published targets applied to committed amounts — an illustrative
 * estimate, never a forecast or a promise of income received. Returns null when
 * no holding yields a usable figure, so the caller can render an empty state.
 */
export function portfolioMonthlyIncome(
  rows: { amount: number; targetDistribution?: string | null; targetReturn?: string | null }[],
): MonthlyIncomeBreakdown | null {
  let annualCash = 0;
  let annualTotal = 0;
  let coverage = 0;

  for (const row of rows) {
    if (!(row.amount > 0)) continue;
    const distRate = parseTargetMidpoint(row.targetDistribution ?? "");
    const totalRate = parseTargetMidpoint(row.targetReturn ?? "");

    const cash = distRate != null ? row.amount * (distRate / 100) : 0;
    // Total return falls back to the cash figure when no return is published,
    // and is floored at cash so growth is never negative.
    const total = Math.max(totalRate != null ? row.amount * (totalRate / 100) : cash, cash);

    annualCash += cash;
    annualTotal += total;
    if (distRate != null) coverage += 1;
  }

  if (annualTotal <= 0) return null;
  const annualGrowth = Math.max(0, annualTotal - annualCash);

  return {
    monthlyCash: annualCash / 12,
    monthlyGrowth: annualGrowth / 12,
    monthlyTotal: annualTotal / 12,
    annualCash,
    annualGrowth,
    annualTotal,
    coverage,
  };
}
