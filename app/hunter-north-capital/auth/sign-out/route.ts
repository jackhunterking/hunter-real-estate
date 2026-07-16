import { NextResponse } from "next/server";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const client = await createSupabaseServerClient();
  if (client) await client.auth.signOut();
  return NextResponse.redirect(new URL(`${NORTH_BASE}/sign-in`, request.url), 303);
}
