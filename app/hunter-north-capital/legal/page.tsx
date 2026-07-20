import type { Metadata } from "next";
import { HncLegal } from "@/components/capital/north/HncLegal";

export const metadata: Metadata = {
  title: "Legal Information | Hunter & Hunter Investment Advisory",
  description: "Hunter & Hunter Investment Advisory and Parvis registration, relationship, risk, privacy, and Canada–Türkiye cross-border disclosures.",
};

export default function HunterNorthLegalPage() {
  return <HncLegal />;
}
