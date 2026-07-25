import type { Metadata } from "next";
import { LEGAL_DOCS } from "@/lib/mortgage/legal";
import LegalDocument from "@/components/mortgage/LegalDocument";

export const metadata: Metadata = {
  title: LEGAL_DOCS.tr.advertising.metaTitle,
};

export default function ReklamAciklamasiPage() {
  return <LegalDocument docKey="advertising" />;
}
