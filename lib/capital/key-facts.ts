/**
 * What an investor sees on an investment page, and what they do not.
 *
 * Normalizing the profiles into Supabase turned every term in the Offering
 * Memorandum into a `fundDefinedFact`, and the detail page rendered all of them
 * — twenty-four rows under "Key facts", six of which the masthead already
 * showed. Two rules come out of that, and they live here rather than in the
 * view so they can be tested and so every surface applies them identically:
 *
 *   1. **Key facts is a fixed list of eight.** Not "whatever the fund
 *      published". A profile that gains twelve OM terms must not grow the card.
 *      The terms are still published — they move to `documentTermGroups`, under
 *      the document they came from, where a reader who wants them looks.
 *
 *   2. **Dealer compensation is not investor-facing.** Selling commission,
 *      trailer fee and the sales channel that names the dealer are marked
 *      `audience: "advisor"`; `investorFacts` drops them. They remain in the OM,
 *      which the investor can open, and in the advisor view.
 *
 * Nothing here reformats a published value: fund-defined facts are shown
 * verbatim, and only derived numerics (minimum, offering size, unit price,
 * inception) go through the formatters in ./present.
 */
import { tx } from "../i18n/localize.ts";
import { formatCurrencyCad, formatDate, formatMoneyCompact } from "./present.ts";
import type {
  FundDefinedFact,
  Lang,
  LocalizedText,
  OfferingBundle,
  OfferingDocument,
  ShareClass,
  SourcedValue,
} from "./types";

export type KeyFactRow = { label: string; value: string; provenance?: SourcedValue; note?: string };

export type KeyFactsCopy = {
  aum: string;
  inception: string;
  offeringSize: string;
  riskProfile: string;
  minimum: string;
  projectedReturn: string;
  distribution: string;
  unitPrice: string;
};

/**
 * Facts an investor may see: approved, relevant to the selected share class,
 * and not a dealer-compensation disclosure.
 */
export function investorFacts(facts: FundDefinedFact[], shareClassId?: string): FundDefinedFact[] {
  return facts.filter(
    (fact) =>
      fact.approval !== "private" &&
      (fact.audience ?? "investor") === "investor" &&
      (!fact.shareClassId || fact.shareClassId === shareClassId),
  );
}

/** Every published fact for the selected class, including advisor-only ones. */
export function allPublishedFacts(offering: OfferingBundle, share?: ShareClass): FundDefinedFact[] {
  return [...(offering.fundDefinedFacts ?? []), ...(share?.fundDefinedFacts ?? [])].filter(
    (fact) => fact.approval !== "private" && (!fact.shareClassId || fact.shareClassId === share?.id),
  );
}

/**
 * The eight facts, always in this order. Fund-published `target` facts win over
 * the derived share-class values so the fund's own wording is what appears;
 * a row is omitted rather than shown empty when its value is missing.
 */
export function buildEssentialKeyFacts(
  offering: OfferingBundle,
  share: ShareClass | undefined,
  lang: Lang,
  copy: KeyFactsCopy,
): KeyFactRow[] {
  const rows: KeyFactRow[] = [];
  const add = (label: string, value?: string | null, provenance?: SourcedValue, note?: string) => {
    if (value) rows.push({ label, value, provenance, note });
  };

  const targets = investorFacts(allPublishedFacts(offering, share), share?.id).filter(
    (fact) => fact.category === "target",
  );
  const target = (match: RegExp) => targets.find((fact) => match.test(fact.label.en));

  add(copy.aum, offering.aum ? String(offering.aum.value) : null, offering.aum);
  add(copy.inception, offering.inceptionDate ? formatDate(offering.inceptionDate, lang) : null);
  add(
    copy.offeringSize,
    offering.offeringSize ? formatMoneyCompact(Number(offering.offeringSize.value), lang) : null,
    offering.offeringSize,
  );
  add(copy.riskProfile, tx(offering.riskProfile, lang));
  add(
    copy.minimum,
    share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : null,
    share?.minimumInvestment,
  );

  const publishedReturn = target(/return/i);
  if (publishedReturn) {
    rows.push({ label: tx(publishedReturn.label, lang), value: tx(publishedReturn.value, lang) });
  } else {
    add(copy.projectedReturn, share?.targetReturn?.value, share?.targetReturn);
  }

  const publishedDistribution = target(/distribution/i);
  if (publishedDistribution) {
    rows.push({ label: tx(publishedDistribution.label, lang), value: tx(publishedDistribution.value, lang) });
  } else {
    add(
      copy.distribution,
      share?.targetDistribution?.value ?? share?.distributionPerUnit?.value ?? tx(offering.distributionFrequency, lang),
      share?.targetDistribution ?? share?.distributionPerUnit,
    );
  }

  add(copy.unitPrice, share?.unitPrice ? formatCurrencyCad(share.unitPrice.value, lang) : null, share?.unitPrice);

  return rows;
}

