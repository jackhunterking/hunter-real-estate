import "server-only";

import { Resend } from "resend";
import { renderEmailJob, type EmailJobTemplate } from "@/lib/email/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DeliveryStatus = "sent" | "queued";

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function loadEmailJob(jobId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const result = await supabase.rpc("get_email_job", { p_job_id: jobId });
  if (result.error) {
    console.error("email_job_load_failed", { jobId, code: result.error.code });
    return null;
  }
  const job = result.data as EmailJobTemplate | null;
  if (job?.templateKey === "guide-delivery") {
    const guide = job.variables.guide === "satici" ? "satici" : "alici";
    const language = job.variables.language === "en" ? "en" : "tr";
    const assetResult = await supabase
      .from("published_guide_assets")
      .select("bucket_id,storage_path")
      .eq("guide_key", guide)
      .eq("language", language)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (assetResult.data) {
      const signed = await supabase.storage
        .from(assetResult.data.bucket_id)
        .createSignedUrl(assetResult.data.storage_path, 60 * 60 * 24);
      if (signed.data?.signedUrl) {
        job.variables = { ...job.variables, guideUrl: signed.data.signedUrl };
      }
    }
  }
  return job;
}

async function markSent(jobId: string, resendEmailId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const result = await supabase.rpc("mark_email_job_sent", {
    p_job_id: jobId,
    p_resend_email_id: resendEmailId,
  });
  if (result.error) {
    console.error("email_job_sent_update_failed", {
      jobId,
      code: result.error.code,
    });
  }
}

async function markFailed(jobId: string, reason: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const result = await supabase.rpc("mark_email_job_failed", {
    p_job_id: jobId,
    p_reason: reason.slice(0, 300),
  });
  if (result.error) {
    console.error("email_job_failure_update_failed", {
      jobId,
      code: result.error.code,
    });
  }
}

export async function deliverEmailJob(jobId: string): Promise<DeliveryStatus> {
  const client = resendClient();
  if (!client) return "queued";

  const job = await loadEmailJob(jobId);
  if (!job) return "queued";
  const email = renderEmailJob(job);

  try {
    const result = await client.emails.send(
      {
        from: email.from,
        to: email.to,
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: {
          "X-Entity-Reference": job.relatedEntityId,
        },
      },
      {
        idempotencyKey: `transactional/${job.category}/${job.id}`,
      },
    );
    if (result.error || !result.data?.id) {
      await markFailed(job.id, result.error?.message ?? "missing-resend-id");
      return "queued";
    }
    await markSent(job.id, result.data.id);
    return "sent";
  } catch (error) {
    await markFailed(
      job.id,
      error instanceof Error ? error.name : "resend-request-failed",
    );
    return "queued";
  }
}

export async function retryEligibleEmailJobs(limit = 20) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { processed: 0, sent: 0 };
  const result = await supabase.rpc("claim_email_jobs", { p_limit: limit });
  if (result.error) {
    console.error("email_job_claim_failed", { code: result.error.code });
    return { processed: 0, sent: 0 };
  }

  const jobs = (result.data ?? []) as Array<{ id: string }>;
  let sent = 0;
  for (const job of jobs) {
    if ((await deliverEmailJob(job.id)) === "sent") sent += 1;
  }
  return { processed: jobs.length, sent };
}

export function verifyResendWebhook(params: {
  payload: string;
  id: string;
  timestamp: string;
  signature: string;
}) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) throw new Error("resend-webhook-not-configured");
  return new Resend(process.env.RESEND_API_KEY).webhooks.verify({
    payload: params.payload,
    headers: {
      id: params.id,
      timestamp: params.timestamp,
      signature: params.signature,
    },
    webhookSecret: secret,
  });
}
