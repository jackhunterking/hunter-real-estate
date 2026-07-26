"use client";

const routes: Record<string, { url: string; method: "POST" | "PATCH" }> = {
  submitPartnerApplication: { url: "/api/portal-partner-applications", method: "POST" },
  decideMembership: { url: "/api/portal-memberships", method: "PATCH" },
  assignMembershipRoles: { url: "/api/portal-memberships/roles", method: "PATCH" },
  recordLicenseVerification: { url: "/api/portal-license-verifications", method: "POST" },
  decideOrganization: { url: "/api/portal-organizations", method: "PATCH" },
  createCommission: { url: "/api/portal-commissions", method: "POST" },
  setCommissionStatus: { url: "/api/portal-commissions", method: "PATCH" },
  setInvestmentStatus: { url: "/api/portal-investment-status", method: "PATCH" },
  createReferral: { url: "/api/portal-referrals", method: "POST" },
  markReferralContacted: { url: "/api/portal-referrals", method: "PATCH" },
  registerReferralDocument: { url: "/api/portal-referral-documents", method: "POST" },
  saveReferralQualificationAssessment: { url: "/api/portal-referral-qualification-assessments", method: "POST" },
};

export async function portalRequest(action: string, payload: Record<string, unknown>) {
  const route = routes[action];
  if (!route) throw new Error("Unsupported portal mutation.");
  const response = await fetch(route.url, {
    method: route.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(result.error ?? "The portal update could not be saved.");
  return result.data;
}
