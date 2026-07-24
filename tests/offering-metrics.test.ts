import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildFundDetailViewModel, offeringMetrics, tightRange } from "../lib/capital/present.ts";
import type { OfferingBundle } from "../lib/capital/types.ts";

const t = (en: string) => ({ en, tr: en });

const sourced = (value: string) => ({
  value,
  classification: "target" as const,
  asOfDate: "2026-03-31",
  sourceId: "fact",
  approval: "approved-public" as const,
});

const bundle = {
  id: "fund",
  slug: "fund",
  shortName: t("Fund"),
  riskProfile: t("Low - Moderate"),
  documents: [],
  properties: [],
  portfolioFacts: [],
  fundDefinedFacts: [],
  sources: [],
  shareClasses: [
    {
      id: "series-a",
      offeringId: "fund",
      name: "Series A",
      registeredAccountTypes: [],
      fundDefinedFacts: [],
      targetReturn: sourced("10%-14% targeted annual net return"),
      targetDistribution: sourced("7%-8% targeted annualized cash distribution, paid monthly"),
    },
  ],
} as unknown as OfferingBundle;

const tile = (b: OfferingBundle, lang: "en" | "tr", key: string) =>
  buildFundDetailViewModel(b, lang).summaryTiles.find((row) => row.key === key)?.value;

test("the target-return tile carries the whole published range, not its floor", () => {
  // The range is signed on both sides ("10%-14%"), which used to be read as a
  // bare "10%" — understating the target on the tile investors read first.
  assert.equal(tile(bundle, "en", "return"), "10–14%");
  assert.equal(tile(bundle, "tr", "return"), "%10–14");
});

test("the overview tile never disagrees with the card headline for the same figure", () => {
  const share = bundle.shareClasses[0]!;
  assert.equal(tile(bundle, "en", "return"), tightRange(share.targetReturn!.value));
});

test("a single published figure and a decimal still compact cleanly", () => {
  const single = (value: string, lang: "en" | "tr") =>
    tile({ ...bundle, shareClasses: [{ ...bundle.shareClasses[0]!, targetReturn: sourced(value) }] } as OfferingBundle, lang, "return");

  assert.equal(single("12% targeted annual net return", "en"), "12%");
  assert.equal(single("12% targeted annual net return", "tr"), "%12");
  assert.equal(single("8.2%-9.4% targeted", "en"), "8.2–9.4%");
  assert.equal(single("8.2%-9.4% targeted", "tr"), "%8,2–9,4");
  // En-dashed and spaced copy is the same range, so it reads the same.
  assert.equal(single("10 % – 14 % targeted", "en"), "10–14%");
});

test("target tiles keep both ends of the range in Turkish prose too", () => {
  const metrics = offeringMetrics(bundle, "tr");
  const distribution = metrics.find((row) => row.key === "distribution")?.value ?? "";
  // "%7-%8" prefixed each number on its own; the range takes one sign.
  assert.match(distribution, /%7-8/);
  assert.doesNotMatch(distribution, /%7-%8/);
});

test("neither live investment understates its published target return", () => {
  for (const slug of ["lankin-apartment-reit", "legacy-epiphany"]) {
    const seed = JSON.parse(readFileSync(new URL(`../supabase/seed/offerings/${slug}.json`, import.meta.url), "utf8"));
    for (const share of seed.shareClasses ?? []) {
      for (const field of ["targetReturn", "targetDistribution"] as const) {
        const published: string | undefined = share[field]?.value;
        if (!published) continue;
        const numbers = published.match(/\d+(?:\.\d+)?(?=\s*%)/g) ?? [];
        const rendered = tightRange(published);
        for (const number of numbers) {
          assert.ok(
            rendered.includes(number),
            `${slug} ${field}: published "${published}" renders as "${rendered}", dropping ${number}%`,
          );
        }
      }
    }
  }
});
