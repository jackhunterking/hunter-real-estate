import type { Metadata } from "next";
import { HncLegal } from "@/components/capital/north/HncLegal";

export const metadata: Metadata = {
  title: "Legal Information | Hunter & Hunter Investment Advisors",
  description: "Hunter & Hunter Investment Advisors and Parvis registration, relationship, risk, privacy, and Canada–Türkiye cross-border disclosures.",
};

export default function EquityMarketLegalPage() {
  return <HncLegal />;
}
