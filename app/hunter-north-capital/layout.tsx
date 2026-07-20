import type { Metadata } from "next";
import "./north.css";

export const metadata: Metadata = {
  title: { absolute: "Hunter Advisory" },
  description:
    "A clearer view of Canadian private real estate and alternative investments for investors in Türkiye.",
  openGraph: {
    title: "Hunter Advisory",
    description: "Canadian private real estate and alternative investments, presented with source-led research and a human-supported process.",
    siteName: "Hunter Advisory",
    type: "website",
    locale: "tr_TR",
    alternateLocale: "en_CA",
  },
};

export default function HunterNorthLayout({ children }: { children: React.ReactNode }) {
  return <div className="hnc-root min-h-screen bg-[#f4f6f8]">{children}</div>;
}
