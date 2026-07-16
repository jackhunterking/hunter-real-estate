import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
const Create = z.object({ accountType: z.enum(["individual", "entity"]), firstName: z.string().min(1), lastName: z.string().min(1), displayName: z.string().min(1), organization: z.string().nullable().optional(), email: z.string().email(), phone: z.string().nullable().optional(), country: z.string().min(1), region: z.string().nullable().optional(), city: z.string().nullable().optional(), offeringId: z.string().nullable().optional(), indicativeAmount: z.number().nonnegative().nullable().optional() });
const Update = z.object({ referralId: z.string().uuid() });
export async function POST(request: Request) {
  const p = Create.safeParse(await request.json().catch(() => null)); if (!p.success) return Response.json({ error: "Invalid referral." }, { status: 400 });
  const d = p.data; return portalRpc("create_referral", { p_client_account_type: d.accountType, p_client_first_name: d.firstName, p_client_last_name: d.lastName, p_client_display_name: d.displayName, p_client_organization: d.organization ?? null, p_client_email: d.email, p_client_phone: d.phone ?? null, p_country: d.country, p_region: d.region ?? null, p_city: d.city ?? null, p_offering_id: d.offeringId ?? null, p_indicative_amount: d.indicativeAmount ?? null });
}
export async function PATCH(request: Request) {
  const p = Update.safeParse(await request.json().catch(() => null)); if (!p.success) return Response.json({ error: "Invalid referral." }, { status: 400 });
  return portalRpc("mark_referral_contacted", { p_referral_id: p.data.referralId });
}
