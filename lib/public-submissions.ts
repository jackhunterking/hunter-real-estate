import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type SubmissionResult = {
  submission_id: string;
  email_job_id: string;
};

export async function persistPublicSubmission(
  functionName:
    | "submit_guide_request"
    | "submit_capital_intake"
    | "submit_investor_readiness",
  payload: Record<string, unknown>,
) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("submission-service-unavailable");
  }

  const result = await supabase.rpc(functionName, {
    p_input: payload as Json,
  });
  if (result.error) {
    console.error("submission_rpc_failed", {
      functionName,
      code: result.error.code,
    });
    throw new Error("submission-write-failed");
  }

  return result.data as SubmissionResult;
}
