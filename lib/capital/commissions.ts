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
