import assert from "node:assert/strict";
import test from "node:test";
import type { FundComparable, FundPeriod } from "../lib/equity-market/compare-investments.ts";
import { toFundComparable } from "../lib/equity-market/compare-investments.ts";
import { alignFundPeriods, belowMinimum, inceptionYear } from "../lib/equity-market/compare-funds.ts";
import type { OfferingBundle } from "../lib/equity-market/types.ts";

function fund(id: string, periods: FundPeriod[], extra: Partial<FundComparable> = {}): FundComparable {
  return {
    id,
    slug: id,
    shortName: { en: id, tr: id },
    managerName: { en: "Manager", tr: "Manager" },
    periods,
    ...extra,
  };
}

const year = (y: number, pct: number): FundPeriod => ({ key: `year-${y}`, role: "older", year: y, pct });

test("aligned periods are the union of both funds, newest year first", () => {
  const rows = alignFundPeriods(
    fund("a", [year(2025, 14.9)]),
    fund("b", [year(2025, 8.2), year(2024, 13.97), year(2023, 8.6)]),
  );

  assert.deepEqual(rows.map((row) => row.key), ["year-2025", "year-2024", "year-2023"]);
  assert.equal(rows[0].a?.pct, 14.9);
  assert.equal(rows[0].b?.pct, 8.2);
});

test("a year only one fund published keeps the row and nulls the other side", () => {
  const rows = alignFundPeriods(fund("a", [year(2025, 14.9)]), fund("b", [year(2023, 8.6)]));

  const only2023 = rows.find((row) => row.year === 2023);
  assert.equal(only2023?.a, null);
  assert.equal(only2023?.b?.pct, 8.6);
});

test("the inception row sorts last and survives one side missing it", () => {
  const rows = alignFundPeriods(
    fund("a", [year(2025, 14.9)]),
    fund("b", [year(2025, 8.2), { key: "since-inception", role: "inception", pct: 11.89 }]),
  );

  const last = rows[rows.length - 1];
  assert.equal(last.key, "since-inception");
  assert.equal(last.kind, "inception");
  assert.equal(last.a, null);
  assert.equal(last.b?.pct, 11.89);
});

test("no inception row at all when neither fund has one", () => {
  const rows = alignFundPeriods(fund("a", [year(2025, 14.9)]), fund("b", [year(2025, 8.2)]));
  assert.equal(rows.length, 1);
});

/** Minimal bundle shaped only as far as toFundComparable actually reads it. */
function bundle(trailing: { period: string; value: string }[]): OfferingBundle {
  return {
    id: "o1",
    slug: "o1",
    shortName: { en: "Fund", tr: "Fund" },
    manager: { name: { en: "Manager", tr: "Manager" } },
    shareClasses: [{ minimumInvestment: { value: 5000 } }],
    trailingReturns: trailing.map((row) => ({ period: { en: row.period, tr: row.period }, value: row.value })),
    inceptionDate: "2024",
  } as unknown as OfferingBundle;
}

test("a since-inception figure we derived is flagged, a published one is not", () => {
  // Lankin's shape: cumulative-YTD quarters, so only Q4 counts as a full year
  // and there is no published since-inception row to fall back on.
  const derived = toFundComparable(bundle([
    { period: "2025 Q1", value: "4.1%" },
    { period: "2025 Q4", value: "14.9%" },
  ]));
  const inception = derived?.periods.find((p) => p.role === "inception");
  assert.equal(inception?.pct, 14.9);
  assert.equal(inception?.derived, true);

  const published = toFundComparable(bundle([
    { period: "2025", value: "8.20%" },
    { period: "Since inception", value: "11.89%" },
  ]));
  const real = published?.periods.find((p) => p.role === "inception");
  assert.equal(real?.pct, 11.89);
  assert.equal(real?.derived, false);
});

test("published terms travel with the comparable", () => {
  const comparable = toFundComparable(bundle([{ period: "2025", value: "8.20%" }]));
  assert.equal(comparable?.minimumInvestment, 5000);
  assert.equal(comparable?.inceptionDate, "2024");
  assert.equal(inceptionYear(comparable!), 2024);
});

test("an amount under the published minimum is flagged, zero is not", () => {
  const f = fund("a", [year(2025, 8)], { minimumInvestment: 5000 });
  assert.equal(belowMinimum(f, 2000), true);
  assert.equal(belowMinimum(f, 5000), false);
  assert.equal(belowMinimum(f, 0), false); // an empty field is not a violation
  assert.equal(belowMinimum(fund("b", [year(2025, 8)]), 1), false);
});
