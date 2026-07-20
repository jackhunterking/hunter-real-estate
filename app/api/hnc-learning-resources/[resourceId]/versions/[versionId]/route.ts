import { LearningDraftSchema, learningRpcInput } from "@/lib/capital/learning-schema";
import { portalRpc } from "@/lib/capital/portal-route";

export async function PATCH(request: Request, { params }: { params: Promise<{ resourceId: string; versionId: string }> }) {
  const { resourceId, versionId } = await params;
  const parsed = LearningDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Complete bilingual content and at least one HTTPS source are required." }, { status: 400 });
  return portalRpc("update_learning_resource_draft", {
    p_resource_id: resourceId,
    p_version_id: versionId,
    p_input: learningRpcInput(parsed.data),
  });
}
