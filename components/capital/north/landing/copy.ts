/**
 * Marketing copy for the Hunter & Hunter public landing page.
 *
 * English is the authored source of truth for launch. The bilingual shape is
 * preserved (`{ en, tr }`) so a Turkish / global-translation pass can be added
 * later without touching any read site — for now `tr` aliases `en`, so nothing
 * ever renders half-translated. Keep positional arrays (icons in the section
 * files) aligned by index to the arrays here.
 */

export interface LandingCopy {
  nav: { opportunities: string; platform: string; why: string };
  actions: { getAccess: string; seeOpportunities: string; signIn: string };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  trustBar: { items: string[] };
  platform: {
    eyebrow: string;
    title: string;
    body: string;
    tabs: { label: string; title: string; body: string }[];
  };
  featured: { eyebrow: string; title: string; body: string; open: string };
  benefits: {
    eyebrow: string;
    title: string;
    items: { title: string; body: string }[];
  };
  ways: {
    eyebrow: string;
    title: string;
    caption: string;
    previewCaption: string;
    items: { title: string; body: string }[];
  };
  final: { eyebrow: string; title: string; body: string };
  footer: {
    rights: string;
    risk: string;
    dealer: string;
    legalLink: string;
    parvisLink: string;
  };
  frames: {
    portfolio: string;
    detail: string;
    performance: string;
    buildings: string;
    openFunds: string;
    targetReturn: string;
    availableFunds: string;
    exampleFunds: string;
    historical: string;
    historicalTag: string;
    tabs: string[];
    factLabels: {
      targetReturn: string;
      distribution: string;
      minimum: string;
      risk: string;
      term: string;
      aum: string;
    };
  };
  card: {
    open: string;
    targetReturn: string;
    minimum: string;
    distribution: string;
    portfolio: string;
    verifiedLocations: string;
    aum: string;
    term: string;
    reviewRequired: string;
    verifiedAsOf: string;
    view: string;
    accountNote: string;
    previewLabel: string;
    keyFacts: string;
  };
}

const en: LandingCopy = {
  nav: {
    opportunities: "Opportunities",
    platform: "The platform",
    why: "Why real estate",
  },
  actions: {
    getAccess: "Get access",
    seeOpportunities: "See the opportunities",
    signIn: "Sign in",
  },
  hero: {
    eyebrow: "Private real estate · By access",
    // Union of the published Class A target ranges of the open funds (Legacy
    // 12–15%, Lankin 10–14%), both approved-public in lib/capital/data.ts.
    title: "Targeting 10–15% annual returns.",
    body: "Institutional-level private real estate, curated for Canadian investors.",
  },
  trustBar: {
    // Product-agnostic credibility only — no fund-specific figures here.
    items: [
      "Institutional-grade Canadian real estate",
      "Independently audited funds",
      "RRSP · TFSA · RESP eligible",
      "Dealer-supervised by Parvis",
    ],
  },
  platform: {
    eyebrow: "Inside the platform",
    title: "This is what your money looks like from the inside.",
    body: "The same workspace our investors sign into — real funds, real figures.",
    tabs: [
      {
        label: "Effortless access",
        title: "Your portfolio on one calm screen",
        body: "The funds you hold, their terms, and your distributions — no paperwork chase.",
      },
      {
        label: "Curated, not crowded",
        title: "Only what passes review makes the shelf",
        body: "Every offering arrives with source-verified key facts, down to the fact sheet and page.",
      },
      {
        label: "Real growth, on record",
        title: "Published performance, not promises",
        body: "Historical returns shown exactly as the fund publishes them.",
      },
      {
        label: "Assets you can point to",
        title: "The actual buildings behind your money",
        body: "Real photos, cities, and verification for the properties in the portfolio.",
      },
    ],
  },
  featured: {
    eyebrow: "Open now",
    title: "Open for investment.",
    body: "Get access to see full terms, documents, and the numbers behind each one.",
    open: "Open now",
  },
  benefits: {
    eyebrow: "Why private real estate",
    title: "An integral part of high-performing portfolios.",
    items: [
      {
        title: "Diversified portfolio",
        body: "Real assets move on rents and land — not on headlines.",
      },
      {
        title: "Protection against inflation",
        body: "Cash quietly loses to inflation. Buildings have historically kept pace.",
      },
      {
        title: "Steady cash flow",
        body: "Income-producing property pays you while you hold it — monthly, by design.",
      },
      {
        title: "A hedge against volatility",
        body: "Private holdings don't reprice with every market mood swing.",
      },
    ],
  },
  ways: {
    eyebrow: "Ways to invest",
    title: "Use the accounts you already have.",
    caption: "Both open funds are eligible for Canadian registered accounts.",
    previewCaption: "Account eligibility and minimums are confirmed for each available offering.",
    items: [
      { title: "Cash account", body: "Start from $2,508 in a personal or corporate account." },
      { title: "RRSP & RRIF", body: "Grow retirement savings tax-deferred with private real estate." },
      { title: "TFSA", body: "Target distributions and growth, tax-free inside your TFSA." },
      { title: "RESP & LIRA", body: "Education and locked-in accounts are eligible too." },
    ],
  },
  final: {
    eyebrow: "By access",
    title: "The door to private real estate is open.",
    body: "Join a select group of investors putting their money into real, curated Canadian real estate — with an advisory team beside them.",
  },
  footer: {
    rights: "© 2026 Hunter & Hunter Investment Advisors.",
    risk:
      "Target returns and IRRs are not guaranteed. Past performance does not predict future results, and every investment carries risk, including possible loss of principal. Review the applicable offering documents before investing.",
    dealer:
      "Securities services are provided through Parvis Investment Services Inc., an Exempt Market Dealer · NRD #74000.",
    legalLink: "Legal & privacy",
    parvisLink: "Parvis disclosures",
  },
  frames: {
    portfolio: "Your portfolio",
    detail: "Offering overview",
    performance: "Performance",
    buildings: "Buildings",
    openFunds: "Open for investment",
    targetReturn: "Target return",
    availableFunds: "Available funds",
    exampleFunds: "Product examples",
    historical: "Historical performance",
    historicalTag: "Historical—not a forecast",
    tabs: ["Overview", "Performance", "Buildings", "Documents"],
    factLabels: {
      targetReturn: "Target return",
      distribution: "Target distribution",
      minimum: "Minimum investment",
      risk: "Risk profile",
      term: "Fund term",
      aum: "Assets under management",
    },
  },
  card: {
    open: "Open now",
    targetReturn: "Target return",
    minimum: "Minimum investment",
    distribution: "Target distribution",
    portfolio: "Portfolio",
    verifiedLocations: "verified locations",
    aum: "Assets under management",
    term: "Term",
    reviewRequired: "Get access to view",
    verifiedAsOf: "Verified",
    view: "Get access to view",
    accountNote: "Full terms and documents open once you have access.",
    previewLabel: "Opportunity overview",
    keyFacts: "Key facts",
  },
};

export const LANDING_COPY: { en: LandingCopy; tr: LandingCopy } = {
  en,
  // Turkish / global translation is a later pass; alias EN for now so the
  // language toggle (currently hidden) never surfaces partial translations.
  tr: en,
};
