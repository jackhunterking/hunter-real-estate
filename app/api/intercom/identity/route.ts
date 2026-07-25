import { NextResponse } from "next/server";
import { loadIntercomIdentity } from "@/lib/intercom/identity-server";
import { INTERCOM_ENABLED } from "@/lib/intercom/config";

// Mints the short-lived Intercom identity JWT for the current Supabase session.
// The messenger boots anonymously first and only calls this once a session
// exists, so anonymous marketing traffic never reaches it.
export const dynamic = "force-dynamic";

const NO_STORE = {
  // Carries a bearer-equivalent token for the user's Intercom session — never
  // cacheable, by a CDN or by the browser.
  "cache-control": "no-store, private",
} as const;

const ANONYMOUS = { authenticated: false } as const;

export async function GET() {
  if (!INTERCOM_ENABLED) {
    return NextResponse.json(ANONYMOUS, { headers: NO_STORE });
  }

  // A Supabase read or a signing failure should leave the messenger anonymous,
  // not 500 the widget.
  const identity = await loadIntercomIdentity().catch(() => null);
  if (!identity) {
    return NextResponse.json(ANONYMOUS, { headers: NO_STORE });
  }

  return NextResponse.json(
    {
      authenticated: true,
      userId: identity.userId,
      intercom_user_jwt: identity.intercom_user_jwt,
    },
    { headers: NO_STORE },
  );
}
