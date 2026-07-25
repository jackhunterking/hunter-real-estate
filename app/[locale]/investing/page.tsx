import type { Metadata } from "next";
import { InvestingBridge } from "@/components/InvestingBridge";

export const metadata: Metadata = {
  title: "Canadian Private Markets | Hunter & Hunter Investment Advisors",
  description: "Continue from the Jack Hunter professional site to Hunter & Hunter Investment Advisors, powered by Parvis, for Canadian private-market opportunities.",
  robots: { index: true, follow: true },
};

export default function InvestingPage() {
  return <InvestingBridge />;
}
