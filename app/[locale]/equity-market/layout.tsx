import type { Metadata } from "next";
import { TaxonomyProvider } from "@/components/equity-market/portal/TaxonomyProvider";
import { LangBoundary } from "@/components/equity-market/portal/LangBoundary";
import { EntryDisclaimer } from "@/components/equity-market/portal/EntryDisclaimer";
import { getTaxonomies } from "@/lib/equity-market/taxonomies-server";
import "./portal.css";

export const metadata: Metadata = {
  title: { absolute: "Hunter & Hunter Investment Advisors" },
  description:
    "Hunter & Hunter Investment Advisors, powered by Parvis, provides a clearer view of Canadian private real estate and alternative investments.",
  alternates: {
    canonical: "https://www.hunterhunteradvisors.com",
  },
  openGraph: {
    title: "Hunter & Hunter Investment Advisors",
    description: "Hunter & Hunter Investment Advisors, powered by Parvis, presents Canadian private-market opportunities with source-led research and a human-supported process.",
    url: "https://www.hunterhunteradvisors.com",
    siteName: "Hunter & Hunter Investment Advisors",
    type: "website",
    locale: "tr_TR",
    alternateLocale: "en_CA",
  },
};

export default async function EquityMarketLayout({ children }: { children: React.ReactNode }) {
  // Hunter & Hunter is a global-audience experience. Locale is now owned by the
  // URL (`/{locale}/equity-market`) and negotiated from the visitor's device
  // language in middleware, so the portal no longer mounts its own language
  // provider — it inherits the app-wide locale. English-first entry is expressed
  // by linking to `/en/equity-market`. Classification taxonomies
  // (strategy/asset class/region labels + colors) are read from Supabase and
  // provided to the subtree.
  const taxonomies = await getTaxonomies();
  return (
    <TaxonomyProvider value={taxonomies}>
      {/* Scoped to the advisory subtree on purpose: this is a securities
          notice, and the real-estate site at jackhunter.com is a different
          business that it would only confuse. */}
      <EntryDisclaimer />
      <LangBoundary>{children}</LangBoundary>
    </TaxonomyProvider>
  );
}
