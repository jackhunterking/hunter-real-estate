const TERM_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["Müşteriler", "Yatırımcılar"],
  ["müşteriler", "yatırımcılar"],
  ["Müşterinin", "Yatırımcının"],
  ["müşterinin", "yatırımcının"],
  ["Müşteriye", "Yatırımcıya"],
  ["müşteriye", "yatırımcıya"],
  ["Müşteriyi", "Yatırımcıyı"],
  ["müşteriyi", "yatırımcıyı"],
  ["Müşteriyle", "Yatırımcıyla"],
  ["müşteriyle", "yatırımcıyla"],
  ["Müşteriden", "Yatırımcıdan"],
  ["müşteriden", "yatırımcıdan"],
  ["Müşteri", "Yatırımcı"],
  ["müşteri", "yatırımcı"],
];

export function investorTerminology<T>(value: T): T {
  if (typeof value === "string") {
    const source = value as string;
    const localized: string = TERM_REPLACEMENTS.reduce<string>(
      (text, [from, to]) => text.replaceAll(from, to),
      source,
    );

    return localized
      .replace(/\bClients\b/g, "Investors")
      .replace(/\bClient\b/g, "Investor")
      .replace(/\bclients\b/g, "investors")
      .replace(/\bclient\b/g, "investor")
      .replace(/\bCustomers\b/g, "Investors")
      .replace(/\bCustomer\b/g, "Investor")
      .replace(/\bcustomers\b/g, "investors")
      .replace(/\bcustomer\b/g, "investor")
      .replace(/\ba investor\b/g, "an investor")
      .replace(/\bA Investor\b/g, "An Investor") as T;
  }

  if (Array.isArray(value)) return value.map(investorTerminology) as T;

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, investorTerminology(item)]),
    ) as T;
  }

  return value;
}
