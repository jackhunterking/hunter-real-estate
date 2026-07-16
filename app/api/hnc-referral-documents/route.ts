import { z } from "zod";
import { portalRpc } from "@/lib/capital/portal-route";
const Body = z.object({ referralId: z.string().uuid(), storagePath: z.string().min(1), filename: z.string().min(1), documentCategory: z.string().min(1), mimeType: z.string().min(1), byteSize: z.number().int().nonnegative() });
export async function POST(request: Request) {
  const p = Body.safeParse(await request.json().catch(() => null)); if (!p.success) return Response.json({ error: "Invalid document." }, { status: 400 });
  return portalRpc("register_referral_document", { p_referral_id: p.data.referralId, p_storage_path: p.data.storagePath, p_filename: p.data.filename, p_document_category: p.data.documentCategory, p_mime_type: p.data.mimeType, p_byte_size: p.data.byteSize });
}
