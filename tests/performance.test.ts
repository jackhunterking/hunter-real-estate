import test from "node:test";
import assert from "node:assert/strict";
import {
  isChronologicalPerformancePeriod,
  parsePerformancePercentage,
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

test("only annual and bilingual quarterly periods are chronological", () => {
  for (const period of ["2021", "2025 Q1", "2025 1Ç", "2025 2Q"]) {
    assert.equal(isChronologicalPerformancePeriod(period), true, period);
  }
  for (const period of ["Year 1", "Year 3", "Since inception", "1 yıl", "Kuruluştan bu yana"]) {
    assert.equal(isChronologicalPerformancePeriod(period), false, period);
  }
});
