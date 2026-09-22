import type { Metadata } from "next";
import { toLang } from "@/i18n/routing";
import { dictionaries } from "@/lib/i18n/dictionaries";
import ThankYouLayout from "@/components/ThankYouLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = dictionaries[toLang(locale)].saticiThanks;
  return { title: t.metaTitle, description: t.metaDesc };
}

export default function SaticiTesekkur() {
  return (
    <ThankYouLayout
      guideType="satici"
      guidePdfPath="/guides/ev-satma-rehberi.pdf"
    />
  );
}
