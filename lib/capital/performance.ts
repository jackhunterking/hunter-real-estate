/**
 * Convert a published percentage string into a chartable number without
 * changing the original display value used by the performance table.
 */
export function parsePerformancePercentage(value: string): number | null {
  const match = value.trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*%$/);
  if (!match) return null;

  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Aggregate periods (for example, "Year 3" or "Since inception") belong in
 * the exact-value table but not on a chronological chart axis.
 */
export function isChronologicalPerformancePeriod(period: string): boolean {
  const normalized = period.trim();
  return /^\d{4}$/.test(normalized)
    || /^\d{4}\s+(?:Q[1-4]|[1-4][QÇ])$/iu.test(normalized);
}
