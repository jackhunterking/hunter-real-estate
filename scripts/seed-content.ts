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
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_WEB_SECRET_KEY (service role).
 * Idempotent — safe to re-run.
 */
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_WEB_SECRET_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_WEB_SECRET_KEY. Run with --env-file=.env.local");
  process.exit(1);
}

// Only the `api` schema is exposed to the data API (pgrst.db_schemas = 'api').
const supabase = createClient(url, serviceKey, {
  db: { schema: "api" },
  auth: { persistSession: false, autoRefreshToken: false },
});

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

  const { count } = await supabase.from("published_offerings").select("*", { count: "exact", head: true });
  console.log(`\nPublished offerings now live: ${count ?? "unknown"}`);
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
