"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Search } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import type { LearningResourceSummary } from "@/lib/capital/learning";
import { learningCategoryLabel } from "@/lib/capital/learning";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { NORTH_BASE } from "./NorthBrand";
import { PageHeader } from "./PortalUI";

const COPY = {
  en: {
    title: "Learning centre",
    description: "Clear, source-based guides for understanding real estate strategies, terms and investment decisions. Educational information only—not personalized advice.",
    featured: "Featured guide",
    search: "Search guides",
    empty: "No published guides are available yet.",
    noResults: "No guides match your search.",
    read: "Read guide",
    minutes: "min read",
    reviewed: "Reviewed",
  },
  tr: {
    title: "Bilgi merkezi",
    description: "Gayrimenkul stratejilerini, terimleri ve yatırım kararlarını anlamaya yönelik açık ve kaynaklı rehberler. Yalnızca eğitim amaçlıdır; kişisel tavsiye değildir.",
    featured: "Öne çıkan rehber",
    search: "Rehberlerde ara",
    empty: "Henüz yayımlanmış rehber bulunmuyor.",
    noResults: "Aramanızla eşleşen rehber bulunamadı.",
    read: "Rehberi oku",
    minutes: "dk okuma",
    reviewed: "İnceleme",
  },
} as const;

function formatDate(value: string, lang: "en" | "tr") {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function LearningLibrary({ resources }: { resources: LearningResourceSummary[] }) {
  const { lang } = useLang();
  const posthog = usePostHog();
  const c = COPY[lang];
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-CA");
  const visible = useMemo(() => resources.filter((resource) => {
    if (!normalized) return true;
    return `${resource.title[lang]} ${resource.summary[lang]}`
      .toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-CA")
      .includes(normalized);
  }), [lang, normalized, resources]);

  function recordSearch() {
    if (!normalized) return;
    posthog?.capture("hnc_learning_search_used", { language: lang, query_length: normalized.length });
  }

  return <div>
    <PageHeader title={c.title} description={c.description} />
    {resources.length > 0 && <div className="mb-5 flex justify-end">
      <label className="relative block w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b8992]" />
        <span className="sr-only">{c.search}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={recordSearch}
          onKeyDown={(event) => { if (event.key === "Enter") recordSearch(); }}
          placeholder={c.search}
          className="h-11 w-full rounded-md border border-[#d5dde2] bg-white pl-10 pr-3 text-sm text-[#223d4e] outline-none focus:border-[#0a4b72] focus:ring-2 focus:ring-[#0a4b72]/15"
        />
      </label>
    </div>}

    {!resources.length ? <EmptyState text={c.empty} /> : !visible.length ? <EmptyState text={c.noResults} /> : <div className="grid gap-5 xl:grid-cols-2">
      {visible.map((resource, index) => {
        const category = learningCategoryLabel(resource.categoryKey)[lang];
        return <article key={resource.id} className="group relative overflow-hidden rounded-lg border border-[#d8e0e4] bg-white shadow-[0_1px_2px_rgba(8,34,52,0.04)]">
          <div className="h-1.5 bg-gradient-to-r from-[#c6a44b] via-[#e1c56f] to-[#0a4b72]" />
          <div className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a6d24]">
                <BookOpen className="size-4" />{index === 0 ? c.featured : category}
              </span>
              {index === 0 && <span className="rounded-full bg-[#eef4f7] px-2.5 py-1 text-[10px] font-semibold text-[#42677b]">{category}</span>}
            </div>
            <h2 className="mt-5 max-w-2xl font-serif text-2xl font-semibold leading-tight text-[#102c3f] sm:text-[1.75rem]">{resource.title[lang]}</h2>
            <p className="mt-3 text-sm leading-6 text-[#5a6c77]">{resource.summary[lang]}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e7ecef] pt-4 text-xs text-[#72808a]">
              <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{resource.readingMinutes[lang]} {c.minutes}</span>
              <span>{c.reviewed}: {formatDate(resource.reviewedAt, lang)}</span>
            </div>
            <Link href={`${NORTH_BASE}/resources/learning/${resource.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0a4b72] after:absolute after:inset-0">
              {c.read}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </article>;
      })}
    </div>}
  </div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[#cbd6dc] bg-white px-6 py-16 text-center">
    <BookOpen className="mx-auto size-8 text-[#8da0ab]" />
    <p className="mt-3 text-sm text-[#657681]">{text}</p>
  </div>;
}
