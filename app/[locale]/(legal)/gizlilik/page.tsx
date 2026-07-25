import type { Metadata } from "next";
import { LEGAL_DOCS } from "@/lib/mortgage/legal";
import LegalDocument from "@/components/mortgage/LegalDocument";

export const metadata: Metadata = {
  title: LEGAL_DOCS.tr.privacy.metaTitle,
};

export default function GizlilikPage() {
  return <LegalDocument docKey="privacy" />;
}
