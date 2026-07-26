import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarYearReturns,
  computeInvestmentIncome,
  isChronologicalPerformancePeriod,
  parsePerformancePercentage,
  parseTargetMidpoint,
  portfolioMonthlyIncome,
  positionIncome,
  roundedIncome,
} from "../lib/equity-market/performance.ts";
import { paymentsPerYear } from "../lib/equity-market/present.ts";
import type { TrailingReturn } from "../lib/equity-market/types.ts";

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

// The funded position card states cash + growth = target total as a visible
// sum, so these figures are only correct if they actually add up on screen.
const LEGACY_DISTRIBUTION = "Up to 8.2% preferential return a year, paid quarterly";
const LEGACY_RETURN = "12%-15% targeted total annual return";
const LANKIN_DISTRIBUTION = "7%-8% targeted annualized cash distribution, paid monthly";
const LANKIN_RETURN = "10%-14% targeted annual net return";

test("position income splits a holding into cash paid out and unrealized growth", () => {
  const legacy = positionIncome(71250, LEGACY_DISTRIBUTION, LEGACY_RETURN);
  assert.ok(legacy);
  // 71,250 × 8.2% and × 13.5%, to the cent.
  assert.equal(legacy!.annualCash.toFixed(2), "5842.50");
  assert.equal(legacy!.annualGrowth.toFixed(2), "3776.25");
  assert.equal(legacy!.annualTotal.toFixed(2), "9618.75");
  assert.equal(legacy!.hasGrowth, true);

  // No target return published → nothing to add, so the card drops the sum.
  const cashOnly = positionIncome(50000, "6% annually", null);
  assert.ok(cashOnly);
  assert.equal(cashOnly!.annualGrowth, 0);
  assert.equal(cashOnly!.hasGrowth, false);

  // A distribution above the total return floors growth rather than going negative.
  const clamped = positionIncome(50000, "9% annually", "7% annually");
  assert.ok(clamped);
  assert.equal(clamped!.annualGrowth, 0);
});

test("position income is null without a published distribution rate", () => {
  assert.equal(positionIncome(0, LEGACY_DISTRIBUTION, LEGACY_RETURN), null);
  assert.equal(positionIncome(71250, "Open-ended fund", LEGACY_RETURN), null);
  assert.equal(positionIncome(71250, null, LEGACY_RETURN), null);
});

test("rounded income always closes: the total is the sum of its displayed parts", () => {
  const cases = [
    { amount: 71250, distribution: LEGACY_DISTRIBUTION, target: LEGACY_RETURN },
    { amount: 144996.26, distribution: LANKIN_DISTRIBUTION, target: LANKIN_RETURN },
  ];

  for (const { amount, distribution, target } of cases) {
    const income = positionIncome(amount, distribution, target);
    assert.ok(income);
    for (const divisor of [1, 12] as const) {
      const { cash, growth, total } = roundedIncome(income!, divisor);
      assert.equal(cash + growth, total, `${amount} ÷ ${divisor} must add up as displayed`);
    }
  }

  // Legacy is the case a naive Math.round gets wrong: 71,250 × 8.2% is exactly
  // $5,842.50 but evaluates to 5842.4999999999991, which rounds *down* to 5,842
  // and drags the displayed total to 9,618. Settling on cents first restores it.
  const legacy = positionIncome(71250, LEGACY_DISTRIBUTION, LEGACY_RETURN)!;
  assert.equal(Math.round(legacy.annualCash), 5842, "raw float rounds down");
  assert.deepEqual(roundedIncome(legacy, 1), { cash: 5843, growth: 3776, total: 9619 });

  // Monthly is the annual figure over twelve, matching the portfolio helper.
  assert.deepEqual(roundedIncome(legacy, 12), { cash: 487, growth: 315, total: 802 });

  const lankin = positionIncome(144996.26, LANKIN_DISTRIBUTION, LANKIN_RETURN)!;
  assert.deepEqual(roundedIncome(lankin, 1), { cash: 10875, growth: 6525, total: 17400 });
  assert.deepEqual(roundedIncome(lankin, 12), { cash: 906, growth: 544, total: 1450 });
});

test("payments per year reads the cadence the distribution copy already states", () => {
  assert.equal(paymentsPerYear(LEGACY_DISTRIBUTION), 4);
  assert.equal(paymentsPerYear(LANKIN_DISTRIBUTION), 12);
  assert.equal(paymentsPerYear("5% paid semi-annually"), 2);
  // "annualized" inside a rate must not outrank the real cadence beside it.
  assert.equal(paymentsPerYear("7% annualized, paid monthly"), 12);
  assert.equal(paymentsPerYear("Open-ended fund"), null);
});
