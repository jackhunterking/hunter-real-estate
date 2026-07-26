import { SignJWT } from "jose";

/**
 * The signing half of Intercom Messenger identity verification, kept free of
 * Supabase and of `server-only` so the same code can be exercised from a script
 * (scripts/intercom-test-token.ts) and from tests. It never reads the secret
 * itself — the caller supplies it, and the only caller that reads it from the
 * environment is identity-server.ts, which *is* server-only. That is what keeps
 * a browser bundle from ever pulling the secret in through this module.
 */

// Intercom only accepts HS256 for Messenger JWTs.
export const ALGORITHM = "HS256";

/**
 * The token authenticates a single boot call — Intercom then issues its own
 * session cookie (7 days by default, tightened via `session_duration`), so the
 * JWT never needs to outlive the request that carries it. Intercom's floor is
 * ~5 minutes; 10 leaves room for a slow round trip without widening the replay
 * window meaningfully.
 */
export const TOKEN_TTL_SECONDS = 600;

export type IntercomClaims = {
  /** Mandatory — Intercom rejects a token without it. */
  user_id: string;
  email?: string;
  name?: string;
  /** Unix seconds, the format Intercom expects. */
  created_at?: number;
};

/**
 * Sign the claims that identify a user to Intercom. Every identifying attribute
 * travels *inside* the signature: anything sent alongside the token in the boot
 * call is client-editable, which is the exact failure identity verification
 * exists to prevent.
 */
export async function signIntercomIdentity(claims: IntercomClaims, secret: string) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));
}
