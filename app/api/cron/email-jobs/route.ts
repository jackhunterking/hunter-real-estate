import { NextRequest, NextResponse } from "next/server";
import { retryEligibleEmailJobs } from "@/lib/email";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await retryEligibleEmailJobs(20);
  return NextResponse.json({ ok: true, ...result });
}
