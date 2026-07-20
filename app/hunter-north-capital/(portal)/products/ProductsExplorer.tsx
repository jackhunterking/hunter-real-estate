"use client";

import Link from "next/link";
import type { Lang } from "@/lib/capital/types";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel } from "@/components/capital/north/PortalUI";

const COPY = {
  tr: {
    title: "Keşfet",
    desc: "Mevcut yatırım seçeneklerini, dayanak varlıklarını, koşullarını ve belgelerini inceleyin.",
    review: "Detayları incele",
    manager: "Yönetici",
    audited: "Bağımsız denetimli",
    noResults: "Şu anda görüntülenecek yatırım seçeneği bulunmuyor.",
  },
  en: {
    title: "Discover",
    desc: "Explore available investment options, their underlying assets, terms, and documents.",
    review: "Review details",
    manager: "Manager",
    audited: "Independently audited",
    noResults: "There are no investment options to show right now.",
  },
} as const;

export function OfferingVisual({ offering, lang }: { offering: OfferingBundle; lang: Lang }) {
  const image = offering.media?.card?.src;
  return (
    <div className="relative aspect-[60/13] overflow-hidden bg-[#0d2d43]">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={tx(offering.media?.card?.alt, lang) ?? tx(offering.shortName, lang)} className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/75 via-[#071c2c]/15 to-transparent" />
      {offering.media?.logo?.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={offering.media.logo.src} alt="" className="absolute bottom-4 left-4 h-10 max-w-28 rounded bg-white object-contain p-1.5 shadow-sm" />
      )}
    </div>
  );
}

export function ProductsExplorer({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const c = pick(COPY, lang);

  return (
    <div>
      <PageHeader title={c.title} description={c.desc} />

      {offerings.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {offerings.map((offering) => (
            <article key={offering.id} className="flex flex-col overflow-hidden rounded-md border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
              <OfferingVisual offering={offering} lang={lang} />
              <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[#152b3b]">{tx(offering.name, lang)}</h2>
                  <p className="mt-1 text-xs text-[#75818a]">{tx(offering.manager.name, lang)}</p>
                </div>
                <div className="mt-3 flex flex-1 flex-col justify-between gap-4 sm:min-h-12 sm:flex-row sm:items-end">
                  <p className="max-w-2xl text-sm leading-5 text-[#5f6d78]">{tx(offering.summary, lang)}</p>
                  <Link href={`${NORTH_BASE}/funds/${offering.slug}`} className="inline-flex h-9 shrink-0 self-start items-center gap-1.5 rounded-md bg-[#0a2d46] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#123f5e] sm:self-auto">{c.review}<ArrowRight className="size-3.5" /></Link>
                </div>
                {offering.serviceProviders?.auditor && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3f7a58]"><ShieldCheck className="size-3.5" />{c.audited}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Panel className="p-12 text-center text-sm text-[#6e7a84]">{c.noResults}</Panel>
      )}

    </div>
  );
}
