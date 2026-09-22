import type { Metadata } from "next";
import { toLang } from "@/i18n/routing";
import { dictionaries } from "@/lib/i18n/dictionaries";
import SaticiClient from "./SaticiClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = dictionaries[toLang(locale)].satici;
  return { title: t.metaTitle, description: t.metaDesc };
}

export default function SaticiRehber() {
  return <SaticiClient />;
}
