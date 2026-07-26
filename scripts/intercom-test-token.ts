/**
 * Mint one Intercom identity JWT for pasting into Intercom's own JWT decoder
 * (Settings → Channels → Messenger → Security → "Check your token").
 *
 * It signs with the SAME function the portal uses in production
 * (lib/intercom/sign-identity.ts), so a green decoder here means the real
 * `/api/intercom/identity` response will verify too — a lookalike script could
 * drift from the route and report a false pass.
 *
 * The claims are sample values, not a real account: the point is to prove the
 * signature and the claim shape, and a throwaway id keeps a real user's id out
 * of a token that gets pasted into a web form.
 *
 * USAGE:
 *   node --env-file=.env.local scripts/intercom-test-token.ts
 *
 * The token is bearer-equivalent for the user it names and lives 10 minutes.
 * Paste it only into Intercom's own decoder — never a third-party JWT site,
 * which would also be handed enough to verify against your secret.
 */

import { ALGORITHM, TOKEN_TTL_SECONDS, signIntercomIdentity } from "../lib/intercom/sign-identity.ts";

const secret = process.env.INTERCOM_MESSENGER_SECRET?.trim();

if (!secret) {
  console.error(
    "INTERCOM_MESSENGER_SECRET is not set.\n" +
      "Add it to .env.local (Intercom → Settings → Channels → Messenger →\n" +
      "Security → Unified Secret), then re-run with --env-file=.env.local.",
  );
  process.exit(1);
}

const claims = {
  user_id: "decoder-check-user",
  email: "decoder-check@example.com",
  name: "Decoder Check",
  created_at: 1_700_000_000,
};

const token = await signIntercomIdentity(claims, secret);

console.log(`\nalg ${ALGORITHM}  ·  ttl ${TOKEN_TTL_SECONDS}s  ·  claims ${Object.keys(claims).join(", ")}`);
console.log("\nPaste this into Intercom's decoder:\n");
console.log(token);
console.log("\nExpect: a valid signature, and user_id = decoder-check-user.\n");
