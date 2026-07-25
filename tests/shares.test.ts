import test from "node:test";
import assert from "node:assert/strict";
import {
  unitPriceOf,
  sharesAffordable,
  investedAmount,
  leftover,
  impliedShares,
} from "../lib/capital/shares.ts";
import type { OfferingBundle } from "../lib/capital/types.ts";

/** Minimal bundle carrying just a primary share class unit price. */
const bundleWithPrice = (value: unknown): OfferingBundle =>
  ({ shareClasses: [{ unitPrice: value == null ? undefined : { value } }] } as unknown as OfferingBundle);

test("sharesAffordable buys only whole units the budget covers in full", () => {
  // Owner's worked example: $100k at $450/unit → 222 units, $99,900, $100 left.
  assert.equal(sharesAffordable(100_000, 450), 222);
  assert.equal(investedAmount(222, 450), 99_900);
  assert.equal(leftover(100_000, 450), 100);
});

test("whole-share math on the real seed prices", () => {
  // Lankin $10.61
  assert.equal(sharesAffordable(100_000, 10.61), 9425);
  assert.equal(investedAmount(9425, 10.61), 99_999.25);
  assert.equal(leftover(100_000, 10.61), 0.75);
  // Epiphany $4.75
  assert.equal(sharesAffordable(100_000, 4.75), 21_052);
  assert.equal(investedAmount(21_052, 4.75), 99_997);
  assert.equal(leftover(100_000, 4.75), 3);
});

test("a budget below one unit price buys nothing", () => {
  assert.equal(sharesAffordable(100, 450), 0);
  assert.equal(investedAmount(0, 450), 0);
  assert.equal(leftover(100, 450), 100);
});

test("missing / non-positive price is guarded everywhere (no divide-by-zero)", () => {
  assert.equal(sharesAffordable(1000, null), 0);
  assert.equal(sharesAffordable(1000, 0), 0);
  assert.equal(investedAmount(5, null), 0);
  assert.equal(leftover(1000, null), 0);
  assert.equal(impliedShares(1000, null), null);
});

test("unitPriceOf reads the primary class price, else null", () => {
  assert.equal(unitPriceOf(bundleWithPrice(10.61)), 10.61);
  assert.equal(unitPriceOf(bundleWithPrice(0)), null);
  assert.equal(unitPriceOf(bundleWithPrice(Number.NaN)), null);
  assert.equal(unitPriceOf(bundleWithPrice(null)), null);
  assert.equal(unitPriceOf({ shareClasses: [] } as unknown as OfferingBundle), null);
  assert.equal(unitPriceOf(undefined), null);
});

test("impliedShares recovers a (possibly fractional) unit count for legacy amount-only rows", () => {
  assert.equal(impliedShares(10_610, 10.61), 1000);
  assert.equal(impliedShares(0, 10.61), null);
});
