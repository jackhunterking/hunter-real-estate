import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deliverEmailJob } from "@/lib/email";
import { persistPublicSubmission } from "@/lib/public-submissions";
import { verifyTurnstile } from "@/lib/security/turnstile";

const Body = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi girin"),
  guide: z.enum(["alici", "satici"]),
  source: z.string().trim().max(120).optional(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  language: z.enum(["tr", "en"]).default("tr"),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const challenge = await verifyTurnstile({
    token: parsed.data.turnstileToken,
    remoteIp: req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for"),
  });
  if (!challenge.ok) {
    return NextResponse.json(
      { ok: false, error: "Security verification failed. Please try again." },
      { status: 403 },
    );
  }

  try {
    const submission = await persistPublicSubmission("submit_guide_request", {
      email: parsed.data.email,
      guide: parsed.data.guide,
      source: parsed.data.source ?? "website-guide",
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      language: parsed.data.language,
      consent_purpose: "requested-guide-delivery",
      submitted_at: new Date().toISOString(),
    });
    const emailStatus = await deliverEmailJob(submission.email_job_id);
    return NextResponse.json({
      ok: true,
      submissionId: submission.submission_id,
      emailStatus,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Your request could not be saved. Please try again.",
      },
      { status: 503 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "lead-capture" });
}
