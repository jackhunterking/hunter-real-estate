/**
 * One-off: move the committed /public offering assets into Supabase Storage so
 * every investment image and public document is served from Supabase (via
 * `getPublicUrl` on the public `offering-public` bucket) instead of Next.js
 * static files.
 *
 * Investor-only documents (offering memoranda, subscription agreements, private
 * presentations) intentionally have NO source file yet — they are uploaded later
 * through the admin panel into the private `offering-private` bucket and served
 * via signed URLs. They are omitted here.
 *
 * Run:  node --env-file=.env.local scripts/upload-offering-assets.ts
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_WEB_SECRET_KEY (service role).
 * Idempotent (upsert: true).
 */
import { readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_WEB_SECRET_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_WEB_SECRET_KEY. Run with --env-file=.env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
};

/** local path (relative to /public) -> { bucket, object path } */
const UPLOADS: { local: string; bucket: string; path: string }[] = [
  // Lankin images
  { local: "lankinCardBG.png", bucket: "offering-public", path: "lankin-apartment-reit/media/lankinCardBG.png" },
  { local: "lankinBG.png", bucket: "offering-public", path: "lankin-apartment-reit/media/lankinBG.png" },
  { local: "lankinLogo.png", bucket: "offering-public", path: "lankin-apartment-reit/media/lankinLogo.png" },
  { local: "capital/photos/lankin-apartment-reit/portfolio-1.jpg", bucket: "offering-public", path: "lankin-apartment-reit/media/portfolio-1.jpg" },
  { local: "capital/photos/lankin-apartment-reit/portfolio-2.jpg", bucket: "offering-public", path: "lankin-apartment-reit/media/portfolio-2.jpg" },
  // Lankin public document
  { local: "capital/docs/lankin-apartment-reit-fact-sheet-q1-2026-class-a.pdf", bucket: "offering-public", path: "lankin-apartment-reit/docs/fact-sheet-q1-2026-class-a.pdf" },
  // Legacy images
  { local: "legacyBG.png", bucket: "offering-public", path: "legacy-epiphany/media/legacyBG.png" },
  { local: "legacyLogo.png", bucket: "offering-public", path: "legacy-epiphany/media/legacyLogo.png" },
  // Legacy public document
  { local: "capital/docs/legacy-class-a-fact-sheet-2026-01-30.pdf", bucket: "offering-public", path: "legacy-epiphany/docs/fact-sheet-2026-01-30.pdf" },
];

async function main() {
  let ok = 0;
  for (const { local, bucket, path } of UPLOADS) {
    const abs = join(repoRoot, "public", local);
    const body = readFileSync(abs);
    const contentType = CONTENT_TYPES[extname(local).toLowerCase()] ?? "application/octet-stream";
    const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true });
    if (error) {
      console.error(`FAIL  ${bucket}/${path}: ${error.message}`);
      process.exitCode = 1;
    } else {
      ok += 1;
      console.log(`OK    ${bucket}/${path}`);
    }
  }
  console.log(`\nUploaded ${ok}/${UPLOADS.length} objects.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
