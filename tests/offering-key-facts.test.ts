import assert from "node:assert/strict";
import test from "node:test";
import {
  allPublishedFacts,
  buildEssentialKeyFacts,
  documentTermGroups,
  factsForDocument,
  investorFacts,
} from "../lib/equity-market/key-facts.ts";
import type {
  FundDefinedFact,
  OfferingBundle,
  OfferingDocument,
  ShareClass,
} from "../lib/equity-market/types.ts";

const t = (en: string) => ({ en, tr: en });

const COPY = {
  aum: "Assets under management",
  inception: "Inception date",
  offeringSize: "Offering size",
  riskProfile: "Risk profile",
  minimum: "Minimum investment",
  projectedReturn: "Projected return",
  distribution: "Distribution",
  unitPrice: "Unit price",
};

const fact = (over: Partial<FundDefinedFact> & Pick<FundDefinedFact, "id" | "category">): FundDefinedFact => ({
  label: t(over.id),
  value: t(`${over.id} value`),
  sourceId: "om",
  effectiveDate: "2026-05-01",
  approval: "approved-public",
  ...over,
});

const omDocument: OfferingDocument = {
  id: "om-doc",
  offeringId: "fund",
  title: t("Offering Memorandum"),
  type: "offering-memorandum",
  effectiveDate: "2026-05-01",
  version: "2026.05",
  visibility: "approved-investor",
};

const factSheet: OfferingDocument = { ...omDocument, id: "fact-doc", title: t("Fact sheet"), type: "fact-sheet" };

const share: ShareClass = {
  id: "series-a",
  offeringId: "fund",
  name: "Series A",
  registeredAccountTypes: ["RRSP", "TFSA"],
  minimumInvestment: { value: 5000, classification: "current", asOfDate: "2026-05-01", sourceId: "om", approval: "approved-public" },
  unitPrice: { value: 10.61, classification: "current", asOfDate: "2025-12-31", sourceId: "fs", approval: "approved-public" },
  targetReturn: { value: "10%-14%", classification: "target", asOfDate: "2026-03-31", sourceId: "fact", approval: "approved-public" },
  targetDistribution: { value: "7%-8%", classification: "target", asOfDate: "2026-03-31", sourceId: "fact", approval: "approved-public" },
  term: { value: "Open-ended trust", classification: "current", asOfDate: "2026-05-01", sourceId: "om", approval: "approved-public" },
  redemptionTerms: t("8% within 6 months"),
  fundDefinedFacts: [
    fact({ id: "series-a-channel", category: "term", shareClassId: "series-a", audience: "advisor" }),
    fact({ id: "series-a-commission", category: "fee", shareClassId: "series-a", audience: "advisor" }),
    fact({ id: "series-a-trailer", category: "fee", shareClassId: "series-a", audience: "advisor" }),
    fact({ id: "series-a-redemption", category: "early-exit", shareClassId: "series-a" }),
    fact({ id: "series-a-minimum", category: "term", shareClassId: "series-a" }),
  ],
};

const offering = {
  id: "fund",
  slug: "fund",
  documents: [omDocument, factSheet],
  shareClasses: [share],
  fundType: t("Open-ended trust. Not a mutual fund under securities law."),
  structureLabel: t("Open-ended trust (Ontario)"),
  inceptionDate: "2024-05",
  riskProfile: t("Low - Moderate"),
  aum: { value: "$580M+", classification: "current", asOfDate: "2026-07-23", sourceId: "site", approval: "approved-public" },
  offeringSize: { value: 250000000, classification: "current", asOfDate: "2026-05-01", sourceId: "om", approval: "approved-public" },
  sources: [
    { id: "om", title: t("Offering Memorandum"), documentSlug: "om-doc" },
    { id: "fact", title: t("Fact sheet"), documentSlug: "fact-doc" },
    { id: "site", title: t("Manager site") },
  ],
  fundDefinedFacts: [
    fact({ id: "asset-management-fee", category: "fee" }),
    fact({ id: "trustee-fee", category: "fee" }),
    fact({ id: "redemption-notice", category: "liquidity" }),
    fact({ id: "maximum-offering", category: "term" }),
    fact({ id: "private-term", category: "term", approval: "private" }),
    fact({ id: "site-target", category: "target", sourceId: "site" }),
  ],
} as unknown as OfferingBundle;

test("Key facts is a fixed list of eight, whatever the fund publishes", () => {
  const rows = buildEssentialKeyFacts(offering, share, "en", COPY);

  assert.equal(rows.length, 8);
  assert.deepEqual(
    rows.map((row) => row.label),
    [
      COPY.aum,
      COPY.inception,
      COPY.offeringSize,
      COPY.riskProfile,
      COPY.minimum,
      COPY.projectedReturn,
      COPY.distribution,
      COPY.unitPrice,
    ],
  );
});

