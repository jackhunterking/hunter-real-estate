"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
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
    desc: "Partner değerlendirmesine açık Kanada özel gayrimenkul fonlarını koşulları, performansı ve portföyleriyle karşılaştırın.",
    available: "Kullanılabilir",
    coming: "Yakında",
    compare: "Karşılaştır",
    comparing: "Karşılaştırılıyor",
    review: "Detayları incele",
    manager: "Yönetici",
    strategy: "Strateji",
    minimum: "Minimum yatırım",
    target: "Hedef getiri",
    size: "Fon büyüklüğü",
    updated: "Raporlama tarihi",
    clear: "Karşılaştırmayı temizle",
    compareTitle: "Fon karşılaştırması",
    noResults: "Şu anda görüntülenecek fon bulunmuyor.",
    targetDisclaimer: "Hedefler garanti değildir; resmi belgeler belirleyicidir.",
  },
  en: {
    eyebrow: "Investment solutions",
    title: "Funds",
    desc: "Compare Canadian private real-estate funds available for partner review across terms, performance, and underlying portfolios.",
    available: "Available",
    coming: "Coming soon",
    compare: "Compare",
    comparing: "Comparing",
    review: "Review details",
    manager: "Manager",
    strategy: "Strategy",
    minimum: "Minimum investment",
    target: "Target return",
    size: "Fund size",
    updated: "Reporting date",
    clear: "Clear comparison",
    compareTitle: "Fund comparison",
    noResults: "There are no funds to show right now.",
    targetDisclaimer: "Targets are not guaranteed; official documents control.",
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
  const [compareIds, setCompareIds] = useState<string[]>([]);

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return [current[1], id];
      return [...current, id];
    });
  }

  const compared = compareIds.map((id) => offerings.find((item) => item.id === id)).filter(Boolean) as OfferingBundle[];

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.desc} />

      {offerings.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {offerings.map((offering) => {
            const share = primaryShareClass(offering);
            const selected = compareIds.includes(offering.id);
            return (
              <article key={offering.id} className="overflow-hidden rounded-md border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
                <ProductVisual offering={offering} lang={lang} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-[#e9f2ec] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#2f694a]">{offering.status === "available" ? c.available : c.coming}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#76818a]">{taxonomyLabel(strategies, offering.strategyIds[0], lang)}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-[#152b3b]">{offering.shortName[lang]}</h2>
                      <p className="mt-1 text-xs text-[#75818a]">{offering.manager.name[lang]}</p>
                    </div>
                    <button type="button" onClick={() => toggleCompare(offering.id)} className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold ${selected ? "border-[#0a2d46] bg-[#0a2d46] text-white" : "border-[#d2d9de] text-[#485866] hover:border-[#0a2d46]"}`} aria-pressed={selected}>
                      {selected && <Check className="size-3.5" />} {selected ? c.comparing : c.compare}
                    </button>
                  </div>
                  <p className="mt-4 min-h-12 text-sm leading-6 text-[#5f6d78]">{offering.summary[lang]}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-[#e6eaed] py-4 sm:grid-cols-4">
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.minimum}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : "—"}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.target}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{share?.targetReturn ? formatReturnPhrase(share.targetReturn.value, lang) : "—"}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.size}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{fundHeadline(offering, lang) ?? "—"}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.updated}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{offering.lastUpdated ?? offering.verifiedAt}</dd></div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-[10px] text-[#838d95]">{c.targetDisclaimer}</p>
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

      {compared.length > 0 && (
        <Panel className="mt-7 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e2e6e9] bg-[#f7f8fa] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#193044]">{c.compareTitle}</h2>
            <button type="button" onClick={() => setCompareIds([])} className="inline-flex items-center gap-1 text-xs font-semibold text-[#60717e] hover:text-[#0a2d46]"><X className="size-3.5" />{c.clear}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <tbody>
                {[c.manager, c.strategy, c.minimum, c.target, c.size, c.updated].map((label, index) => (
                  <tr key={label} className="border-b border-[#edf0f2] last:border-0">
                    <th className="w-44 bg-[#fafbfc] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#76818a]">{label}</th>
                    {compared.map((offering) => {
                      const share = primaryShareClass(offering);
                      const values = [offering.manager.name[lang], taxonomyLabel(strategies, offering.strategyIds[0], lang), share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : "—", share?.targetReturn ? formatReturnPhrase(share.targetReturn.value, lang) : "—", fundHeadline(offering, lang) ?? "—", offering.lastUpdated ?? offering.verifiedAt];
                      return <td key={offering.id} className="px-5 py-3 font-medium text-[#32434f]">{values[index]}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
