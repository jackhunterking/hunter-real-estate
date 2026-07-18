import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";

const RequestBody = z.object({
  offeringId: z.string().trim().min(1).max(100),
  amount: z.number().finite().positive().max(1_000_000_000),
  accountType: z.enum(["individual", "entity"]),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]),
  contactConsent: z.literal(true),
  note: z.string().trim().max(2000).optional().default(""),
});

export async function POST(request: Request) {
  const parsed = RequestBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid investment request." }, { status: 400 });
  }
  return portalRpc("create_investment_request", {
    p_offering_id: parsed.data.offeringId,
    p_amount: parsed.data.amount,
    p_account_type: parsed.data.accountType,
    p_preferred_contact_method: parsed.data.preferredContactMethod,
    p_contact_consent: parsed.data.contactConsent,
    p_note: parsed.data.note,
  });
}
