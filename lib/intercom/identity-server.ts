import "server-only";

import { SignJWT } from "jose";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Intercom Messenger security, JWT flavour (the workspace's Security tab shows
 * "Secure for web" — the older `user_hash` HMAC is not what this workspace
 * expects).
 *
 * The JWT is signed with the workspace's Messenger API secret and handed to the
 * browser as `intercom_user_jwt`. Every identifying attribute travels *inside*
 * the signature: anything sent alongside it in the boot call is client-editable,
 * which is exactly what identity verification exists to prevent.
 */

// Intercom only accepts HS256 for Messenger JWTs.
const ALGORITHM = "HS256";

/**
 * The token authenticates a single boot call — Intercom then issues its own
 * session cookie (7 days by default, tightened via `session_duration`), so the
 * JWT never needs to outlive the request that carries it. Intercom's floor is
 * ~5 minutes; 10 leaves room for a slow round trip without widening the replay
 * window meaningfully.
 */
const TOKEN_TTL_SECONDS = 600;

export type IntercomIdentity = {
  /**
   * Local dedupe key only — it tells the browser whether the messenger is
   * already showing this user. Intercom itself reads the id from the JWT.
   */
  userId: string;
  intercom_user_jwt: string;
};

/**
 * Build a signed Intercom identity for the caller's Supabase session.
 *
 * Returns null for anonymous callers *and* when the Messenger secret is not
 * configured. The unconfigured case deliberately leaves the visitor anonymous
 * rather than identifying them unsigned: an unsigned identify on a portal that
 * discusses account holdings is impersonatable from the browser console.
 */
export async function loadIntercomIdentity(): Promise<IntercomIdentity | null> {
  const secret = process.env.INTERCOM_MESSENGER_SECRET?.trim();
  if (!secret) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // getUser() revalidates the token with Supabase rather than trusting the
  // cookie, which is what makes the claims safe to sign.
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) return null;

  // Display name and preferred locale live on the portal profile. RLS scopes
  // the read to the caller; the explicit filter is belt-and-braces. A missing
  // profile (account created, onboarding unfinished) is not an error — the
  // token still carries the id and email.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,first_name,last_name,email,locale")
    .eq("user_id", user.id)
    .maybeSingle();

  const name =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    undefined;

  const createdAt = user.created_at ? Date.parse(user.created_at) : NaN;

  // `user_id` is mandatory — Intercom rejects a token without it.
  const claims: Record<string, string | number> = { user_id: user.id };
  const email = profile?.email ?? user.email;
  if (email) claims.email = email;
  if (name) claims.name = name;
  // Unix seconds, the format Intercom expects for created_at.
  if (!Number.isNaN(createdAt)) claims.created_at = Math.floor(createdAt / 1000);

  const intercom_user_jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));

  return { userId: user.id, intercom_user_jwt };
}
