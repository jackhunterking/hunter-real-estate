import type { FundComparable, FundPeriod } from "./compare-investments";

/**
 * Pure, server-safe engine for the "Passive vs. Passive" resource tool.
 *
 * One question: with the same cash in either fund, what did each one actually
 * pay over the same period? Nothing here projects — every figure comes from a
 * return the fund published.
 *
 * The hard part is that funds publish different periods. One may have five
 * calendar years while another has one; their "since inception" figures cover
 * different spans entirely. So periods are aligned into a union, and a fund
 * that did not publish a period gets `null` rather than a zero or a guess. The
 * UI renders those gaps as "not published" instead of comparing against them.
 */

/** One row of the comparison: a period, with each fund's return or null. */
export type AlignedPeriod = {
  key: string; // "year-2025" | "since-inception"
  kind: "year" | "inception";
  year?: number;
  a: FundPeriod | null;
  b: FundPeriod | null;
};

function yearPeriods(fund: FundComparable): Map<number, FundPeriod> {
  const byYear = new Map<number, FundPeriod>();
  for (const period of fund.periods) {
    if (period.role !== "inception" && period.year !== undefined) byYear.set(period.year, period);
  }
  return byYear;
}

function inceptionPeriod(fund: FundComparable): FundPeriod | null {
  return fund.periods.find((period) => period.role === "inception") ?? null;
}

/**
 * Every period either fund published, newest year first, with the inception row
 * last. A row where one side is null is still returned — the gap is information.
 */
export function alignFundPeriods(a: FundComparable, b: FundComparable): AlignedPeriod[] {
  const aYears = yearPeriods(a);
  const bYears = yearPeriods(b);
  const years = [...new Set([...aYears.keys(), ...bYears.keys()])].sort((x, y) => y - x);

  const rows: AlignedPeriod[] = years.map((year) => ({
    key: `year-${year}`,
    kind: "year",
    year,
    a: aYears.get(year) ?? null,
    b: bYears.get(year) ?? null,
  }));

  const aInception = inceptionPeriod(a);
  const bInception = inceptionPeriod(b);
  if (aInception || bInception) {
    rows.push({ key: "since-inception", kind: "inception", a: aInception, b: bInception });
  }

  return rows;
}

/** True when the amount entered would not clear the fund's published minimum. */
export function belowMinimum(fund: FundComparable, amount: number): boolean {
  return fund.minimumInvestment !== undefined && amount > 0 && amount < fund.minimumInvestment;
}

/** The calendar year a fund's figures start from, e.g. "2021-09" → 2021. */
export function inceptionYear(fund: FundComparable): number | null {
  const match = fund.inceptionDate?.match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}
