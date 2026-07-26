import assert from "node:assert/strict";
import test from "node:test";
import { buildFootprintGallery } from "../lib/capital/landing-gallery.ts";
import type {
  PublicOfferingPreview,
  PublicOfferingPropertyPreview,
} from "../lib/capital/types.ts";

const t = (en: string) => ({ en, tr: en });

function property(id: string, city = "Lethbridge"): PublicOfferingPropertyPreview {
  return {
    id,
    name: t(id),
    city,
    province: "Alberta",
    latitude: 49.7,
    longitude: -112.8,
    assetClassId: "commercial",
    status: "stabilized",
    media: { card: { src: `/${id}.jpg` } },
  };
}

function offering(
  id: string,
  properties: PublicOfferingPropertyPreview[],
  extra: Partial<PublicOfferingPreview> = {},
): PublicOfferingPreview {
  return {
    id,
    slug: id,
    name: t(id),
    shortName: t(id),
    managerName: t(`${id} Manager`),
    summary: t(""),
    status: "available",
    strategyIds: [],
    assetClassIds: [],
    regionIds: [],
    portfolioFacts: [],
    properties,
    audited: true,
    verifiedAt: "2026-03-31",
    ...extra,
  };
}

test("building photos alternate between funds instead of running one fund out", () => {
  const legacy = offering("legacy", ["a1", "a2", "a3", "a4", "a5"].map((id) => property(id)));
  const lankin = offering("lankin", ["b1", "b2"].map((id) => property(id, "Windsor")));

  const gallery = buildFootprintGallery([legacy, lankin]);

  // Each row starts one fund further along, so neither fund stacks down a
  // single column of the grid.
  assert.deepEqual(
    gallery.map((item) => item.offering.id),
    ["legacy", "lankin", "lankin", "legacy", "legacy", "legacy", "legacy"],
  );
  // The truncated view the landing page renders shows both portfolios.
  assert.equal(new Set(gallery.slice(0, 8).map((i) => i.offering.id)).size, 2);
});

test("every photo carries the fund it belongs to, with the manager logo when published", () => {
  const withLogo = offering("lankin", [property("b1")], {
    media: { logo: { src: "/lankinLogo.png", alt: t("Lankin logo") } },
  });
  const withoutLogo = offering("legacy", [property("a1")]);

  const [lankinShot, legacyShot] = buildFootprintGallery([withLogo, withoutLogo]);

  assert.equal(lankinShot.offering.logoSrc, "/lankinLogo.png");
  assert.equal(lankinShot.offering.logoAlt?.en, "Lankin logo");
  assert.equal(legacyShot.offering.logoSrc, undefined);
  assert.equal(legacyShot.offering.name.en, "legacy");
});

test("a building held by two funds is shown once, credited to the first fund", () => {
  const shared = property("shared");
  const gallery = buildFootprintGallery([
    offering("legacy", [shared]),
    offering("lankin", [shared, property("b1")]),
  ]);

  assert.deepEqual(
    gallery.map((item) => [item.title.en, item.offering.id]),
    [
      ["shared", "legacy"],
      ["b1", "lankin"],
    ],
  );
});

test("fund-level fact-sheet photography follows that fund's own buildings", () => {
  const gallery = buildFootprintGallery([
    offering("legacy", [property("a1")], {
      media: { gallery: [{ src: "/legacy-factsheet.jpg" }] },
    }),
    offering("lankin", [property("b1")]),
  ]);

  const factSheet = gallery.find((item) => item.src === "/legacy-factsheet.jpg");
  assert.equal(factSheet?.title.en, "legacy");
  assert.equal(factSheet?.subtitle.en, "legacy Manager");
  assert.equal(factSheet?.offering.id, "legacy");
});

test("photos with no image are dropped rather than rendered empty", () => {
  const blank: PublicOfferingPropertyPreview = { ...property("blank"), media: undefined };
  const gallery = buildFootprintGallery([offering("legacy", [blank, property("a1")])]);

  assert.deepEqual(gallery.map((item) => item.title.en), ["a1"]);
});
