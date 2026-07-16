import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deliverEmailJob } from "@/lib/email";
import { persistPublicSubmission } from "@/lib/public-submissions";
import { verifyTurnstile } from "@/lib/security/turnstile";

const meetingPreferences = ["Toronto", "Istanbul", "Remote"] as const;
const preferredLanguages = ["Turkish", "English", "Both"] as const;
const investableRanges = ["$25k-$100k", "$100k-$250k", "$250k-$500k", "$500k-$1M", "$1M+"] as const;
const timelines = ["Now", "1-3 months", "3-6 months", "6+ months"] as const;
const objectives = ["Income", "Growth", "Balanced", "Capital preservation"] as const;
const riskComforts = ["Conservative", "Moderate", "Growth-oriented", "Unsure"] as const;
const investorStatuses = ["Accredited investor", "Eligible investor", "Permitted client", "Unsure"] as const;
const productInterests = ["Legacy / Epiphany", "Lankin Apartment REIT", "Canadian multifamily generally", "Direct / JV opportunities"] as const;

const Body = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  meetingPreference: z.enum(meetingPreferences),
  preferredLanguage: z.enum(preferredLanguages),
  investableRange: z.enum(investableRanges),
  timeline: z.enum(timelines),
  objective: z.enum(objectives),
  riskComfort: z.enum(riskComforts),
  investorStatus: z.enum(investorStatuses),
  interestedProducts: z.array(z.enum(productInterests)).min(1),
  message: z.string().trim().max(3000).optional(),
  contactConsent: z.literal(true),
  documentConsent: z.literal(true),
  riskConsent: z.literal(true),
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

  const { turnstileToken: _turnstileToken, ...input } = parsed.data;
  void _turnstileToken;
  try {
    const submission = await persistPublicSubmission("submit_capital_intake", {
      ...input,
      submitted_at: new Date().toISOString(),
    });
    const notificationStatus = await deliverEmailJob(submission.email_job_id);
    return NextResponse.json({
      ok: true,
      submissionId: submission.submission_id,
      notificationStatus,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Your intake could not be saved. Please try again." },
      { status: 503 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "capital-intake" });
}
