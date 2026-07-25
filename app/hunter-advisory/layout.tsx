import type { Metadata } from "next";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
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
  // Hunter & Hunter is a global-audience experience with its own persisted
  // language key (independent of the Turkish-first main site). It defaults to
  // English but auto-detects the visitor's browser language on first visit, so
  // Turkish viewers (e.g. discovering us from Instagram in Turkey) land in
  // Turkish. The header language dropdown lets anyone switch, and that choice
  // is remembered. Classification taxonomies (strategy/asset class/region
  // labels + colors) are read from Supabase and provided to both trees.
  const taxonomies = await getTaxonomies();
  return (
    <LanguageProvider
      defaultLang="en"
      storageKey="hunter-advisory-lang"
      autoDetect
      detectLangs={["tr", "en"]}
    >
      <TaxonomyProvider value={taxonomies}>
        <LangBoundary>{children}</LangBoundary>
      </TaxonomyProvider>
    </LanguageProvider>
  );
}
