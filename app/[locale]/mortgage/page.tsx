import type { Metadata } from "next";
import { toLang } from "@/i18n/routing";
import { dictionaries } from "@/lib/i18n/dictionaries";
import MortgageClient from "./MortgageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = dictionaries[toLang(locale)].mortgage;
  return { title: t.metaTitle, description: t.metaDesc };
}

export default function MortgagePage() {
  return <MortgageClient />;
}
