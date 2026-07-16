import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
const Create = z.object({ beneficiaryType: z.enum(["representative", "organization"]), beneficiaryUserId: z.string().uuid().nullable().optional(), beneficiaryOrganizationId: z.string().uuid().nullable().optional(), introducingRepresentativeId: z.string().uuid(), referralId: z.string().uuid().nullable().optional(), redactedReferralReference: z.string().min(1), offeringId: z.string().min(1), grossDistributionCommissionAmount: z.number().positive(), currency: z.string().length(3), earningPeriod: z.string().min(1), fundedAt: z.string(), distributionCommissionReceivedAt: z.string(), description: z.string(), status: z.enum(["draft", "approved"]).optional() });
const Update = z.object({ commissionId: z.string().uuid(), status: z.enum(["approved", "paid", "void"]), paymentReference: z.string().nullable().optional() });
export async function POST(request: Request) {
  const p = Create.safeParse(await request.json().catch(() => null)); if (!p.success) return Response.json({ error: "Invalid commission." }, { status: 400 });
  const d = p.data; return portalRpc("create_commission_entry", { p_beneficiary_type: d.beneficiaryType, p_beneficiary_user_id: d.beneficiaryUserId ?? null, p_beneficiary_organization_id: d.beneficiaryOrganizationId ?? null, p_introducing_representative_id: d.introducingRepresentativeId, p_referral_id: d.referralId ?? null, p_redacted_referral_reference: d.redactedReferralReference, p_offering_id: d.offeringId, p_gross_distribution_commission_amount: d.grossDistributionCommissionAmount, p_currency: d.currency, p_earning_period: d.earningPeriod, p_funded_at: d.fundedAt, p_distribution_commission_received_at: d.distributionCommissionReceivedAt, p_description: d.description, p_status: d.status ?? "draft" });
}
export async function PATCH(request: Request) {
  const p = Update.safeParse(await request.json().catch(() => null)); if (!p.success) return Response.json({ error: "Invalid commission status." }, { status: 400 });
  return portalRpc("set_commission_status", { p_commission_id: p.data.commissionId, p_status: p.data.status, p_payment_reference: p.data.paymentReference ?? null });
}
