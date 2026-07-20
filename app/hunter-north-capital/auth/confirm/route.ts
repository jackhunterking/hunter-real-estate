import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  advisoryPublicPath,
  safeAdvisoryNext,
} from "@/lib/capital/advisory-domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function requestHostname(request: NextRequest) {
  return (request.headers.get("host") ?? request.nextUrl.hostname).split(":")[0];
}

export async function GET(request: NextRequest) {
  const hostname = requestHostname(request);
  const client = await createSupabaseServerClient();
  const destination = request.nextUrl.clone();
  if (!client) {
    destination.pathname = advisoryPublicPath(hostname, "/sign-in");
    destination.searchParams.set("error", "supabase-not-configured");
    return NextResponse.redirect(destination);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeAdvisoryNext(hostname, request.nextUrl.searchParams.get("next"));
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

  destination.pathname = error ? advisoryPublicPath(hostname, "/sign-in") : next;
  destination.search = "";
  if (error) destination.searchParams.set("error", "confirmation-failed");
  return NextResponse.redirect(destination);
}
