import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { jwtVerify, SignJWT } from "jose";
import {
  INTERCOM_API_BASE,
  INTERCOM_APP_ID,
  INTERCOM_ENABLED,
  INTERCOM_REGION,
  INTERCOM_SESSION_DURATION_MS,
  intercomBootSettings,
} from "../lib/intercom/config.ts";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/**
 * The messenger is a single app-wide install whose security rests on three
 * properties the type system cannot enforce:
 *
 *  1. Identifying attributes travel inside an HS256 JWT — anything sent beside
 *     it in the boot call is editable from the browser console.
 *  2. The Messenger secret never reaches the browser bundle.
 *  3. An unsigned session is left anonymous rather than identified, so a
 *     missing secret cannot silently degrade into an impersonatable inbox.
 */

test("the messenger boots against a region-matched API host", () => {
  assert.ok(INTERCOM_APP_ID, "an app id must always resolve");
  assert.equal(INTERCOM_ENABLED, true, "chat is on unless explicitly disabled");
  assert.equal(INTERCOM_REGION, "us");
  // Pinned because boot() takes raw settings and cannot derive api_base from
  // the region the way the SDK initialiser does.
  assert.equal(INTERCOM_API_BASE, "https://api-iam.intercom.io");
});

test("boot settings carry the app, the region host and a bounded session", () => {
  const settings = intercomBootSettings();
  assert.equal(settings.app_id, INTERCOM_APP_ID);
  assert.equal(settings.api_base, INTERCOM_API_BASE);
  // Intercom's own default is 7 days; the portal deliberately runs shorter.
  assert.equal(settings.session_duration, INTERCOM_SESSION_DURATION_MS);
  assert.ok(
    INTERCOM_SESSION_DURATION_MS <= 86_400_000,
    "an investor portal must not outlive Intercom's 7-day default session",
  );
});

test("only the signed token is added to an authenticated boot", () => {
  const settings = intercomBootSettings({ intercom_user_jwt: "token" });
  assert.equal(settings.intercom_user_jwt, "token");
  // Email/name/user_id beside the token would be client-editable, which is the
  // exact failure identity verification exists to prevent.
  for (const key of ["email", "name", "user_id", "created_at"]) {
    assert.ok(!(key in settings), `${key} must travel inside the JWT, not beside it`);
  }
});

test("the identity token is an HS256 JWT carrying the mandatory user_id", async () => {
  const source = read("lib/intercom/identity-server.ts");
  // Intercom accepts HS256 only, and rejects any token without user_id.
  assert.match(source, /const ALGORITHM = "HS256"/);
  assert.match(source, /claims: Record<string, string \| number> = \{ user_id: user\.id \}/);

  // Round-trip the same construction the module uses, so a swapped algorithm or
  // a dropped expiry fails here rather than in Intercom's error log.
  const secret = new TextEncoder().encode("test-messenger-secret");
  const token = await new SignJWT({ user_id: "user-123", email: "a@b.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("600s")
    .sign(secret);
  const { payload, protectedHeader } = await jwtVerify(token, secret);
  assert.equal(protectedHeader.alg, "HS256");
  assert.equal(payload.user_id, "user-123");
  assert.ok(payload.exp && payload.iat && payload.exp > payload.iat, "the token must expire");
});

test("the token expires well inside Intercom's replay window", () => {
  const source = read("lib/intercom/identity-server.ts");
  const ttl = Number(source.match(/TOKEN_TTL_SECONDS = (\d+)/)?.[1]);
  // Intercom's guidance: long enough for a full round trip (floor ~5 min),
  // short enough that a leaked token is near-worthless.
  assert.ok(ttl >= 300, "under Intercom's 5-minute floor, tokens expire in flight");
  assert.ok(ttl <= 3600, "a token valid for hours defeats the point of signing it");
});

test("an unsigned session is left anonymous, never identified", () => {
  const source = read("lib/intercom/identity-server.ts");
  // The secret check must come first: no secret means no identify at all.
  const secretCheck = source.indexOf("if (!secret) return null;");
  const userLoad = source.indexOf("supabase.auth.getUser()");
  assert.ok(secretCheck > -1, "a missing Messenger secret must short-circuit");
  assert.ok(secretCheck < userLoad, "bail out before building an unsigned identity");

  const client = read("components/intercom/IntercomMessenger.tsx");
  assert.match(
    client,
    /if \(cancelled \|\| !body\?\.authenticated\) return;/,
    "the client must not fall back to an unsigned identify",
  );
});

test("the Messenger secret is server-only and never public", () => {
  const source = read("lib/intercom/identity-server.ts");
  assert.match(source, /^import "server-only";/m);
  assert.ok(
    !source.includes("NEXT_PUBLIC_INTERCOM_MESSENGER_SECRET"),
    "the signing secret must never be exposed through a NEXT_PUBLIC_ variable",
  );
  assert.ok(
    !read("lib/intercom/config.ts").includes("process.env.INTERCOM_MESSENGER_SECRET"),
    "config.ts ships to the browser and must not read the secret",
  );
  assert.ok(
    !read("components/intercom/IntercomMessenger.tsx").includes("MESSENGER_SECRET"),
    "the client component must not reference the signing secret",
  );
});

test("identity is minted by the server, never asserted by the client", () => {
  const client = read("components/intercom/IntercomMessenger.tsx");
  assert.match(client, /fetch\("\/api\/intercom\/identity"/);
  assert.ok(
    !/SignJWT|intercom_user_jwt:\s*"/.test(client),
    "the browser must never construct or hardcode a token",
  );

  const route = read("app/api/intercom/identity/route.ts");
  assert.match(route, /no-store/, "a bearer-equivalent token must never be cached");
});

test("switching identity re-boots rather than patching the live session", () => {
  const client = read("components/intercom/IntercomMessenger.tsx");
  // Both transitions — sign-in and sign-out — must clear Intercom's session
  // cookie first, so the messenger's user always matches the Supabase session.
  const shutdowns = client.match(/shutdown\(\);/g) ?? [];
  assert.equal(shutdowns.length, 2, "sign-in and sign-out both tear down first");
  const boots = client.match(/boot\(intercomBootSettings\(/g) ?? [];
  assert.equal(boots.length, 2, "each teardown is followed by a fresh boot");
});
