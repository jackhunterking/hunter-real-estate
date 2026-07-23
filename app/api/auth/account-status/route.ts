import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Reports whether an email has an account, and if so whether it is verified,
// so the sign-in screen can tell the user "no account — create one" instead of
// the generic "email or password is incorrect".
//
// NOTE: this deliberately reveals account existence (email enumeration), which
// Supabase's own errors hide by design. It is enabled because the product wants
// clearer sign-in guidance. Add rate limiting before relying on it at scale.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ status: "unknown" });
  }

  const admin = createSupabaseAdminClient();
  // Without the service key we cannot look users up; fall back to the generic
  // message rather than guessing.
  if (!admin) {
    return NextResponse.json({ status: "unknown" });
  }

  // Read-only lookup via a SECURITY DEFINER function restricted to service_role.
  // Returns 'none' | 'unverified' | 'active'. It never creates or mutates users.
  // Cast the client because this function is not yet in the generated database
  // types. Call rpc as a method so its `this` binding is preserved.
  const typedAdmin = admin as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };
  const { data, error } = await typedAdmin.rpc("account_status", { p_email: email });
  if (error || typeof data !== "string") {
    return NextResponse.json({ status: "unknown" });
  }
  return NextResponse.json({ status: data });
}
