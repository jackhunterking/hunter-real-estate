/**
 * Fallback imagery for buildings that Street View cannot see (e.g. on an
 * undeveloped highway edge): pull the building's Google **business-listing
 * photo** via the Places API (New), cache it in Supabase, and record it on
 * `media.card`. Same key-independence model as Street View — the key is only
 * needed here, at pull time; display needs no key.
 *
 * Reads scripts/place-queries.json: { "<property-id>": "<search text>" }.
 *
 * USAGE (via node --env-file=.env.local):
 *   ... scripts/pull-place-photo.ts --local /tmp/place-review   # pull to disk for review (no upload/seed edit)
 *   ... scripts/pull-place-photo.ts                             # pull → upload → update seed
 *
 * NEEDS: a key that can call "Places API (New)" — GOOGLE_PLACES_API_KEY if set,
 * else GOOGLE_MAPS_API_KEY (add "Places API (New)" to that key's API
 * restrictions). Plus NEXT_PUBLIC_SUPABASE_URL + SUPABASE_WEB_SECRET_KEY to upload.
 *
 * NOTE ON ATTRIBUTION: Places photos carry `authorAttributions` which Google
 * requires you to display. This script prints them for each photo so you can
 * confirm the credit before it ships. (Street View bakes "© Google" into the
 * image; Places photos do not.)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED = join(repoRoot, "supabase", "seed", "offerings", "legacy-epiphany.json");
const QUERIES = join(repoRoot, "scripts", "place-queries.json");
const BUCKET = "offering-public";

const args = process.argv.slice(2);
const localIdx = args.indexOf("--local");
const localDir = localIdx >= 0 ? args[localIdx + 1] : null;

const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_WEB_SECRET_KEY;
if (!key) { console.error("Need GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY (with Places API New enabled)."); process.exit(1); }

const txt = (v: unknown): string => (typeof v === "string" ? v : ((v as { en?: string } | undefined)?.en ?? ""));

async function searchPlace(query: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key!,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.photos",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`searchText ${res.status}: ${j.error?.message ?? JSON.stringify(j)}`);
  return j.places?.[0];
}

async function photoBytes(photoName: string): Promise<Buffer> {
  // skipHttpRedirect=true → JSON with photoUri; simpler to fetch media directly.
  const res = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${key}`);
  if (!res.ok) throw new Error(`photo media ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const queries: Record<string, string> = JSON.parse(readFileSync(QUERIES, "utf8"));
  const seed = JSON.parse(readFileSync(SEED, "utf8"));
  const supabase = localDir ? null
    : (url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
      : (console.error("Need Supabase creds to upload."), process.exit(1)));
  if (localDir) mkdirSync(localDir, { recursive: true });
  let changed = false;

  for (const [id, query] of Object.entries(queries)) {
    const prop = seed.properties.find((p: { id: string }) => p.id === id);
    if (!prop) { console.log(`  ? ${id}: not in seed`); continue; }
    const place = await searchPlace(query);
    if (!place) { console.log(`  ○ ${id}: no place found for "${query}"`); continue; }
    const photo = place.photos?.[0];
    const credit = (photo?.authorAttributions ?? []).map((a: { displayName?: string }) => a.displayName).filter(Boolean).join(", ");
    console.log(`  → ${id}: "${place.displayName?.text}" — ${place.formattedAddress} | photos: ${place.photos?.length ?? 0}${credit ? ` | credit: ${credit}` : ""}`);
    if (!photo) { console.log(`     (no photo on this listing)`); continue; }
    const buf = await photoBytes(photo.name);

    if (localDir) {
      writeFileSync(join(localDir, `${id}.jpg`), buf);
      console.log(`     saved ${(buf.length / 1024) | 0} KB`);
    } else {
      const objectPath = `legacy-epiphany/media/place/${id}.jpg`;
      const { error } = await supabase!.storage.from(BUCKET).upload(objectPath, buf, { contentType: "image/jpeg", upsert: true });
      if (error) { console.error(`     upload failed: ${error.message}`); continue; }
      prop.media = prop.media ?? {};
      prop.media.card = {
        bucket: BUCKET, path: objectPath, kind: "photo", sourceId: "google-place-photo",
        alt: { en: `${txt(prop.name)} — building photo`, tr: `${txt(prop.name)} — bina fotoğrafı` },
        credit: credit || undefined,
      };
      changed = true;
      console.log(`     → ${objectPath}`);
    }
  }
  if (changed) writeFileSync(SEED, JSON.stringify(seed, null, 2) + "\n");
  console.log(localDir ? "Review the saved photos, then run without --local to upload." : "Done. Re-seed to publish (node --env-file=.env.local scripts/seed-content.ts).");
}

main().catch((e) => { console.error(e); process.exit(1); });
