import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PortalRpcName = keyof Database["api"]["Functions"];
type PortalRpcArgs<Name extends PortalRpcName> =
  Database["api"]["Functions"][Name]["Args"];

export async function portalRpc<Name extends PortalRpcName>(
  name: Name,
  args: PortalRpcArgs<Name>,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  const claims = await supabase.auth.getClaims();
  if (!claims.data?.claims?.sub) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  const result = await supabase.rpc(name, args);
  if (result.error) return NextResponse.json({ error: "The requested update was not permitted." }, { status: 403 });
  return NextResponse.json({ data: result.data }, { headers: { "Cache-Control": "private, no-store" } });
}