test("a fund's own return/distribution wording never rewrites the catalogue labels", () => {
  // An offering that publishes `target` facts labelled the way a fund might — the
  // exact shape that used to override the row and make two offerings disagree.
  const withFundLabels = {
    ...offering,
    fundDefinedFacts: [
      // Optional on OfferingBundle, always present on this fixture.
      ...(offering.fundDefinedFacts ?? []),
      fact({
        id: "fund-total-return",
        category: "target",
        label: t("Targeted total return"),
        value: t("12%-15% a year. This is a target only and is not published in the Offering Memorandum."),
      }),
      fact({
        id: "fund-preferred-distribution",
        category: "target",
        label: t("Preferential distribution"),
        value: t("Up to 8.2% a year for units purchased at $4.75, or up to 7.8% for units purchased at $5.00."),
      }),
    ],
  } as unknown as OfferingBundle;

  const rows = buildEssentialKeyFacts(withFundLabels, share, "en", COPY);
  const returnRow = rows.find((row) => row.label === COPY.projectedReturn);
  const distributionRow = rows.find((row) => row.label === COPY.distribution);

  // The catalogue labels win — the fund's free-text labels never appear.
  assert.ok(returnRow, "return row must use the catalogue label 'Projected return'");
  assert.ok(distributionRow, "distribution row must use the catalogue label 'Distribution'");
  assert.equal(rows.some((row) => /Targeted total return|Preferential distribution/.test(row.label)), false);

  // Values come from the structured share-class fields, tightened — never the
  // fund's caveat prose or price-point split.
  assert.equal(returnRow?.value, "10–14%");
  assert.doesNotMatch(JSON.stringify(rows), /target only|Offering Memorandum|\$5\.00/);
});

test("no fee, commission, channel or redemption term reaches Key facts", () => {
  const rows = buildEssentialKeyFacts(offering, share, "en", COPY);
  const text = JSON.stringify(rows);

  for (const excluded of ["commission", "trailer", "channel", "trustee-fee", "asset-management-fee", "maximum-offering"]) {
    assert.doesNotMatch(text, new RegExp(excluded, "i"), `${excluded} must not be a Key fact`);
  }
});

test("investorFacts drops advisor-audience and private facts", () => {
  const visible = investorFacts(allPublishedFacts(offering, share), share.id);
  const ids = visible.map((item) => item.id);

  assert.ok(!ids.some((id) => /channel|commission|trailer/.test(id)), `dealer compensation leaked: ${ids.join(", ")}`);
  assert.ok(!ids.includes("private-term"));
  assert.ok(ids.includes("series-a-redemption"));
  assert.ok(ids.includes("asset-management-fee"));
});

test("a fact files under the document its source resolves to", () => {
  const omFacts = factsForDocument(offering, share, omDocument).map((item) => item.id);

  assert.ok(omFacts.includes("trustee-fee"));
  assert.ok(omFacts.includes("redemption-notice"));
  // Sourced to the manager's site, which is no document.
  assert.ok(!omFacts.includes("site-target"));
  // Advisor-only facts stay out of the investor's copy of the panel.
  assert.ok(!omFacts.some((id) => /commission|trailer|channel/.test(id)));
});

test("the advisor view still sees dealer compensation under the OM", () => {
  const ids = factsForDocument(offering, share, omDocument, { includeAdvisorOnly: true }).map((item) => item.id);

  assert.ok(ids.includes("series-a-commission"));
  assert.ok(ids.includes("series-a-trailer"));
  assert.ok(!ids.includes("private-term"), "private facts stay private in every view");
});

test("OM terms group by kind and carry the securities-law caveat as a term", () => {
  const groups = documentTermGroups(offering, share, omDocument);

  assert.deepEqual(groups.map((group) => group.key), ["fees", "liquidity", "structure"]);
  const structure = groups.find((group) => group.key === "structure");
  assert.ok(structure?.facts.some((item) => item.id === "om-doc-legal-status"));
  assert.match(
    structure?.facts.find((item) => item.id === "om-doc-legal-status")?.value.en ?? "",
    /Not a mutual fund under securities law/,
  );
  // A target is a marketing figure, not a term the document sets out.
  assert.ok(!groups.some((group) => group.facts.some((item) => item.category === "target")));
});

test("a document with no facts of its own gets no disclosure panel", () => {
  assert.deepEqual(documentTermGroups(offering, share, factSheet), []);
});