/* ------------------------------------------------------------------ */
/* Document term groups — the OM's own contents, under the OM          */
/* ------------------------------------------------------------------ */

export type DocumentTermGroup = { key: string; title: LocalizedText; facts: FundDefinedFact[] };

const GROUPS: { key: string; title: LocalizedText; categories: FundDefinedFact["category"][] }[] = [
  { key: "fees", title: { en: "Fees and costs", tr: "Ücretler ve maliyetler" }, categories: ["fee"] },
  {
    key: "liquidity",
    title: { en: "Liquidity and redemption", tr: "Likidite ve itfa" },
    categories: ["liquidity", "early-exit", "lockup"],
  },
  { key: "structure", title: { en: "Structure and parties", tr: "Yapı ve taraflar" }, categories: ["term"] },
];

/**
 * A fact belongs to a document when the source it cites resolves to that
 * document. `OfferingSource.documentSlug` is the link; a source without one
 * (a website, a news report) has no document to file its facts under.
 */
export function factsForDocument(
  offering: OfferingBundle,
  share: ShareClass | undefined,
  document: OfferingDocument,
  options: { includeAdvisorOnly?: boolean } = {},
): FundDefinedFact[] {
  const slugs = new Set(
    (offering.sources ?? []).filter((source) => source.documentSlug === document.id).map((source) => source.id),
  );
  if (!slugs.size) return [];
  const published = allPublishedFacts(offering, share);
  const visible = options.includeAdvisorOnly ? published : investorFacts(published, share?.id);
  return visible.filter((fact) => slugs.has(fact.sourceId));
}

/**
 * The full `fundType` statement, as a term of the Offering Memorandum. It reads
 * as what it is — a securities-law caveat — so it sits with the document rather
 * than in the manager summary card, which shows the one-line `structureLabel`.
 */
function legalStatusFact(offering: OfferingBundle, document: OfferingDocument): FundDefinedFact | null {
  if (document.type !== "offering-memorandum" || !offering.fundType) return null;
  const source = (offering.sources ?? []).find((item) => item.documentSlug === document.id);
  if (!source) return null;
  return {
    id: `${document.id}-legal-status`,
    label: { en: "Legal status", tr: "Hukuki statü" },
    value: offering.fundType,
    category: "term",
    sourceId: source.id,
    effectiveDate: document.effectiveDate,
    approval: "approved-public",
  };
}

/**
 * The document's terms, grouped for reading. `target` facts are deliberately
 * excluded — a target is a marketing figure that already sits at the top of the
 * page, not a term the document sets out.
 */
export function documentTermGroups(
  offering: OfferingBundle,
  share: ShareClass | undefined,
  document: OfferingDocument,
  options: { includeAdvisorOnly?: boolean } = {},
): DocumentTermGroup[] {
  const facts = factsForDocument(offering, share, document, options);
  if (!facts.length) return [];
  const legalStatus = legalStatusFact(offering, document);
  return GROUPS.map((group) => ({
    key: group.key,
    title: group.title,
    facts: [
      ...facts.filter((fact) => group.categories.includes(fact.category)),
      ...(group.key === "structure" && legalStatus ? [legalStatus] : []),
    ],
  })).filter((group) => group.facts.length > 0);
}
