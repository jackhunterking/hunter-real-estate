import { NextResponse } from "next/server";
import { INVESTMENT_BASE_PATH as NORTH_BASE } from "@/lib/capital/investment-brand";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const client = await createSupabaseServerClient();
  if (client) await client.auth.signOut();
  return NextResponse.redirect(new URL(`${NORTH_BASE}/sign-in`, request.url), 303);
}
