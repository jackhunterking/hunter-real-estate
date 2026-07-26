import type {
  PartnerCommissionAllocationPercentage,
  PartnerTier,
} from "./types";

export const PARTNER_COMMISSION_ALLOCATIONS: Record<
  PartnerTier,
  PartnerCommissionAllocationPercentage
> = {
  associate: 30,
  principal: 40,
  managingPartner: 50,
};

export const PARTNER_TIER_THRESHOLDS: Record<PartnerTier, number> = {
  associate: 0,
  principal: 1_000_000,
  managingPartner: 5_000_000,
};

export const PARTNER_TIER_MAXIMUMS: Record<PartnerTier, number | null> = {
  associate: PARTNER_TIER_THRESHOLDS.principal,
  principal: PARTNER_TIER_THRESHOLDS.managingPartner,
  managingPartner: null,
};

export function nextPartnerTier(tier: PartnerTier): PartnerTier | null {
  if (tier === "associate") return "principal";
  if (tier === "principal") return "managingPartner";
  return null;
}

export function commissionAllocationForTier(
  tier: PartnerTier,
): PartnerCommissionAllocationPercentage {
  return PARTNER_COMMISSION_ALLOCATIONS[tier];
}

export function partnerTierForAnnualClearedCapital(amount: number): PartnerTier {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Annual cleared capital must be a non-negative number.");
  }
  if (amount >= PARTNER_TIER_THRESHOLDS.managingPartner) return "managingPartner";
  if (amount >= PARTNER_TIER_THRESHOLDS.principal) return "principal";
  return "associate";
}

export function effectivePartnerBps(
  grossCommissionBps: number,
  tier: PartnerTier,
) {
  if (!Number.isFinite(grossCommissionBps) || grossCommissionBps <= 0) {
    throw new Error("Gross fund commission BPS must be a positive number.");
  }
  const effectiveBps =
    grossCommissionBps * commissionAllocationForTier(tier) / 100;
  return Math.round((effectiveBps + Number.EPSILON) * 100) / 100;
}

export function calculateFundDistributionCommission(
  grossDistributionCommissionAmount: number,
  tier: PartnerTier,
) {
  if (
    !Number.isFinite(grossDistributionCommissionAmount) ||
    grossDistributionCommissionAmount < 0
  ) {
    throw new Error("Gross fund distribution commission must be a non-negative number.");
  }

  const allocationPercentage = commissionAllocationForTier(tier);
  const amount =
    Math.round(
      (grossDistributionCommissionAmount * allocationPercentage) + Number.EPSILON * 100,
    ) / 100;

  return {
    partnerTier: tier,
    allocationPercentage,
    grossDistributionCommissionAmount,
    amount,
  };
}
