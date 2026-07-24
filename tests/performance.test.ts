import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarYearReturns,
  computeInvestmentIncome,
  isChronologicalPerformancePeriod,
  parsePerformancePercentage,
  parseTargetMidpoint,
  portfolioMonthlyIncome,
} from "../lib/capital/performance.ts";
import type { TrailingReturn } from "../lib/capital/types.ts";

const yr = (en: string, value: string): TrailingReturn => ({ period: { en, tr: en }, value });

test("performance percentage parsing accepts published numeric percentages", () => {
  assert.equal(parsePerformancePercentage("8.60%"), 8.6);
  assert.equal(parsePerformancePercentage(" -2.5 % "), -2.5);
  assert.equal(parsePerformancePercentage("0%"), 0);
  assert.equal(parsePerformancePercentage("4,25%"), 4.25);
});

test("performance percentage parsing rejects non-chartable display values", () => {
  assert.equal(parsePerformancePercentage("10%-14%"), null);
  assert.equal(parsePerformancePercentage("N/A"), null);
  assert.equal(parsePerformancePercentage(""), null);
});

test("a target midpoint sits between both published ends, however the range is signed", () => {
  // Both live investments sign each end ("10%-14%"); reading to the first "%"
  // returned the floor as the midpoint, understating every blended projection.
  assert.equal(parseTargetMidpoint("10%-14% targeted annual net return"), 12);
  assert.equal(parseTargetMidpoint("12%-15% targeted total annual return"), 13.5);
  assert.equal(parseTargetMidpoint("10-14% annual net return"), 12);
  assert.equal(parseTargetMidpoint("10 % – 14 % targeted"), 12);
});

test("a target midpoint falls back to the only figure, or to nothing", () => {
  assert.equal(parseTargetMidpoint("8% annually"), 8);
  assert.equal(parseTargetMidpoint("Quarterly; up to 8.2% annually"), 8.2);
  assert.equal(parseTargetMidpoint("Open-ended fund"), null);
  assert.equal(parseTargetMidpoint(""), null);
});

test("only annual and bilingual quarterly periods are chronological", () => {
  for (const period of ["2021", "2025 Q1", "2025 1Ç", "2025 2Q"]) {
    assert.equal(isChronologicalPerformancePeriod(period), true, period);
  }
  for (const period of ["Year 1", "Year 3", "Since inception", "1 yıl", "Kuruluştan bu yana"]) {
    assert.equal(isChronologicalPerformancePeriod(period), false, period);
  }
});

test("calendar-year returns keep clean annual rows oldest-first", () => {
  // Epiphany-shaped: five bare calendar years.
  const rows = calendarYearReturns([
    yr("2021", "2.17%"), yr("2022", "8.60%"), yr("2023", "8.60%"),
    yr("2024", "13.97%"), yr("2025", "8.20%"),
  ]);
  assert.deepEqual(rows.map((r) => r.year), [2021, 2022, 2023, 2024, 2025]);
  assert.equal(rows[3].pct, 13.97);
});

test("calendar-year returns treat Q4 cumulative-YTD as the full year and drop partial quarters", () => {
  // Lankin-shaped: cumulative YTD quarters, with a partial current-year quarter.
  const rows = calendarYearReturns([
    yr("2025 Q1", "4.1%"), yr("2025 Q2", "7.2%"), yr("2025 Q3", "10.2%"),
    yr("2025 Q4", "14.9%"), yr("2026 Q1", "3.2%"),
  ]);
  // Only the completed year survives, taken from its Q4 total.
  assert.deepEqual(rows, [{ year: 2025, pct: 14.9 }]);
});

test("calendar-year returns ignore aggregate labels and unparseable values", () => {
  const rows = calendarYearReturns([
    yr("Since inception", "11.89%"), yr("Year 1", "8.46%"), yr("2024", "N/A"),
  ]);
  assert.deepEqual(rows, []);
  assert.deepEqual(calendarYearReturns([]), []);
  assert.deepEqual(calendarYearReturns(undefined), []);
});

test("investment income applies each year's return to the amount, per year and per month", () => {
  const result = computeInvestmentIncome(25000, [
    yr("2021", "2.17%"), yr("2022", "8.60%"), yr("2024", "13.97%"),
  ]);
  assert.ok(result);
  assert.equal(result!.years, 3);
  const y2024 = result!.rows.find((r) => r.year === 2024)!;
  assert.equal(Math.round(y2024.incomePerYear), 3493); // 25000 × 13.97%
  assert.equal(Math.round(y2024.incomePerMonth), 291); // ÷ 12
  // Average across the three published years.
  assert.ok(Math.abs(result!.avgPct - (2.17 + 8.6 + 13.97) / 3) < 1e-9);
  assert.equal(Math.round(result!.avgIncomePerYear), Math.round(25000 * result!.avgPct / 100));
});

test("investment income is null when there is no usable calendar-year history", () => {
  assert.equal(computeInvestmentIncome(25000, []), null);
  assert.equal(computeInvestmentIncome(25000, [yr("Since inception", "11.89%")]), null);
});

test("portfolio monthly income splits cash + growth across mixed-frequency holdings", () => {
  // Frequency ("Quarterly"/"Monthly") is prose the cash rate is read past — it
  // must not change the average, which is always annual ÷ 12.
  const result = portfolioMonthlyIncome([
    { amount: 145000, targetDistribution: "Quarterly; up to 8.2% annually", targetReturn: "12%-15%" },
    { amount: 90000, targetDistribution: "Monthly; 7-8% annually", targetReturn: "10%-14%" },
  ]);
  assert.ok(result);
  // Cash = 145k×8.2% + 90k×7.5% = 11,890 + 6,750 = 18,640 /yr.
  assert.equal(Math.round(result!.annualCash), 18640);
  // Total = 145k×13.5% + 90k×12% = 19,575 + 10,800 = 30,375 /yr.
  assert.equal(Math.round(result!.annualTotal), 30375);
  assert.equal(Math.round(result!.annualGrowth), 30375 - 18640);
  assert.equal(Math.round(result!.monthlyTotal), Math.round(30375 / 12));
  // Cash + growth reconstruct the total, and both holdings published a rate.
  assert.ok(Math.abs(result!.monthlyCash + result!.monthlyGrowth - result!.monthlyTotal) < 1e-9);
  assert.equal(result!.coverage, 2);
});

test("portfolio monthly income falls back to cash and never shows negative growth", () => {
  // No target return published → total falls back to the cash figure, growth 0.
  const noReturn = portfolioMonthlyIncome([
    { amount: 100000, targetDistribution: "6% annually", targetReturn: null },
  ]);
  assert.ok(noReturn);
  assert.equal(Math.round(noReturn!.annualTotal), 6000);
  assert.equal(noReturn!.annualGrowth, 0);

  // Distribution above the total return is floored, not shown as negative growth.
  const clamped = portfolioMonthlyIncome([
    { amount: 100000, targetDistribution: "9% annually", targetReturn: "7% annually" },
  ]);
  assert.ok(clamped);
  assert.equal(Math.round(clamped!.annualTotal), 9000);
  assert.equal(clamped!.annualGrowth, 0);
});

test("portfolio monthly income is null when nothing usable is committed", () => {
  assert.equal(portfolioMonthlyIncome([]), null);
  assert.equal(portfolioMonthlyIncome([{ amount: 0, targetDistribution: "8%", targetReturn: "12%" }]), null);
  assert.equal(portfolioMonthlyIncome([{ amount: 50000, targetDistribution: "Open-ended", targetReturn: "n/a" }]), null);
});
