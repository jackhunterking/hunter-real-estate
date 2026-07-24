import test from "node:test";
import assert from "node:assert/strict";
import {
  isChronologicalPerformancePeriod,
  parsePerformancePercentage,
  parseTargetMidpoint,
} from "../lib/capital/performance.ts";

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
