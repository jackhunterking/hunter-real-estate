import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("investment brand configuration carries the approved bilingual dealer relationship", () => {
  const brand = read("lib/capital/investment-brand.ts");
  assert.match(brand, /Hunter & Hunter Investment Advisory/);
  assert.match(brand, /Hunter & Hunter Yatırım Danışmanlığı/);
  assert.match(brand, /Jack Hunter/);
  assert.match(brand, /Dealing Representative/);
  assert.match(brand, /Parvis Investment Services Inc\./);
  assert.match(brand, /nrdNumber: "74000"/);
  assert.match(brand, /https:\/\/www\.parvisinvest\.com\/legal\/disclosures/);
  assert.match(brand, /compensationDisclosure: \{ en: "", tr: "" \}/);
});

test("all four disclosure levels use the shared bilingual source", () => {
  const component = read("components/capital/north/DealerDisclosure.tsx");
  assert.match(component, /"micro" \| "short" \| "transactional" \| "full"/);
  assert.match(component, /copy\.microDisclosure/);
  assert.match(component, /copy\.shortDisclosure/);
  assert.match(component, /copy\.transactionalDisclosure/);
  assert.match(component, /copy\.legalParagraphs/);
  assert.match(component, /PARVIS_RELATIONSHIP\.compensationDisclosure/);
});

test("Parvis co-brand assets are local and auth emails use the minority lockup", () => {
  assert.match(read("public/logos/parvis-wordmark-white.svg"), /^<svg/);
  assert.match(read("public/logos/parvis-wordmark-dark.svg"), /^<svg/);
  for (const template of ["confirmation", "email-change", "invite", "recovery"]) {
    const html = read(`supabase/templates/${template}.html`);
    assert.match(html, /Hunter &amp; Hunter/);
    assert.match(html, /Powered by/);
    assert.match(html, /\/logos\/parvis-wordmark-white\.svg/);
    assert.match(html, /NRD #74000/);
    assert.match(html, /www\.parvisinvest\.com\/legal\/disclosures/);
    assert.doesNotMatch(html, /Hunter Advisory|Hunter North Capital/);
  }
});
