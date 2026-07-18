import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";

const Body = z.object({
  firmName: z.string().trim().min(1).max(240),
  registeredFirstNames: z.string().trim().min(1).max(240),
  registryLastName: z.string().trim().min(1).max(160),
  normalizedRegistryLastName: z.string().trim().min(1).max(160),
  licenceDocumentNumber: z.string().trim().min(1).max(160),
  licenceType: z.string().trim().min(1).max(240),
  professionalTitle: z.string().trim().min(1).max(240),
  firmWorkEmail: z.string().trim().email().max(320),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid application." }, { status: 400 });
  const p = parsed.data;
  return portalRpc("submit_partner_application", {
    p_organization_id: null, p_registered_first_names: p.registeredFirstNames,
    p_registry_last_name: p.registryLastName, p_normalized_registry_last_name: p.normalizedRegistryLastName,
    p_licence_document_number: p.licenceDocumentNumber, p_licence_type: p.licenceType,
    p_professional_title: p.professionalTitle, p_firm_work_email: p.firmWorkEmail,
    p_evidence_storage_path: null, p_new_firm_legal_name: p.firmName,
    p_new_firm_trading_name: null, p_new_firm_type: "pending_review",
    p_new_firm_website: null, p_new_firm_business_domain: null,
    p_new_firm_spk_registration: null, p_new_firm_registered_address: null,
    p_new_firm_authorized_contact: null, p_new_firm_compliance_contact: null,
    p_new_firm_evidence_storage_path: null,
  });
}
