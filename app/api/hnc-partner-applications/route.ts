import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";

const Body = z.object({
  organizationId: z.string().uuid().nullable().optional(),
  registeredFirstNames: z.string().min(1), registryLastName: z.string().min(1),
  normalizedRegistryLastName: z.string().min(1), licenceDocumentNumber: z.string().min(1),
  licenceType: z.string().min(1), professionalTitle: z.string().min(1),
  firmWorkEmail: z.string().email(), evidenceStoragePath: z.string().nullable().optional(),
  newFirmLegalName: z.string().nullable().optional(), newFirmTradingName: z.string().nullable().optional(),
  newFirmType: z.string().nullable().optional(), newFirmWebsite: z.string().nullable().optional(),
  newFirmBusinessDomain: z.string().nullable().optional(), newFirmSpkRegistration: z.string().nullable().optional(),
  newFirmRegisteredAddress: z.string().nullable().optional(), newFirmAuthorizedContact: z.string().nullable().optional(),
  newFirmComplianceContact: z.string().nullable().optional(), newFirmEvidenceStoragePath: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid application." }, { status: 400 });
  const p = parsed.data;
  return portalRpc("submit_partner_application", {
    p_organization_id: p.organizationId ?? null, p_registered_first_names: p.registeredFirstNames,
    p_registry_last_name: p.registryLastName, p_normalized_registry_last_name: p.normalizedRegistryLastName,
    p_licence_document_number: p.licenceDocumentNumber, p_licence_type: p.licenceType,
    p_professional_title: p.professionalTitle, p_firm_work_email: p.firmWorkEmail,
    p_evidence_storage_path: p.evidenceStoragePath ?? null, p_new_firm_legal_name: p.newFirmLegalName ?? null,
    p_new_firm_trading_name: p.newFirmTradingName ?? null, p_new_firm_type: p.newFirmType ?? null,
    p_new_firm_website: p.newFirmWebsite ?? null, p_new_firm_business_domain: p.newFirmBusinessDomain ?? null,
    p_new_firm_spk_registration: p.newFirmSpkRegistration ?? null, p_new_firm_registered_address: p.newFirmRegisteredAddress ?? null,
    p_new_firm_authorized_contact: p.newFirmAuthorizedContact ?? null, p_new_firm_compliance_contact: p.newFirmComplianceContact ?? null,
    p_new_firm_evidence_storage_path: p.newFirmEvidenceStoragePath ?? null,
  });
}
