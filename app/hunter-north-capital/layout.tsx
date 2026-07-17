import type { Metadata } from "next";
import "./north.css";

export const metadata: Metadata = {
  title: { absolute: "Hunter North Capital" },
  description:
    "Review published Canadian private real-estate funds, understand their terms and risks, and create an account to speak with Hunter North Capital.",
  alternates: { canonical: "https://hunternorthcapital.com" },
  openGraph: {
    title: "Hunter North Capital",
    description: "Published Canadian private real-estate funds with a human-supported account and review process.",
    siteName: "Hunter North Capital",
    type: "website",
    locale: "tr_TR",
    alternateLocale: "en_CA",
  },
};

export default function HunterNorthLayout({ children }: { children: React.ReactNode }) {
  return <div className="hnc-root min-h-screen bg-[#f4f6f8]">{children}</div>;
}
