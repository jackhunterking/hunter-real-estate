import test from "node:test";
import assert from "node:assert/strict";
import {
  PARTNER_COMMISSION_ALLOCATIONS,
  calculateFundDistributionCommission,
} from "../lib/capital/commissions.ts";

test("partner tiers receive 30%, 40%, and 50% of gross fund distribution commission", () => {
  assert.deepEqual(PARTNER_COMMISSION_ALLOCATIONS, {
    associate: 30,
    principal: 40,
    managingPartner: 50,
  });

  assert.equal(calculateFundDistributionCommission(10_000, "associate").amount, 3_000);
  assert.equal(calculateFundDistributionCommission(10_000, "principal").amount, 4_000);
  assert.equal(
    calculateFundDistributionCommission(10_000, "managingPartner").amount,
    5_000,
  );
});

test("fund distribution commission calculations round to currency cents", () => {
  assert.equal(calculateFundDistributionCommission(123.45, "associate").amount, 37.04);
  assert.equal(calculateFundDistributionCommission(123.45, "principal").amount, 49.38);
  assert.equal(
    calculateFundDistributionCommission(123.45, "managingPartner").amount,
    61.73,
  );
});

test("fund distribution commission calculations reject invalid gross amounts", () => {
  assert.throws(
    () => calculateFundDistributionCommission(-1, "associate"),
    /non-negative/,
  );
  assert.throws(
    () => calculateFundDistributionCommission(Number.NaN, "associate"),
    /non-negative/,
  );
});
