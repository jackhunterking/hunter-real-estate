/**
 * Seed portal content into Supabase — the single source of truth.
 *
 * Reads the committed offering bundles under supabase/seed/offerings/*.json and
 * imports each through the `api.seed_offering` RPC, which upserts the normalized
 * working rows (manager / properties / offering) and publishes a composed
 * snapshot via `api.publish_offering`. The RPC is the same path a future admin
 * panel uses, so seeding and admin publishing never diverge.
 *
 * Taxonomies are seeded by their migration (supabase/migrations/*_taxonomies.sql);
 * this script only handles offering content.
 *
 * Run:  node --env-file=.env.local scripts/seed-content.ts
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_WEB_SECRET_KEY (service role),
 * plus NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the closing verification read.
 * Idempotent — safe to re-run.
 */
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_WEB_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_WEB_SECRET_KEY. Run with --env-file=.env.local");
  process.exit(1);
}

const clientOptions = {
  // Only the `api` schema is exposed to the data API (pgrst.db_schemas = 'api').
  db: { schema: "api" as const },
  auth: { persistSession: false, autoRefreshToken: false },
};

const supabase = createClient(url, serviceKey, clientOptions);

// The closing count is read as anon, not with the service key. api.published_offerings
// was granted to anon/authenticated only, so the service key got 42501 here until
// 20260724110000 added the missing service_role grant. Reading as anon keeps this
// working against a database that predates that migration, and makes the count a
// true check of what the public site can actually see rather than what a
// privileged, RLS-bypassing role can.
const publicClient = publishableKey ? createClient(url, publishableKey, clientOptions) : null;

const seedDir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "seed", "offerings");

async function main() {
  const files = readdirSync(seedDir).filter((name) => name.endsWith(".json")).sort();
  if (!files.length) {
    console.error(`No offering bundles found in ${seedDir}`);
    process.exit(1);
  }

  let failed = 0;
  for (const file of files) {
    const bundle = JSON.parse(readFileSync(join(seedDir, file), "utf8"));
    const { data, error } = await supabase.rpc("seed_offering", { p_bundle: bundle, p_actor: null });
    if (error) {
      failed += 1;
      console.error(`✗ ${file}: ${error.message}`);
    } else {
      console.log(`✓ ${bundle.slug} → offering ${data}`);
    }
  }

  const countFailed = await reportPublishedCount();
  if (failed || countFailed) process.exit(1);
}

/** Print how many offerings are publicly live. Returns true if the check failed. */
async function reportPublishedCount(): Promise<boolean> {
  if (!publicClient) {
    console.error("\n✗ Cannot verify published offerings: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.");
    return true;
  }

  // Not a `head: true` count: a HEAD response carries no body, so PostgREST's
  // error detail (`42501 permission denied for view ...`) would be lost and the
  // failure would be as opaque as the "unknown" this replaced.
  const { count, error, status } = await publicClient
    .from("published_offerings")
    .select("slug", { count: "exact" });
  if (error) {
    const detail = [error.code, error.message].filter(Boolean).join(" ") || `HTTP ${status}`;
    console.error(`\n✗ Could not count published offerings: ${detail}`);
    return true;
  }

  console.log(`\nPublished offerings now live: ${count ?? 0}`);
  return false;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
