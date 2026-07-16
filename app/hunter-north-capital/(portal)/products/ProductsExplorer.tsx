"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { fundHeadline, formatCurrencyCad, formatReturnPhrase, primaryShareClass } from "@/lib/capital/present";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel } from "@/components/capital/north/PortalUI";

const COPY = {
  tr: {
    eyebrow: "Yatırım çözümleri",
    title: "Fonlar",
    desc: "Partner değerlendirmesine açık Kanada özel gayrimenkul fonlarını koşulları, performansı ve portföyleriyle inceleyin.",
    review: "Detayları incele",
    manager: "Yönetici",
    strategy: "Strateji",
    minimum: "Minimum yatırım",
    target: "Hedef getiri",
    size: "Fon büyüklüğü",
    updated: "Raporlama tarihi",
    noResults: "Şu anda görüntülenecek fon bulunmuyor.",
  },
  en: {
    eyebrow: "Investment solutions",
    title: "Funds",
    desc: "Review Canadian private real-estate funds available for partner review across terms, performance, and underlying portfolios.",
    review: "Review details",
    manager: "Manager",
    strategy: "Strategy",
    minimum: "Minimum investment",
    target: "Target return",
    size: "Fund size",
    updated: "Reporting date",
    noResults: "There are no funds to show right now.",
  },
} as const;

function ProductVisual({ offering, lang }: { offering: OfferingBundle; lang: "tr" | "en" }) {
  const image = offering.media?.card?.src;
  return (
    <div className="relative aspect-[16/6] overflow-hidden bg-[#0d2d43]">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={offering.media?.card?.alt?.[lang] ?? offering.shortName[lang]} className="h-full w-full object-cover" />
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
  const c = COPY[lang];

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.desc} />

      {offerings.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {offerings.map((offering) => {
            const share = primaryShareClass(offering);
            return (
              <article key={offering.id} className="overflow-hidden rounded-md border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
                <ProductVisual offering={offering} lang={lang} />
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-[#152b3b]">{offering.shortName[lang]}</h2>
                      <p className="mt-1 text-xs text-[#75818a]">{offering.manager.name[lang]}</p>
                    </div>
                    <span className="inline-flex shrink-0 rounded border border-[#dbe1e5] bg-[#f5f7f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64727d]">
                      {c.strategy} · {taxonomyLabel(strategies, offering.strategyIds[0], lang)}
                    </span>
                  </div>
                  <p className="mt-4 min-h-12 text-sm leading-6 text-[#5f6d78]">{offering.summary[lang]}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-[#e6eaed] py-4 sm:grid-cols-4">
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.minimum}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : "—"}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.target}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{share?.targetReturn ? formatReturnPhrase(share.targetReturn.value, lang) : "—"}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.size}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{fundHeadline(offering, lang) ?? "—"}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.updated}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{offering.lastUpdated ?? offering.verifiedAt}</dd></div>
                  </dl>
                  <div className="mt-4 flex items-center justify-end gap-4">
                    <Link href={`${NORTH_BASE}/funds/${offering.slug}`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-[#0a2d46] px-3.5 text-xs font-semibold text-white hover:bg-[#123f5e]">{c.review}<ArrowRight className="size-3.5" /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Panel className="p-12 text-center text-sm text-[#6e7a84]">{c.noResults}</Panel>
      )}

    </div>
  );
}
