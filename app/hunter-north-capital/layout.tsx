import type { Metadata } from "next";
import "./north.css";

export const metadata: Metadata = {
  title: { absolute: "Hunter North Capital" },
  description:
    "A partner platform for Canadian private-market real estate funds, institutional materials, and client coordination.",
  alternates: { canonical: "https://hunternorthcapital.com" },
  openGraph: {
    title: "Hunter North Capital",
    description: "Canadian Private Markets Access for institutional distribution partners.",
    siteName: "Hunter North Capital",
    type: "website",
    locale: "tr_TR",
    alternateLocale: "en_CA",
  },
};

export default function HunterNorthLayout({ children }: { children: React.ReactNode }) {
  return <div className="hnc-root min-h-screen bg-[#f4f6f8]">{children}</div>;
}
