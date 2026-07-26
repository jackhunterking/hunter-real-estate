import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("investment brand configuration carries the approved bilingual dealer relationship", () => {
  const brand = read("lib/capital/investment-brand.ts");
  assert.match(brand, /Hunter & Hunter Investment Advisors/);
  assert.doesNotMatch(brand, /Hunter & Hunter Yatırım Danışmanlığı/);
  assert.match(brand, /Jack Hunter/);
  assert.match(brand, /Dealing Representative/);
  assert.match(brand, /Parvis Investment Services Inc\./);
  assert.match(brand, /nrdNumber: "74000"/);
  assert.doesNotMatch(brand, /parvisinvest\.com/);
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
  assert.doesNotMatch(component, /<(?:a|Link)\b/);
});

test("Parvis co-brand assets are local and auth emails use the minority lockup", () => {
  assert.match(read("public/logos/parvis-wordmark-white.svg"), /^<svg/);
  assert.match(read("public/logos/parvis-wordmark-dark.svg"), /^<svg/);
  // Every template, not just the four action emails: a redesign of one group
  // once dropped the lockup from four of six, which is how the co-brand went
  // missing from the masthead of every confirmation email we sent.
  for (const template of [
    "confirmation",
    "email-change",
    "email-changed",
    "invite",
    "password-changed",
    "recovery",
  ]) {
    const html = read(`supabase/templates/${template}.html`);
    assert.match(html, /Hunter &amp; Hunter/);
    // Auth emails render the Parvis co-brand as text, not an <img>: most email
    // clients (Gmail, Outlook) do not render SVG, so the wordmark asset broke.
    assert.match(html, /Powered by/);
    assert.match(html, /PARVIS/);
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /NRD #74000/);
    assert.match(html, /Parvis disclosures/);
    assert.doesNotMatch(html, /Hunter Advisory|Hunter North Capital/);
    // Confirmation links must carry a real /auth/confirm path, never a bare
    // Site URL with a dangling &token_hash (the malformed-link regression).
    assert.doesNotMatch(html, /\{\{ \.RedirectTo \}\}&amp;token_hash/);
  }
});
