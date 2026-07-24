import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  OFFERING_FIELD_CATALOGUE,
  PER_PERIOD_FIELDS,
  offeringGapReport,
  scoreOfferingCompleteness,
} from "../lib/capital/field-catalogue.ts";
import type { OfferingBundle } from "../lib/capital/types.ts";

/**
 * The freshness cycle rests on two pieces of arithmetic and one catalogue.
 * These tests pin all three, because a wrong due date is invisible until a
 * fund has already gone stale — the exact failure this work exists to prevent.
 */

/**
 * Mirrors app.offering_next_review_due(): period end + cadence interval + a
 * 45-day publication lag. Kept in sync with the SQL by the boundary cases below.
 *
 * The month arithmetic CLAMPS, matching Postgres: `'2026-03-31' + interval
 * '3 months'` is 2026-06-30, not July 1. That matters because as-of dates are
 * period ends, so they land on the 31st constantly — plain JS `setUTCMonth`
 * overflows into the next month and would drift every due date by a day.
 */
function addMonthsClamped(iso: string, months: number): Date {
  const date = new Date(`${iso}T00:00:00Z`);
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function nextReviewDue(asOf: string | null, cadence: string): string | null {
  if (!asOf || cadence === "ad-hoc") return null;
  const months = cadence === "annual" ? 12 : cadence === "semi-annual" ? 6 : 3;
  const date = addMonthsClamped(asOf, months);
  date.setUTCDate(date.getUTCDate() + 45);
  return date.toISOString().slice(0, 10);
}

/** Mirrors app.offering_freshness_status(). */
function freshnessStatus(due: string | null, today: string): string {
  if (!due) return "unscheduled";
  const dueMs = Date.parse(`${due}T00:00:00Z`);
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  if (dueMs < todayMs) return "overdue";
  if (dueMs <= todayMs + 30 * 86_400_000) return "due-soon";
  return "current";
}

test("review due dates follow the cadence plus a publication lag", () => {
  // Managers publish weeks after period close: Lankin's Q1 2026 sheet and
  // Epiphany's Q4 2025 sheet both landed ~4-5 weeks out. Due-dating at the bare
  // period end would mark every fund overdue the day the quarter turns.
  assert.equal(nextReviewDue("2026-03-31", "quarterly"), "2026-08-14");
  assert.equal(nextReviewDue("2025-12-31", "quarterly"), "2026-05-15");
  assert.equal(nextReviewDue("2026-03-31", "semi-annual"), "2026-11-14");
  assert.equal(nextReviewDue("2026-03-31", "annual"), "2027-05-15");
  assert.equal(nextReviewDue("2026-03-31", "ad-hoc"), null, "ad-hoc funds are never automatically due");
  assert.equal(nextReviewDue(null, "quarterly"), null, "no as-of date means nothing to schedule");
});

test("freshness status changes at the documented boundaries", () => {
  const today = "2026-07-23";
  assert.equal(freshnessStatus(null, today), "unscheduled");
  assert.equal(freshnessStatus("2026-07-22", today), "overdue", "yesterday is overdue");
  assert.equal(freshnessStatus("2026-07-23", today), "due-soon", "today is due, not yet overdue");
  assert.equal(freshnessStatus("2026-08-22", today), "due-soon", "the 30th day is still due-soon");
  assert.equal(freshnessStatus("2026-08-23", today), "current", "day 31 is current");
});

test("the two live investments land on the right side of today", () => {
  // Lankin publishes Q1 2026 figures; Epiphany's newest sheet is Q4 2025.
  const today = "2026-07-23";
  assert.equal(freshnessStatus(nextReviewDue("2026-03-31", "quarterly"), today), "due-soon");
  assert.equal(freshnessStatus(nextReviewDue("2025-12-31", "quarterly"), today), "overdue");
});

test("the field catalogue is internally consistent", () => {
  const keys = OFFERING_FIELD_CATALOGUE.map((f) => f.key);
  assert.equal(new Set(keys).size, keys.length, "catalogue keys must be unique");
  for (const field of OFFERING_FIELD_CATALOGUE) {
    assert.ok(field.label.en.trim() && field.label.tr.trim(), `${field.key} needs a bilingual label`);
  }
  // The whole point of the volatility split is that a quarterly refresh is a
  // short list. If it ever approaches the full catalogue, the split is wrong.
  assert.ok(PER_PERIOD_FIELDS.length > 0, "a refresh must have something to revisit");
  assert.ok(
    PER_PERIOD_FIELDS.length < OFFERING_FIELD_CATALOGUE.length / 2,
    "most fields should be static between reporting periods",
  );
});

test("completeness scoring rewards filling required fields", () => {
  const empty = {
    id: "", slug: "", managerId: "", name: { en: "", tr: "" }, shortName: { en: "", tr: "" },
    summary: { en: "", tr: "" }, thesis: { en: "", tr: "" }, status: "coming-soon",
    strategyIds: [], assetClassIds: [], regionIds: [], shareClassIds: [], propertyIds: [], documentIds: [],
    featured: false, portfolioFacts: [], risks: [],
    complianceProfile: { issuerLegalType: "trust", isInvestmentFund: true, approvedOntarioExemptions: [], reviewOwner: "" },
    verifiedAt: "2026-07-23",
    manager: { id: "", slug: "", name: { en: "", tr: "" }, headquarters: { city: "", province: "", country: "" }, description: { en: "", tr: "" } },
    shareClasses: [], properties: [], documents: [],
  } as unknown as OfferingBundle;

  const blank = scoreOfferingCompleteness(empty);
  assert.equal(blank.percent, 0, "an empty bundle scores zero");
  assert.equal(blank.publishable, false, "an empty bundle must not be publishable");
  assert.ok(blank.missingRequired.length > 0);

  const named = scoreOfferingCompleteness({
    ...empty,
    name: { en: "Test Fund", tr: "Test Fonu" },
    summary: { en: "A summary", tr: "Bir özet" },
  } as OfferingBundle);
  assert.ok(named.percent > blank.percent, "filling fields must raise the score");
  assert.ok(named.filled >= 2);
});

test("scoring survives a malformed bundle instead of crashing the admin panel", () => {
  const report = scoreOfferingCompleteness({} as OfferingBundle);
  assert.equal(report.publishable, false);
  assert.equal(report.percent, 0);
});

test("committed seed bundles report their real gaps", () => {
  const seedDir = join(import.meta.dirname, "..", "supabase", "seed", "offerings");
  const bundles = readdirSync(seedDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ name, data: JSON.parse(readFileSync(join(seedDir, name), "utf8")) as OfferingBundle }));

  assert.ok(bundles.length > 0, "expected at least one seed bundle");
  for (const { name, data } of bundles) {
    const report = scoreOfferingCompleteness(data);
    const gaps = offeringGapReport(data);
    assert.ok(report.percent >= 0 && report.percent <= 100, `${name} produced an out-of-range score`);
    // Gap report covers every unfilled counted field, plus any optional ones.
    const gapKeys = new Set(gaps.map((f) => f.key));
    for (const field of [...report.missingRequired, ...report.missingRecommended]) {
      assert.ok(gapKeys.has(field.key), `${name}: ${field.key} missing from the gap report`);
    }
  }
});
