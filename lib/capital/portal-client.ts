"use client";

const routes: Record<string, { url: string; method: "POST" | "PATCH" }> = {
  submitPartnerApplication: { url: "/api/hnc-partner-applications", method: "POST" },
  decideMembership: { url: "/api/hnc-memberships", method: "PATCH" },
  assignMembershipRoles: { url: "/api/hnc-memberships/roles", method: "PATCH" },
  recordLicenseVerification: { url: "/api/hnc-license-verifications", method: "POST" },
  decideOrganization: { url: "/api/hnc-organizations", method: "PATCH" },
  createCommission: { url: "/api/hnc-commissions", method: "POST" },
  setCommissionStatus: { url: "/api/hnc-commissions", method: "PATCH" },
  createReferral: { url: "/api/hnc-referrals", method: "POST" },
  markReferralContacted: { url: "/api/hnc-referrals", method: "PATCH" },
  registerReferralDocument: { url: "/api/hnc-referral-documents", method: "POST" },
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
