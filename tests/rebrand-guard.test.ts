import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOTS = ["app", "components", "lib", "i18n"];
const EXTENSIONS = [".ts", ".tsx", ".css"];

function sourceFiles(dir: string): string[] {
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [path] : [];
  });
}

const files = SOURCE_ROOTS.flatMap(sourceFiles).map((path) => ({
  path,
  text: readFileSync(resolve(root, path), "utf8"),
}));

/**
 * Lines that may legitimately contain a token the sweep otherwise forbids.
 * Anything not covered here is a leak of a retired brand into the product.
 */
const ALLOWED = [
  // The previous env var names, still read as a fallback until the Vercel
  // environment is cut over. Remove these once the fallback goes.
  /HNC_REQUIRE_AUTH/,
  /NEXT_PUBLIC_HNC_SITE_URL/,
  // Real places, not the codename.
  /North (?:Battleford|Korea|Macedonia|York|America)/,
  // The retired route prefix and hosts, named by the redirects that retire
  // them. RETIRED_PORTAL_HOSTS is the allowlist middleware 301s away from.
  /RETIRED_PORTAL_PREFIXES|hunter-advisory/,
  /hunterhunteradvisors\.com"|hunternorthcapital\.com"/,
];

const FORBIDDEN: [RegExp, string][] = [
  [/Hunter\s*(?:&|&amp;)\s*Hunter/, "the previous brand name"],
  [/Hunter North/i, "the Hunter North codename"],
  [/Hunter Advisory/i, "the Hunter Advisory codename"],
  [/\bhnc[-_]/i, "an HNC-prefixed identifier"],
  [/hunterhunteradvisors|hunternorthcapital/i, "a retired domain"],
];

test("no retired brand survives in portal source", () => {
  const leaks: string[] = [];
  for (const file of files) {
    file.text.split("\n").forEach((line, index) => {
      if (ALLOWED.some((allowed) => allowed.test(line))) return;
      for (const [pattern, label] of FORBIDDEN) {
        if (pattern.test(line)) {
          leaks.push(`${relative(".", file.path)}:${index + 1} — ${label}: ${line.trim().slice(0, 90)}`);
        }
      }
    });
  }
  assert.deepEqual(leaks, [], `retired brand tokens found:\n${leaks.join("\n")}`);
});

test("the real-estate business keeps its own identity", () => {
  // The rename covers the portal only. Jack Hunter is the registrant behind it
  // and Hunter Group Real Estate is a different business on a different
  // domain — a sweep that took either out would be a bug, not a cleanup.
  const dictionaries = readFileSync(resolve(root, "lib/i18n/dictionaries.ts"), "utf8");
  assert.match(dictionaries, /siteName: "Hunter Group Real Estate"/);

  const brand = readFileSync(resolve(root, "lib/equity-market/investment-brand.ts"), "utf8");
  assert.match(brand, /representativeName: "Jack Hunter"/);
  assert.match(brand, /Equity Market is Jack Hunter/);
});
