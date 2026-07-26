export const READINESS_RULESET = {
  id: "ontario-ni-45-106-2023-09-13",
  effectiveDate: "2023-09-13",
  reviewedDate: "2026-07-15",
  sources: [
    "https://www.osc.ca/sites/default/files/2023-10/ni_20230913_45-106_unofficial%20consolidation.pdf",
    "https://www.osc.ca/sites/default/files/2024-04/cp_20230609_45-106cp_unofficial-consolidation.pdf",
  ],
  omLimits: { nonEligible: 10000, eligible: 30000, eligibleWithAdvice: 100000 },
} as const;
