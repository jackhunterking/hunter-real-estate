import type { Metadata } from "next";
import "./north.css";

export const metadata: Metadata = {
  title: { absolute: "Hunter & Hunter Investment Advisory" },
  description:
    "Hunter & Hunter Investment Advisory, powered by Parvis, provides a clearer view of Canadian private real estate and alternative investments.",
  alternates: {
    canonical: "https://www.hunterhunteradvisors.com",
  },
  openGraph: {
    title: "Hunter & Hunter Investment Advisory",
    description: "Hunter & Hunter Investment Advisory, powered by Parvis, presents Canadian private-market opportunities with source-led research and a human-supported process.",
    url: "https://www.hunterhunteradvisors.com",
    siteName: "Hunter & Hunter Investment Advisory",
    type: "website",
    locale: "tr_TR",
    alternateLocale: "en_CA",
  },
};

export default function HunterNorthLayout({ children }: { children: React.ReactNode }) {
  return <div className="hnc-root min-h-screen bg-[#f4f6f8]">{children}</div>;
}
