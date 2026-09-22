import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toLang } from "@/i18n/routing";
import { dictionaries } from "@/lib/i18n/dictionaries";

// Unmatched paths under a locale land here so they render the localized
// app/[locale]/not-found.tsx (inside the locale layout) instead of Next's
// bare root 404. The title is set here because Next ignores metadata exported
// from not-found.tsx itself.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: dictionaries[toLang(locale)].notFound.metaTitle };
}

export default function CatchAllPage() {
  notFound();
}
