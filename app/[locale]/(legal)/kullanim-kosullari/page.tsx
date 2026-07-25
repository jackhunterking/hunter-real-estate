import type { Metadata } from "next";
import { LEGAL_DOCS } from "@/lib/mortgage/legal";
import LegalDocument from "@/components/mortgage/LegalDocument";

export const metadata: Metadata = {
  title: LEGAL_DOCS.tr.terms.metaTitle,
};

export default function KullanimKosullariPage() {
  return <LegalDocument docKey="terms" />;
}
