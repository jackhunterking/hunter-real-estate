import test from "node:test";
import assert from "node:assert/strict";
import {
  PARTNER_COMMISSION_ALLOCATIONS,
  PARTNER_TIER_THRESHOLDS,
  calculateFundDistributionCommission,
  effectivePartnerBps,
  partnerTierForAnnualClearedCapital,
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

test("annual cleared-capital tiers use the new one-million and five-million boundaries", () => {
  assert.deepEqual(PARTNER_TIER_THRESHOLDS, {
    associate: 0,
    principal: 1_000_000,
    managingPartner: 5_000_000,
  });
  assert.equal(partnerTierForAnnualClearedCapital(0), "associate");
  assert.equal(partnerTierForAnnualClearedCapital(999_999.99), "associate");
  assert.equal(partnerTierForAnnualClearedCapital(1_000_000), "principal");
  assert.equal(partnerTierForAnnualClearedCapital(4_999_999.99), "principal");
  assert.equal(partnerTierForAnnualClearedCapital(5_000_000), "managingPartner");
  assert.throws(() => partnerTierForAnnualClearedCapital(-1), /non-negative/);
});

test("fund schedules translate a 600 BPS gross rate into effective partner BPS", () => {
  assert.equal(effectivePartnerBps(600, "associate"), 180);
  assert.equal(effectivePartnerBps(600, "principal"), 240);
  assert.equal(effectivePartnerBps(600, "managingPartner"), 300);
  assert.equal(effectivePartnerBps(612.34, "associate"), 183.7);
  assert.throws(() => effectivePartnerBps(0, "associate"), /positive/);

  // Presentation metadata never replaces the actual received-dollar payout.
  assert.equal(calculateFundDistributionCommission(10_000, "associate").amount, 3_000);
});
