import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
const Body = z.object({ applicationId: z.string().uuid(), result: z.enum(["pending", "verified", "mismatch", "not_found", "suspended", "expired", "revoked", "manual_review"]), returnedLicenceTypes: z.array(z.string()), returnedStatus: z.string(), renewalInformation: z.string().nullable().optional(), employmentInformation: z.string().nullable().optional(), reviewerNotes: z.string().nullable().optional(), evidenceStoragePath: z.string().nullable().optional() });
export async function POST(request: Request) {
  const p = Body.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: "Invalid verification." }, { status: 400 });
  return portalRpc("record_license_verification", { p_application_id: p.data.applicationId, p_result: p.data.result, p_returned_licence_types: p.data.returnedLicenceTypes, p_returned_status: p.data.returnedStatus, p_renewal_information: p.data.renewalInformation ?? null, p_employment_information: p.data.employmentInformation ?? null, p_reviewer_notes: p.data.reviewerNotes ?? null, p_evidence_storage_path: p.data.evidenceStoragePath ?? null });
}
