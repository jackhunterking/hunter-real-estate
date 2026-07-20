import { LearningTransitionSchema } from "@/lib/capital/learning-schema";
import { portalRpc } from "@/lib/capital/portal-route";

export async function POST(request: Request, { params }: { params: Promise<{ resourceId: string; versionId: string }> }) {
  const { resourceId, versionId } = await params;
  const parsed = LearningTransitionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "A valid workflow action and required review note are needed." }, { status: 400 });
  return portalRpc("transition_learning_resource", {
    p_resource_id: resourceId,
    p_version_id: versionId,
    p_action: parsed.data.action,
    p_note: parsed.data.note ?? null,
  });
}
