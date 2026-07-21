import type { Metadata } from "next";
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

export default function HunterAdvisoryLayout({ children }: { children: React.ReactNode }) {
  return <div className="hnc-root min-h-screen bg-[#f4f6f8]">{children}</div>;
}
