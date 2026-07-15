import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOfferings } from "@/lib/capital/repository";
import { classifyOntario, preliminaryOmLimit, READINESS_RULESET } from "@/lib/capital/readiness";
import { upsertCapitalInvestor } from "@/lib/hubspot";
import { sendCapitalIntakeNotification } from "@/lib/email";

const Body = z.object({
  offeringId:z.string().min(1), shareClassId:z.string().optional(), jurisdiction:z.enum(["ontario","turkey-cross-border"]),
  firstName:z.string().min(1),lastName:z.string().min(1),email:z.string().email(),phone:z.string().optional(),city:z.string().min(1),
  objective:z.string().min(1),horizon:z.string().min(1),riskTolerance:z.string().min(1),lossCapacity:z.string().min(1),liquidityNeed:z.string().min(1),experience:z.string().min(1),intendedAmount:z.string().min(1),accountPreference:z.string().min(1),
  qualificationCriteria:z.array(z.enum(["ai-financial-assets","ai-income-individual","ai-income-with-spouse","ai-net-assets","eligible-net-assets","eligible-income-individual","eligible-income-with-spouse"])),priorOmAmount:z.coerce.number().nonnegative(),registeredAdviceForHigherOmLimit:z.boolean(),
  contactConsent:z.literal(true),accuracyConsent:z.literal(true),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile" }, { status:400 });
  const input = parsed.data; const offering = getOfferings().find((item) => item.id === input.offeringId);
  if (!offering || (input.shareClassId && !offering.shareClassIds.includes(input.shareClassId))) return NextResponse.json({ error:"Unknown offering or share class" }, { status:400 });
  const preliminaryCategory = input.jurisdiction === "ontario" ? classifyOntario(input) : "manual-review";
  const preliminaryInvestmentLimit = preliminaryOmLimit(preliminaryCategory,input.registeredAdviceForHigherOmLimit);
  const warnings = input.jurisdiction === "ontario" ? ["Preliminary only. The dealer and issuer must verify the investor category and exemption used.",preliminaryInvestmentLimit ? `The preliminary individual OM limit is $${preliminaryInvestmentLimit.toLocaleString("en-CA")} across the preceding 12 months; $${input.priorOmAmount.toLocaleString("en-CA")} was reported before this proposed investment.` : "No individual OM limit is indicated by this preliminary accredited-investor classification.","Suitability review may result in a lower permitted investment amount.",`Ruleset: ${READINESS_RULESET.id}`] : ["Cross-border legal, tax, AML, source-of-funds, and product-permission review is required.","No eligibility determination has been made."];
  const qualificationSummary = input.qualificationCriteria.length ? input.qualificationCriteria.join(", ") : "none recorded";
  const hubspot = await upsertCapitalInvestor({ firstName:input.firstName,lastName:input.lastName,email:input.email,phone:input.phone,city:input.city,country:input.jurisdiction === "ontario" ? "Canada" : "Turkey",meetingPreference:input.jurisdiction === "ontario" ? "Toronto" : "Istanbul",preferredLanguage:"Both",investableRange:input.intendedAmount,timeline:input.horizon,objective:input.objective,riskComfort:input.riskTolerance,investorStatus:preliminaryCategory,interestedProducts:[offering.shortName.en],message:`Readiness profile · ${input.experience} · liquidity ${input.liquidityNeed} · account ${input.accountPreference} · criteria ${qualificationSummary}` });
  const notification = await sendCapitalIntakeNotification({ firstName:input.firstName,lastName:input.lastName,email:input.email,phone:input.phone,city:input.city,country:input.jurisdiction === "ontario" ? "Canada" : "Turkey",meetingPreference:input.jurisdiction === "ontario" ? "Toronto" : "Istanbul",preferredLanguage:"Both",investableRange:input.intendedAmount,timeline:input.horizon,objective:input.objective,riskComfort:input.riskTolerance,investorStatus:preliminaryCategory,interestedProducts:[offering.shortName.en],message:`Readiness ruleset ${READINESS_RULESET.id}; prior OM amount ${input.priorOmAmount}; registered advice ${input.registeredAdviceForHigherOmLimit}; criteria ${qualificationSummary}` });
  return NextResponse.json({ submissionId:randomUUID(),offeringId:input.offeringId,shareClassId:input.shareClassId || undefined,jurisdictionPath:input.jurisdiction,preliminaryCategory,preliminaryInvestmentLimit,omInvestmentsLast12Months:input.priorOmAmount,qualificationCriteria:input.qualificationCriteria,nextStep:"licensed-review",warnings,captured:hubspot.ok,notified:notification.ok });
}
