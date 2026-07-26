import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseOfferingBundle } from "../lib/equity-market/schema.ts";

/**
 * Golden guard for the offering render contract. Every committed seed bundle
 * (the source the DB is seeded from, and the shape app.compose_offering_snapshot
 * must reproduce) must parse cleanly via parseOfferingBundle — the exact zod used
 * at read time. If a bundle drifts, published_offerings would silently drop it and
 * the investment pages would go blank; this fails loudly instead.
 */
const seedDir = join(import.meta.dirname, "..", "supabase", "seed", "offerings");
const bundles = readdirSync(seedDir)
  .filter((name) => name.endsWith(".json"))
  .map((name) => ({ name, data: JSON.parse(readFileSync(join(seedDir, name), "utf8")) as unknown }));

test("every committed offering bundle satisfies the render contract", () => {
  assert.ok(bundles.length > 0, "expected at least one seed bundle");
  for (const { name, data } of bundles) {
    const parsed = parseOfferingBundle(data);
    assert.ok(parsed, `${name} failed parseOfferingBundle (would be dropped at read time)`);
    assert.ok(parsed.shareClasses.length >= 1, `${name} needs >=1 share class to publish`);
    assert.ok(parsed.properties.length >= 1, `${name} needs >=1 property to publish`);
    assert.ok(parsed.name.en && parsed.name.tr, `${name} needs a bilingual name`);
  }
});

test("offering media and public documents are Supabase Storage-backed", () => {
  for (const { name, data } of bundles) {
    const bundle = data as {
      media?: { card?: { bucket?: string; path?: string } };
      documents?: { visibility?: string; bucket?: string; path?: string; href?: string }[];
    };
    // Card image must carry a Storage reference (bucket + path), not only a /public src.
    assert.ok(
      bundle.media?.card?.bucket && bundle.media?.card?.path,
      `${name} card image is not Storage-backed (missing bucket/path)`,
    );
    // Public documents that ship a file must reference Storage.
    for (const doc of bundle.documents ?? []) {
      if (doc.visibility === "public" && doc.href) {
        assert.ok(doc.bucket && doc.path, `${name} public document with a file is not Storage-backed`);
      }
    }
  }
});
