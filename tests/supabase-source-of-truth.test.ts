import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseOfferingBundle } from "../lib/capital/schema.ts";

const ROOT = new URL("..", import.meta.url).pathname;

function walk(dir: string): string[] {
  const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
      return walk(rel);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [rel] : [];
  });
}

test("no hardcoded fixture or demo modules remain in the app", () => {
  // The deleted modules must be gone.
  for (const gone of [
    "lib/capital/data.ts",
    "lib/capital/repository.ts",
    "lib/capital/portal-demo.ts",
    "lib/capital/partner-data.ts",
    "components/capital/OfferingCard.tsx",
  ]) {
    assert.equal(existsSync(join(ROOT, gone)), false, `${gone} should be deleted`);
  }

  // No app source may import them, or the flagship learning fixture.
  const forbidden = /capital\/(data|repository|portal-demo|partner-data)"|FLAGSHIP_LEARNING_RESOURCE|getProductDemoOfferings/;
  const files = ["app", "components", "lib"].flatMap((dir) => walk(dir));
  const offenders = files.filter((file) => forbidden.test(readFileSync(join(ROOT, file), "utf8")));
  assert.deepEqual(offenders, [], `these files still reference removed fixtures: ${offenders.join(", ")}`);
});

test("offerings are read only from Supabase (no fixture fallback)", () => {
  const repo = readFileSync(join(ROOT, "lib/capital/repository-server.ts"), "utf8");
  assert.doesNotMatch(repo, /fixturesAllowed|HNC_USE_FIXTURE_DATA|getFixtureOfferings/);
  assert.match(repo, /published_offerings/);
  assert.match(repo, /parseOfferingBundle/);
});

const VALID_BUNDLE = {
  id: "x", slug: "x", name: { en: "N", tr: "N" }, shortName: { en: "S", tr: "S" },
  summary: { en: "Sum", tr: "Sum" }, status: "available",
  manager: { id: "m", slug: "m", name: { en: "M", tr: "M" } },
  shareClasses: [{ id: "sc" }], properties: [{ id: "p" }], documents: [{ id: "d" }],
  verifiedAt: "2026-07-12",
  extraFieldKept: "value",
};

test("parseOfferingBundle accepts a valid snapshot and preserves all fields", () => {
  const parsed = parseOfferingBundle(VALID_BUNDLE);
  assert.notEqual(parsed, null);
  // Returns the original object unstripped (passthrough), keeping unknown fields.
  assert.equal((parsed as Record<string, unknown>).extraFieldKept, "value");
});

test("parseOfferingBundle drops malformed snapshots", () => {
  assert.equal(parseOfferingBundle(null), null);
  assert.equal(parseOfferingBundle({ ...VALID_BUNDLE, shareClasses: [] }), null); // needs >=1 class
  assert.equal(parseOfferingBundle({ ...VALID_BUNDLE, manager: undefined }), null);
  assert.equal(parseOfferingBundle({ ...VALID_BUNDLE, name: { en: "only-en" } }), null);
});
