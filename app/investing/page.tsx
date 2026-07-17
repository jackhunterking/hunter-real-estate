import type { Metadata } from "next";
import { InvestingBridge } from "@/components/InvestingBridge";

export const metadata: Metadata = {
  title: "Private Markets | Hunter North Capital",
  description: "Continue from the Jack Hunter professional site to the separate Hunter North Capital private-markets platform.",
  robots: { index: true, follow: true },
};

export default function InvestingPage() {
  return <InvestingBridge />;
}
