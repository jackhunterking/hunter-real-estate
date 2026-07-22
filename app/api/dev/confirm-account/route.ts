import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Dev-only helper: instantly confirms a just-created account so the local
// sign-up → confirm → sign-in loop works without Docker or clicking the
// production confirmation link. Hard-disabled in production, and inert unless
// SUPABASE_WEB_SECRET_KEY is present in the local environment.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Add SUPABASE_WEB_SECRET_KEY to .env.local to use the local dev confirm helper.",
      },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  // generateLink returns the user record (including id) without sending an email.
  const linkResult = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const userId = linkResult.data?.user?.id;
  if (linkResult.error || !userId) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const confirmResult = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (confirmResult.error) {
    return NextResponse.json({ error: "confirm_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
