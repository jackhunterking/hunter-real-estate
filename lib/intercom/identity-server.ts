import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type IntercomClaims, signIntercomIdentity } from "./sign-identity";

/**
 * Intercom Messenger security, JWT flavour (the workspace's Security tab shows
 * "Secure for web" — the older `user_hash` HMAC is not what this workspace
 * expects).
 *
 * The JWT is signed with the workspace's Messenger API secret and handed to the
 * browser as `intercom_user_jwt`. This module owns the *session* half — reading
 * the secret and establishing who the caller actually is; the signing itself
 * lives in ./sign-identity.
 */

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
  const claims: IntercomClaims = { user_id: user.id };
  const email = profile?.email ?? user.email;
  if (email) claims.email = email;
  if (name) claims.name = name;
  // Unix seconds, the format Intercom expects for created_at.
  if (!Number.isNaN(createdAt)) claims.created_at = Math.floor(createdAt / 1000);

  const intercom_user_jwt = await signIntercomIdentity(claims, secret);

  return { userId: user.id, intercom_user_jwt };
}
