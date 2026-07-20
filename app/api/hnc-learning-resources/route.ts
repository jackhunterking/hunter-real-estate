import { LearningDraftSchema, learningRpcInput } from "@/lib/capital/learning-schema";
import { portalRpc } from "@/lib/capital/portal-route";

export async function POST(request: Request) {
  const parsed = LearningDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Complete bilingual content and at least one HTTPS source are required." }, { status: 400 });
  return portalRpc("create_learning_resource", { p_input: learningRpcInput(parsed.data) });
}
