import type { Metadata } from "next";
import { TaxonomyProvider } from "@/components/capital/north/TaxonomyProvider";
import { LangBoundary } from "@/components/capital/north/LangBoundary";
import { getTaxonomies } from "@/lib/capital/taxonomies-server";
import "./north.css";

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

export default async function HunterAdvisoryLayout({ children }: { children: React.ReactNode }) {
  // Hunter & Hunter is a global-audience experience. Locale is now owned by the
  // URL (`/{locale}/hunter-advisory`) and negotiated from the visitor's device
  // language in middleware, so the portal no longer mounts its own language
  // provider — it inherits the app-wide locale. English-first entry is expressed
  // by linking to `/en/hunter-advisory`. Classification taxonomies
  // (strategy/asset class/region labels + colors) are read from Supabase and
  // provided to the subtree.
  const taxonomies = await getTaxonomies();
  return (
    <TaxonomyProvider value={taxonomies}>
      <LangBoundary>{children}</LangBoundary>
    </TaxonomyProvider>
  );
}
