import { NextResponse } from "next/server";
import { advisoryPublicPath } from "@/lib/capital/advisory-domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const client = await createSupabaseServerClient();
  if (client) await client.auth.signOut();
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host") ?? requestUrl.hostname;
  return NextResponse.redirect(
    new URL(advisoryPublicPath(host, "/sign-in"), requestUrl),
    303,
  );
}
