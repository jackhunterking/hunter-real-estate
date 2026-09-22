import type { Metadata } from "next";
import { toLang } from "@/i18n/routing";
import { pick } from "@/lib/i18n/localize";
import { LEGAL_DOCS } from "@/lib/mortgage/legal";
import LegalDocument from "@/components/mortgage/LegalDocument";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: pick(LEGAL_DOCS, toLang(locale)).terms.metaTitle };
}

export default function KullanimKosullariPage() {
  return <LegalDocument docKey="terms" />;
}
