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
  associate: 50_000,
  principal: 1_000_000,
  managingPartner: 5_000_000,
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
