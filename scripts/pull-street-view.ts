/**
 * One-time-per-building Google Street View pull → Supabase Storage.
 *
 * WHY. Building cards want a real image. We hold deck photos for a couple of
 * buildings; for the rest we fetch a single Street View of the exact address,
 * store it in the public `offering-public` bucket, and record a {bucket,path}
 * reference on the building's `media.card` in the seed JSON. After that the
 * image is a permanent public URL — the Google key is NEVER needed to display
 * it, only to pull it this once.
 *
 * KEY-ACCESS PLAN (works from any computer, key or no key):
 *  - Results are key-independent: pulled images live in Supabase and the
 *    {bucket,path} refs are committed to the seed. Any teammate/computer renders
 *    them with no key.
 *  - Add a new building on a machine WITHOUT the key → it simply has no
 *    `media.card`, so the portal shows the branded placeholder tile (no
 *    breakage). `--report` (no key needed) lists exactly which buildings are
 *    still awaiting a pull, so you know what's pending.
 *  - Later, on ANY machine that has the key, run this script: it is idempotent
 *    and only fills the buildings that are still missing an image.
 *  - Buildings where Street View is bad (blocked, wrong angle, or no coverage)
 *    are listed in scripts/street-view-skiplist.json and left on the clean
 *    placeholder tile on purpose.
 *
 * USAGE (always via node --env-file=.env.local so the key + Supabase creds load):
 *   ... scripts/pull-street-view.ts --report                 # what's missing (NO key needed)
 *   ... scripts/pull-street-view.ts --local /tmp/sv-review   # pull to disk for review (no upload, no seed edit)
 *   ... scripts/pull-street-view.ts                          # pull missing → upload → update seed
 *   ... scripts/pull-street-view.ts legacy-epiphany          # limit to one offering (filename prefix)
 *   ... scripts/pull-street-view.ts --force                  # re-pull even buildings that already have media.card
 *
 * NEEDS: GOOGLE_MAPS_API_KEY (pull); NEXT_PUBLIC_SUPABASE_URL + SUPABASE_WEB_SECRET_KEY (upload).
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = join(repoRoot, "supabase", "seed", "offerings");
const SKIPLIST = join(repoRoot, "scripts", "street-view-skiplist.json");
const BUCKET = "offering-public";
const SIZE = "640x480"; // 4:3 — matches the card aspect so object-cover keeps the Google watermark visible
const FOV = 78;

const args = process.argv.slice(2);
const report = args.includes("--report");
const force = args.includes("--force");
const localIdx = args.indexOf("--local");
const localDir = localIdx >= 0 ? args[localIdx + 1] : null;
const slugArg = args.find((a) => !a.startsWith("--") && a !== localDir);

const key = process.env.GOOGLE_MAPS_API_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_WEB_SECRET_KEY;

/** Ids we deliberately never pull (bad Street View → keep the placeholder tile). */
const skip: Set<string> = new Set(existsSync(SKIPLIST) ? JSON.parse(readFileSync(SKIPLIST, "utf8")) : []);

/**
 * Per-building camera overrides. The auto heading (pano → building) faces the
 * road when the pano sits on top of the address; a hand-picked `heading` (from
 * an 8-way sweep, see sv-sweep) aims the camera at the actual building. Optional
 * `pitch`/`fov` too. `{ "<property-id>": { "heading": 90 } }`.
 */
const OVERRIDES = join(repoRoot, "scripts", "street-view-overrides.json");
const overrides: Record<string, { heading?: number; pitch?: number; fov?: number; locLat?: number; locLng?: number }> =
  existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, "utf8")) : {};

