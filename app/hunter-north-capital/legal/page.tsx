import type { Metadata } from "next";
import { HncLegal } from "@/components/capital/north/HncLegal";

export const metadata: Metadata = {
  title: "Legal Information | Hunter Advisory",
  description: "Hunter Advisory platform, offering-material, privacy, and Canada–Türkiye cross-border disclosures.",
};

export default function HunterNorthLegalPage() {
  return <HncLegal />;
}
