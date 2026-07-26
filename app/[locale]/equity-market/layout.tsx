import type { Metadata } from "next";
import { TaxonomyProvider } from "@/components/equity-market/portal/TaxonomyProvider";
import { LangBoundary } from "@/components/equity-market/portal/LangBoundary";
import { EntryDisclaimer } from "@/components/equity-market/portal/EntryDisclaimer";
import { getTaxonomies } from "@/lib/equity-market/taxonomies-server";
import "./portal.css";

// NEXT_PUBLIC_HNC_SITE_URL is the previous name; read both until the Vercel
// environment is cut over, then drop the fallback.
const PORTAL_URL = (
  process.env.NEXT_PUBLIC_PORTAL_SITE_URL ??
  process.env.NEXT_PUBLIC_HNC_SITE_URL ??
  "https://equitymarket.io"
).replace(/\/$/, "");

export const metadata: Metadata = {
  title: { absolute: "Equity Market" },
  description:
    "Equity Market, powered by Parvis, provides a clearer view of Canadian private real estate and alternative investments.",
  alternates: {
    canonical: PORTAL_URL,
  },
  // The root layout points the favicon at the real-estate brandmark for the
  // whole site; the portal is a different brand and overrides it here.
  icons: { icon: [{ url: "/logos/equity-market-mark.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "Equity Market",
    description: "Equity Market, powered by Parvis, presents Canadian private-market opportunities with source-led research and a human-supported process.",
    url: PORTAL_URL,
    siteName: "Equity Market",
    type: "website",
    // English-first: this is a global-audience product, not a Turkish one.
    locale: "en_CA",
    alternateLocale: ["tr_TR", "fr_CA", "es_ES"],
    // The card itself comes from ./opengraph-image.tsx, which Next wires into
    // openGraph.images automatically.
  },
};

export default async function EquityMarketLayout({ children }: { children: React.ReactNode }) {
  // Equity Market is a global-audience experience. Locale is now owned by the
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
