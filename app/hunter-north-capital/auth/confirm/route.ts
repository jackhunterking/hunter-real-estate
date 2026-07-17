import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith(NORTH_BASE) || value.startsWith("//")) {
    return `${NORTH_BASE}/onboarding`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const client = await createSupabaseServerClient();
  const destination = request.nextUrl.clone();
  if (!client) {
    destination.pathname = `${NORTH_BASE}/sign-in`;
    destination.searchParams.set("error", "supabase-not-configured");
    return NextResponse.redirect(destination);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  let error: Error | null = null;

  if (tokenHash && type) {
    const result = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    error = result.error;
  } else if (code) {
    const result = await client.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error("Missing confirmation token");
  }

  destination.pathname = error ? `${NORTH_BASE}/sign-in` : next;
  destination.search = "";
  if (error) destination.searchParams.set("error", "confirmation-failed");
  return NextResponse.redirect(destination);
}
