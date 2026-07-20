import type { Metadata } from "next";
import { InvestingBridge } from "@/components/InvestingBridge";

export const metadata: Metadata = {
  title: "Canadian Private Markets | Hunter Advisory",
  description: "Continue from the Jack Hunter professional site to Hunter Advisory for a clearer view of Canadian private real estate and alternative investment opportunities.",
  robots: { index: true, follow: true },
};

export default function InvestingPage() {
  return <InvestingBridge />;
}
