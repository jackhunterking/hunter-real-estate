const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

export function formatCompactCurrency(value: number) {
  if (value >= 1000000) {
    const millions = value / 1000000;
    const formatted = Number.isInteger(millions) ? `${millions}` : millions.toFixed(1);
    return `$${formatted}M`;
  }
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${Math.round(value)}`;
}

export function getModeLabel(mode: "distribution" | "appreciation" | "total") {
  if (mode === "distribution") return "Income generation lens";
  if (mode === "appreciation") return "Appreciation lens";
  return "Total target return lens";
}
