import type { Metadata } from "next";
import { HncLegal } from "@/components/capital/north/HncLegal";

export const metadata: Metadata = {
  title: "Legal Information | Hunter North Capital",
  description: "Hunter North Capital platform, offering-material, privacy, and cross-border disclosures.",
};

export default function HunterNorthLegalPage() {
  return <HncLegal />;
}
