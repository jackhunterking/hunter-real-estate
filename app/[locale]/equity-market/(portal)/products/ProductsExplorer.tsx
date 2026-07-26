"use client";

import { Search } from "lucide-react";
import type { Lang, Offering, OfferingBundle } from "@/lib/equity-market/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { useTaxonomies } from "@/components/equity-market/portal/TaxonomyProvider";
import { PageHeader, Panel } from "@/components/equity-market/portal/PortalUI";
import {
  OfferingSummaryCard,
  offeringBundleCardProps,
  CARD_CTA,
} from "@/components/equity-market/OfferingSummaryCard";
import { useFundFilters } from "@/components/equity-market/portal/useFundFilters";

const COPY = {
  tr: {
    title: "Keşfet",
    desc: "Mevcut yatırım seçeneklerini, dayanak varlıklarını, koşullarını ve belgelerini inceleyin.",
    noResults: "Şu anda görüntülenecek yatırım seçeneği bulunmuyor.",
    noMatches: "Filtrelerinize uyan yatırım yok.",
    search: "Yatırım adı ara",
    all: "Tümü",
    status: "Durum",
    sort: "Sırala",
    clear: "Filtreleri temizle",
    count: (n: number) => `${n} yatırım`,
    sortOptions: {
      featured: "Öne çıkanlar",
      "return-desc": "Hedef getiri (yüksek→düşük)",
      "return-asc": "Hedef getiri (düşük→yüksek)",
      name: "Ada göre (A–Z)",
    },
    statusLabels: {
      available: "Yatırıma açık",
      "coming-soon": "Yakında",
      paused: "Duraklatıldı",
      closed: "Kapandı",
    },
  },
  en: {
    title: "Discover",
    desc: "Explore available investment options, their underlying assets, terms, and documents.",
    noResults: "There are no investment options to show right now.",
    noMatches: "No investments match your filters.",
    search: "Search investment names",
    all: "All",
    status: "Status",
    sort: "Sort",
    clear: "Clear filters",
    count: (n: number) => `${n} ${n === 1 ? "investment" : "investments"}`,
    sortOptions: {
      featured: "Featured",
      "return-desc": "Target return (high→low)",
      "return-asc": "Target return (low→high)",
      name: "Name (A–Z)",
    },
    statusLabels: {
      available: "Open for investment",
      "coming-soon": "Coming soon",
      paused: "Paused",
      closed: "Closed",
    },
  },
} as const;

const SELECT_CLASS =
  "h-9 rounded-md border border-[#ccd5db] bg-white px-2.5 text-xs font-semibold text-[#435764]";

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
  const { strategies } = useTaxonomies();
  const c = pick(COPY, lang);
  const { state, setState, filtered, facets, reset, active } = useFundFilters(offerings);

  return (
    <div>
      <PageHeader title={c.title} description={c.desc} />

      {offerings.length ? (
        <>
          {/* Filter / sort toolbar — scales the list to 20-25+ funds. */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <label className="relative flex-1 basis-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#8a949b]" />
              <input
                type="search"
                value={state.query}
                onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
                placeholder={c.search}
                className="h-9 w-full rounded-md border border-[#ccd5db] bg-white pl-8 pr-3 text-xs font-medium text-[#435764] placeholder:text-[#9aa6ad]"
              />
            </label>

            {facets.statuses.length > 1 && (
              <select aria-label={c.status} value={state.status} onChange={(e) => setState((s) => ({ ...s, status: e.target.value }))} className={SELECT_CLASS}>
                <option value="">{c.status}: {c.all}</option>
                {facets.statuses.map((st) => (
                  <option key={st} value={st}>{c.statusLabels[st as Offering["status"]] ?? st}</option>
                ))}
              </select>
            )}

            <select aria-label={c.sort} value={state.sort} onChange={(e) => setState((s) => ({ ...s, sort: e.target.value as typeof s.sort }))} className={SELECT_CLASS}>
              {(Object.keys(c.sortOptions) as (keyof typeof c.sortOptions)[]).map((key) => (
                <option key={key} value={key}>{c.sort}: {c.sortOptions[key]}</option>
              ))}
            </select>

            <span className="ml-auto text-xs font-semibold text-[#8a949b]">{c.count(filtered.length)}</span>
            {active && (
              <button type="button" onClick={reset} className="text-xs font-semibold text-[#0a4b72] hover:underline">{c.clear}</button>
            )}
          </div>

          {filtered.length ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {filtered.map((offering) => (
                <OfferingSummaryCard
                  key={offering.id}
                  lang={lang}
                  {...offeringBundleCardProps(offering, lang, strategies)}
                  cta={CARD_CTA.loggedIn(offering.slug, lang)}
                />
              ))}
            </div>
          ) : (
            <Panel className="p-12 text-center text-sm text-[#6e7a84]">{c.noMatches}</Panel>
          )}
        </>
      ) : (
        <Panel className="p-12 text-center text-sm text-[#6e7a84]">{c.noResults}</Panel>
      )}
    </div>
  );
}
