import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ENTRY_DISCLAIMER,
  ENTRY_DISCLAIMER_EXIT_URL,
  ENTRY_DISCLAIMER_VERSION,
  entryDisclaimerFor,
} from "../lib/capital/entry-disclaimer.ts";
import { PARVIS_RELATIONSHIP } from "../lib/capital/investment-brand.ts";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/**
 * The entry notice is regulated copy. These tests pin the properties a reviewer
 * would check — that each required statement is actually present, that the
 * registration details cannot drift from the single source, and above all that
 * the notice never turns into an accredited-investor self-certification.
 */

test("every required statement reaches the reader", () => {
  for (const lang of ["en", "tr"] as const) {
    const copy = ENTRY_DISCLAIMER[lang];
    const body = copy.paragraphs.join(" ");
    // Three statements, deliberately: registration, no-offer/no-advice, risk.
    // Everything else lives behind the disclosure link rather than in the modal.
    assert.equal(copy.paragraphs.length, 3, `${lang}: three statements are expected`);

    // Registration: who is registered, with whom, supervised by whom.
    assert.match(body, /Parvis Investment Services Inc\./, `${lang}: names the dealer`);
    assert.match(body, /Dealing Representative/, `${lang}: names the category`);
    assert.match(body, /NRD/, `${lang}: carries the NRD number`);
    // No-offer, no-advice, risk, jurisdiction.
    assert.match(body, /prospectus|izahname/i, `${lang}: says it is not a prospectus`);
    assert.match(body, /Ontario/, `${lang}: names the registration jurisdiction`);
  }
});

test("registration details are single-sourced, never retyped", () => {
  const source = read("lib/capital/entry-disclaimer.ts");
  assert.match(source, /from "\.\/investment-brand\.ts"/);
  // A hardcoded NRD number here would silently diverge the day it changes.
  assert.ok(
    !source.includes("74000"),
    "the NRD number must interpolate from PARVIS_RELATIONSHIP",
  );
  assert.match(ENTRY_DISCLAIMER.en.paragraphs[0], new RegExp(PARVIS_RELATIONSHIP.nrdNumber));
  assert.match(ENTRY_DISCLAIMER.tr.paragraphs[0], new RegExp(PARVIS_RELATIONSHIP.nrdNumber));
});

test("the notice never asks the reader to self-certify eligibility", () => {
  // CSA guidance puts exemption eligibility on the registrant's verification.
  // A door that collects "I am accredited" manufactures a record Parvis never
  // checked — worse than no record at all.
  const forbidden = [
    /I am an accredited/i,
    /I confirm .{0,30}accredited/i,
    /accredited investor\?/i,
    /akredite yatırımcıyım/i,
  ];
  const surfaces = [
    ENTRY_DISCLAIMER.en.paragraphs.join(" "),
    ENTRY_DISCLAIMER.tr.paragraphs.join(" "),
    ENTRY_DISCLAIMER.en.acknowledge,
    ENTRY_DISCLAIMER.tr.acknowledge,
    read("components/capital/north/EntryDisclaimer.tsx"),
  ].join("\n");
  for (const pattern of forbidden) {
    assert.ok(!pattern.test(surfaces), `entry gate must not self-certify: ${pattern}`);
  }
});

test("a reader who does not agree can still leave", () => {
  const client = read("components/capital/north/EntryDisclaimer.tsx");
  assert.match(client, /ENTRY_DISCLAIMER_EXIT_URL/, "an exit route must exist");
  assert.match(ENTRY_DISCLAIMER_EXIT_URL, /^https:\/\//);
  for (const lang of ["en", "tr"] as const) {
    assert.ok(ENTRY_DISCLAIMER[lang].leave.trim(), `${lang}: the exit needs a label`);
  }
});

test("acknowledgement is versioned so revised wording re-prompts", () => {
  assert.ok(Number.isInteger(ENTRY_DISCLAIMER_VERSION) && ENTRY_DISCLAIMER_VERSION > 0);
  const client = read("components/capital/north/EntryDisclaimer.tsx");
  assert.match(
    client,
    /stored\?\.version !== ENTRY_DISCLAIMER_VERSION/,
    "an older acknowledgement must not carry forward to new wording",
  );
});

test("unreviewed locales fall back to English rather than guessing", () => {
  // Matches investmentBrandFor: regulated wording is not machine-translated
  // into a market before compliance has read it in that language.
  assert.equal(entryDisclaimerFor("fr"), ENTRY_DISCLAIMER.en);
  assert.equal(entryDisclaimerFor("es"), ENTRY_DISCLAIMER.en);
  assert.equal(entryDisclaimerFor("tr"), ENTRY_DISCLAIMER.tr);
  assert.equal(entryDisclaimerFor("en"), ENTRY_DISCLAIMER.en);
});

test("the notice is live", () => {
  const flags = read("lib/capital/feature-flags.ts");
  assert.match(flags, /export const ENTRY_DISCLAIMER_ENABLED: boolean = true;/);
});

test("wording cannot change without bumping the version", () => {
  // Visitors are held to the exact text they acknowledged. Editing a paragraph
  // while leaving ENTRY_DISCLAIMER_VERSION alone would leave everyone carrying
  // an acknowledgement of copy that no longer exists — so the digest is pinned
  // here. If Parvis returns edits: apply them, bump the version, then update
  // this hash and the version below in the same commit.
  const digest = createHash("sha256")
    .update(JSON.stringify([ENTRY_DISCLAIMER.en.paragraphs, ENTRY_DISCLAIMER.tr.paragraphs]))
    .digest("hex")
    .slice(0, 16);
  assert.equal(digest, "c0a0a38318e36da1", "copy changed — bump ENTRY_DISCLAIMER_VERSION");
  assert.equal(ENTRY_DISCLAIMER_VERSION, 2);
});

test("it is mounted on the advisory surface only", () => {
  const advisoryLayout = read("app/[locale]/hunter-advisory/layout.tsx");
  assert.match(advisoryLayout, /<EntryDisclaimer \/>/);
  // The real-estate site is a different business; a securities notice there
  // would misinform rather than protect.
  assert.ok(
    !read("app/[locale]/layout.tsx").includes("EntryDisclaimer"),
    "the securities notice must not mount on the main marketing site",
  );
});
