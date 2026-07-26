import type { Metadata } from "next";
import { LegalDisclosures } from "@/components/equity-market/portal/LegalDisclosures";

export const metadata: Metadata = {
  title: "Legal Information | Equity Market",
  description: "Equity Market and Parvis registration, relationship, risk, privacy, and Canada–Türkiye cross-border disclosures.",
};

export default function EquityMarketLegalPage() {
  return <LegalDisclosures />;
}
