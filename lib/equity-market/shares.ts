import type { OfferingBundle } from "./types.ts";
import { primaryShareClass } from "./present.ts";

/**
 * Whole-share economics for the investor journey.
 *
 * An investment is expressed as a number of *whole* units of an offering's
 * primary share class. You can only subscribe for units you can pay for in full:
 * a CAD budget B at unit price P subscribes for `floor(B / P)` units, costs
 * `units × P`, and leaves `B − units × P` uninvested. Every portfolio figure is
 * derived from `units × unitPrice`, never from a free-floating dollar amount.
 *
 * These are indicative-interest figures — how many whole units the investor
 * intends to subscribe for — not owned or executed shares. Pure and
 * Node-importable so the unit test can exercise the arithmetic directly.
 */

/**
 * The offering's per-unit price (CAD), read from the primary share class. Returns
 * null when no class, no `unitPrice`, or a non-positive/NaN value — every caller
 * must treat null as "cannot compute in units" and fall back to an amount-only view.
 */
export function unitPriceOf(bundle: OfferingBundle | undefined): number | null {
  const value = bundle ? primaryShareClass(bundle)?.unitPrice?.value : undefined;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/** Whole units a budget subscribes for: `floor(budget / unitPrice)`; 0 when either input is unusable. */
export function sharesAffordable(budget: number, unitPrice: number | null): number {
  if (!unitPrice || unitPrice <= 0 || !(budget > 0)) return 0;
  return Math.floor(budget / unitPrice);
}

/** The invested amount for a whole-unit count, rounded to cents. */
export function investedAmount(shares: number, unitPrice: number | null): number {
  if (!unitPrice || unitPrice <= 0 || !(shares > 0)) return 0;
  return Math.round(shares * unitPrice * 100) / 100;
}

/**
 * Budget left over after buying as many whole units as it affords (never
 * negative). Returns 0 without a usable price — leftover is only meaningful in
 * the share-based path; the amount-only fallback never shows it.
 */
export function leftover(budget: number, unitPrice: number | null): number {
  if (!(budget > 0) || !unitPrice || unitPrice <= 0) return 0;
  const spent = investedAmount(sharesAffordable(budget, unitPrice), unitPrice);
  return Math.max(0, Math.round((budget - spent) * 100) / 100);
}

/**
 * Units implied by a legacy dollar amount (rows created before the share-based
 * flow stored `share_quantity`). Display-only and may be fractional; returns null
 * when no usable price. Never use this to write a subscription — it only lets the
 * UI show "≈ N units" for historical amount-only records.
 */
export function impliedShares(amount: number, unitPrice: number | null): number | null {
  if (!unitPrice || unitPrice <= 0 || !(amount > 0)) return null;
  return amount / unitPrice;
}