const txt = (v: unknown): string => (typeof v === "string" ? v : ((v as { en?: string } | undefined)?.en ?? ""));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Bearing (0–360°) from the panorama point toward the building, so the camera faces it. */
function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const φ1 = r(lat1), φ2 = r(lat2), Δλ = r(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

async function metadata(lat: number, lng: number) {
  const u = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&source=outdoor&key=${key}`;
  return (await fetch(u)).json() as Promise<{ status: string; location?: { lat: number; lng: number }; date?: string }>;
}

async function image(lat: number, lng: number, heading: number, fov = FOV, pitch = 2): Promise<Buffer> {
  const u = `https://maps.googleapis.com/maps/api/streetview?size=${SIZE}&location=${lat},${lng}&fov=${fov}&heading=${heading.toFixed(1)}&pitch=${pitch}&source=outdoor&return_error_code=true&key=${key}`;
  const res = await fetch(u);
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

type Property = { id: string; name?: unknown; latitude: number; longitude: number; media?: { card?: { src?: string; bucket?: string; path?: string; kind?: string; sourceId?: string; alt?: { en?: string; tr?: string }; verifiedAt?: string } } };

function seedFiles(): string[] {
  return readdirSync(SEED_DIR).filter((f) => f.endsWith(".json") && (!slugArg || f.startsWith(slugArg)));
}

function hasImage(p: Property): boolean {
  return Boolean(p.media?.card?.src || (p.media?.card?.bucket && p.media?.card?.path));
}

async function main() {
  if (report && !key) {
    // Pure report needs no network; fall through to list missing.
  } else if (!key) {
    console.error("Missing GOOGLE_MAPS_API_KEY. Run via: node --env-file=.env.local scripts/pull-street-view.ts");
    process.exit(1);
  }
  const uploading = !report && !localDir;
  const supabase = uploading
    ? (url && serviceKey
        ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
        : (console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_WEB_SECRET_KEY for upload."), process.exit(1)))
    : null;
  if (localDir) mkdirSync(localDir, { recursive: true });

  for (const file of seedFiles()) {
    const path = join(SEED_DIR, file);
    const offering = JSON.parse(readFileSync(path, "utf8"));
    const slug: string = offering.slug ?? file.replace(/\.json$/, "");
    const props: Property[] = offering.properties ?? [];
    let pulled = 0, skipped = 0, none = 0, skiplisted = 0, missing = 0, changed = false;

    for (const p of props) {
      if (hasImage(p) && !force) { skipped++; continue; }
      if (skip.has(p.id)) { skiplisted++; continue; }
      missing++;
      if (report) { console.log(`  · needs pull: ${p.id}  (${txt(p.name)})`); continue; }

      const ov = overrides[p.id];
      // Shoot from an explicit pano point when given (for buildings the address
      // pano can't see — a frontage-road pano ~60m out), else from the address.
      // The building's own lat/lng still drives the map pin; only the camera moves.
      const shootLat = ov?.locLat ?? p.latitude;
      const shootLng = ov?.locLng ?? p.longitude;
      const meta = await metadata(shootLat, shootLng);
      if (meta.status !== "OK") { none++; console.log(`  ○ no coverage: ${p.id} (${meta.status})`); continue; }
      const heading = ov?.heading ?? bearing(meta.location?.lat ?? shootLat, meta.location?.lng ?? shootLng, p.latitude, p.longitude);
      const buf = await image(shootLat, shootLng, heading, ov?.fov, ov?.pitch);

      if (localDir) {
        writeFileSync(join(localDir, `${p.id}.jpg`), buf);
        console.log(`  ✓ ${p.id}  heading ${heading.toFixed(0)}°  (${(buf.length / 1024) | 0} KB)`);
      } else {
        const objectPath = `${slug}/media/street-view/${p.id}.jpg`;
        const { error } = await supabase!.storage.from(BUCKET).upload(objectPath, buf, { contentType: "image/jpeg", upsert: true });
        if (error) { console.error(`  ✗ upload ${p.id}: ${error.message}`); continue; }
        p.media = p.media ?? {};
        p.media.card = {
          bucket: BUCKET,
          path: objectPath,
          kind: "photo",
          sourceId: "google-street-view",
          alt: { en: `${txt(p.name)} — street view`, tr: `${txt(p.name)} — sokak görünümü` },
          verifiedAt: meta.date ?? undefined,
        };
        changed = true; pulled++;
        console.log(`  ✓ ${p.id}  heading ${heading.toFixed(0)}°  → ${objectPath}`);
      }
      await sleep(120);
    }

    if (changed) writeFileSync(path, JSON.stringify(offering, null, 2) + "\n");
    if (report) console.log(`${slug}: ${missing} awaiting pull, ${skipped} already have an image, ${skiplisted} skip-listed.`);
    else if (localDir) console.log(`${slug}: saved ${pulled} to ${localDir}, ${none} no-coverage, ${skipped} already have image, ${skiplisted} skip-listed.`);
    else console.log(`${slug}: pulled ${pulled}, ${none} no-coverage, ${skipped} already had image, ${skiplisted} skip-listed.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
