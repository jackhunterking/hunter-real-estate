// Intercom Messenger configuration shared by the browser widget
// (components/intercom/IntercomMessenger.tsx) and the server identity endpoint
// (app/api/intercom/identity/route.ts).
//
// The workspace ("app") id is public by design — every Messenger install ships
// it to the browser — so it is hardcoded as a fallback the same way the PostHog
// project key is in app/providers.tsx. Override per environment with
// NEXT_PUBLIC_INTERCOM_APP_ID. The Messenger *secret* that signs identity JWTs
// is server-only and deliberately absent from this file; see
// lib/intercom/identity-server.ts.

export type IntercomRegion = "us" | "eu" | "ap";

export const INTERCOM_APP_ID =
  process.env.NEXT_PUBLIC_INTERCOM_APP_ID?.trim() || "hknj0uly";

export const INTERCOM_REGION: IntercomRegion =
  process.env.NEXT_PUBLIC_INTERCOM_REGION === "eu"
    ? "eu"
    : process.env.NEXT_PUBLIC_INTERCOM_REGION === "ap"
      ? "ap"
      : "us";

// Region-matched Messenger API host. The SDK's initialiser derives this from
// `region`, but `boot()` takes raw settings, so the value is pinned here for
// the re-boots that follow sign-in and sign-out.
const REGION_API_BASE: Record<IntercomRegion, string> = {
  us: "https://api-iam.intercom.io",
  eu: "https://api-iam.eu.intercom.io",
  ap: "https://api-iam.au.intercom.io",
};

export const INTERCOM_API_BASE = REGION_API_BASE[INTERCOM_REGION];

/**
 * How long Intercom's own messenger session cookie survives, in milliseconds.
 *
 * Intercom defaults to 7 days. This is an investor portal, so it is tightened
 * to 24h: sign-out already tears the session down, but this bounds the window
 * where a closed tab on a shared machine could still reopen the conversation.
 */
export const INTERCOM_SESSION_DURATION_MS = 86_400_000;

// Escape hatch for local work that should not create visitors in the live
// workspace. Unset (the default) means the messenger runs everywhere.
export const INTERCOM_ENABLED =
  Boolean(INTERCOM_APP_ID) && process.env.NEXT_PUBLIC_INTERCOM_DISABLED !== "true";

/**
 * Settings for an explicit `boot()` call. `extra` carries the signed
 * `intercom_user_jwt` when there is a session — and nothing else: identifying
 * attributes belong inside the token, because anything passed beside it can be
 * edited from the browser console.
 */
export type IntercomBootSettings = {
  app_id: string;
  api_base: string;
  session_duration: number;
} & Record<string, unknown>;

export function intercomBootSettings(
  extra?: Record<string, unknown>,
): IntercomBootSettings {
  return {
    app_id: INTERCOM_APP_ID,
    api_base: INTERCOM_API_BASE,
    session_duration: INTERCOM_SESSION_DURATION_MS,
    ...extra,
  };
}

export type IntercomIdentityResponse =
  | { authenticated: false }
  | { authenticated: true; userId: string; intercom_user_jwt: string };
