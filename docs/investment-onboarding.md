# Onboarding and refreshing an investment

The procedure for every investment on the platform — the first one and the tenth. It
exists because the profiles were originally hand-authored from JSON with no record of
where a figure came from or when it was next due for review, and Lankin Apartment REIT
drifted four months behind the manager's own website before anyone noticed.

## The two halves

**Static fields** — thesis, fees, term, redemption schedule, risks, manager profile —
change only when the Offering Memorandum does.

**Per-period fields** — AUM, portfolio facts, trailing returns, unit price, distribution,
property and unit counts, new acquisitions, the new fact sheet, `dataAsOf` — change every
reporting cycle. There are about a dozen.

Which is which is declared once in [`lib/capital/field-catalogue.ts`](../lib/capital/field-catalogue.ts),
and that one file drives the completeness score, the refresh checklist and the gap report
for every investment.

## Onboarding a new investment

1. **Intake.** Collect the manager's document set: current fact sheet, Offering
   Memorandum, investor deck, most recent financials. Dealer-restricted material goes to
   the `offering-private` bucket (`visibility: approved-investor`), never `offering-public`
   — that bucket is world-readable.
2. **Register sources.** One `app.offering_sources` row per document, with a stable key
   (`<manager>-fact-<period>`, `<manager>-deck-<yyyy-mm>`). Every `SourcedValue.sourceId`
   must resolve to one of these, or the figure has no provenance.
3. **Run the gap report.** Operations → Investments shows the completeness score and the
   list of unfilled required fields. That list is what you request from the manager.
4. **Fill top-down**: identity → facts → share classes → properties → media → documents.
   Only enter what a source supports. Anything unsupported goes on the gap report — an
   empty field renders its fallback; a wrong field misleads an investor.
5. **Set the freshness contract**: cadence, `dataAsOf` (the reporting period *end*),
   `dataPeriodLabel` (the manager's own words), and `managerPublicUrl`.
6. **Publish.** `api.publish_offering` writes a new immutable content version.
7. **Record the review** in Operations → Data freshness, and send the gap report.

**Acceptance gate:** an investment publishes when every `required` catalogue field is
filled *and sourced*.

## The quarterly refresh

1. The fund appears in **Operations → Data freshness** as *due soon*, then *overdue*.
   Due dates are the period end plus the cadence plus a 45-day publication lag, because
   managers publish weeks after a period closes.
2. **Open the manager's fund page first** (the "Manager page" link). Compare their
   headline properties / units / AUM against ours. This is the step that catches an
   acquisition nobody told you about.
3. Request or download the new fact sheet; register it as a new source.
4. Update only the per-period fields. Stamp each touched value with `asOfDate`,
   `sourceId`, `sourcePage` and `approval`.
5. Publish, then **Record review**. That single call stamps the offering, recomputes the
   next due date, and appends to `app.offering_reviews` — so the three can never disagree.

If the manager has not published yet, record the review as **awaiting source**: it logs
that you looked, leaves the figures and their as-of date alone, and puts the fund back in
the queue in 30 days.

## Source precedence

When documents disagree, this order decides — it is not a judgement call:

1. **Offering Memorandum** and the audited financial statements bound into it. The legal
   document. It governs structure, series, fees, redemption, properties and risk.
2. **Fact sheet / quarterly report** — for figures the OM does not publish, and for
   anything more recent than the OM.
3. **Manager's public fund page** — for current portfolio state between filings.
4. **Investor deck and other marketing material** — lowest. Use it for narrative and
   photography, and for nothing that contradicts the OM.

Targeted returns and targeted distributions usually appear **only** in marketing material.
Source them there, never to the OM, and never present them as OM terms.

A newer OM supersedes an older one entirely. Re-run the whole profile against it rather
than patching field by field — the Lankin May 2026 OM changed the redemption schedule, the
securities-law fund classification, the number of series and every property name at once.

## Rules that are not negotiable

- **Never enter a figure without a source.** Flag it instead.
- **Never reconcile a conflict yourself** where precedence does not settle it — e.g. two
  documents at the same level, or a count that simply does not add up. The published value
  stays put and the conflict goes on the report. See
  [the Lankin OM reconciliation](./lankin-om-2026-05-reconciliation.md) for the shape.
- **Never stamp a compliance review you did not perform.** `approvedOntarioExemptions` and
  `complianceProfile.reviewedAt` are licensed decisions. Leaving them unset makes the
  investor assessment say "compliance not confirmed", which is the honest answer.
- **Unit counts must reconcile.** The sum of `properties[].unitCount` must equal the unit
  count the fund publishes. A mismatch means a building is missing or miscounted.
- **Dealer-restricted documents never go in a public bucket.**
