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
