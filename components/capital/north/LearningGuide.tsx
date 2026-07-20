"use client";

import { useEffect } from "react";
import type { Lang } from "@/lib/capital/types";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePostHog } from "posthog-js/react";
import type { LearningResourceDetail } from "@/lib/capital/learning";
import { learningCategoryLabel } from "@/lib/capital/learning";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { NORTH_BASE } from "./NorthBrand";

const COPY = {
  en: { back: "Learning centre", contents: "In this guide", minutes: "min read", reviewed: "Reviewed", sources: "Sources and further reading", accessed: "Accessed", related: "Related tool", relatedTitle: "Check your investor category", relatedBody: "Use the preliminary qualification tool to understand the Canadian financial category indicated by your answers.", open: "Open qualification", version: "Version" },
  tr: { back: "Bilgi merkezi", contents: "Bu rehberde", minutes: "dk okuma", reviewed: "İnceleme", sources: "Kaynaklar ve ek okuma", accessed: "Erişim", related: "İlgili araç", relatedTitle: "Yatırımcı kategorinizi kontrol edin", relatedBody: "Yanıtlarınızın işaret ettiği Kanada finansal kategorisini anlamak için ön yeterlilik aracını kullanın.", open: "Yeterlilik aracını aç", version: "Sürüm" },
} as const;

function anchor(value: string) {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function headings(markdown: string) {
  return [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => ({ title: match[1].trim(), id: anchor(match[1]) }));
}

function formatDate(value: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-CA", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

export function LearningGuide({ resource }: { resource: LearningResourceDetail }) {
  const { lang } = useLang();
  const posthog = usePostHog();
  const c = pick(COPY, lang);
  const body = tx(resource.bodyMarkdown, lang);
  const contents = headings(body);
  const category = tx(learningCategoryLabel(resource.categoryKey), lang);

  useEffect(() => {
    posthog?.capture("hnc_learning_guide_opened", { slug: resource.slug, version: resource.version, language: lang });
  }, [lang, posthog, resource.slug, resource.version]);

  return <article className="mx-auto max-w-5xl">
    <Link href={`${NORTH_BASE}/resources/learning`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#496779] hover:text-[#0a4b72]"><ArrowLeft className="size-4" />{c.back}</Link>
    <header className="mt-5 overflow-hidden rounded-xl bg-[#08263a] text-white shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-[#c6a44b] via-[#efd681] to-[#4f8aa9]" />
      <div className="relative px-6 py-9 sm:px-10 sm:py-12">
        <div className="absolute -right-24 -top-28 size-72 rounded-full border border-white/10 bg-white/[0.025]" />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.14em] text-[#e3c66f]">{category}</p>
        <h1 className="relative mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">{tx(resource.title, lang)}</h1>
        <p className="relative mt-4 max-w-3xl text-sm leading-6 text-[#d1e0e8] sm:text-base">{tx(resource.summary, lang)}</p>
        <div className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#afc5d1]">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{lang === "tr" ? resource.readingMinutes.tr : resource.readingMinutes.en} {c.minutes}</span>
          <span>{c.reviewed}: {formatDate(resource.reviewedAt, lang)}</span>
          <span>{c.version}: {resource.version}</span>
        </div>
      </div>
    </header>

    <div className="mt-7 grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <aside className="rounded-lg border border-[#dce4e8] bg-white p-5 lg:sticky lg:top-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7d8991]">{c.contents}</p>
        <ol className="mt-3 list-none space-y-2.5">
          {contents.map((item, index) => <li key={item.id}><a href={`#${item.id}`} className="flex gap-2 text-xs leading-5 text-[#5c707c] hover:text-[#0a4b72]"><span className="text-[#b08a2c]">{String(index + 1).padStart(2, "0")}</span>{item.title}</a></li>)}
        </ol>
      </aside>

      <div className="min-w-0 rounded-lg border border-[#dce4e8] bg-white px-5 py-7 shadow-[0_1px_2px_rgba(8,34,52,0.03)] sm:px-8 sm:py-9">
        <div className="learning-markdown text-[15px] leading-7 text-[#344d5b]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <h2 id={anchor(String(children))} className="mb-4 mt-10 scroll-mt-6 font-serif text-2xl font-semibold leading-tight text-[#143247] first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-3 mt-8 text-lg font-semibold text-[#18384e]">{children}</h3>,
              p: ({ children }) => <p className="my-4">{children}</p>,
              ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 marker:text-[#b08a2c]">{children}</ul>,
              ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-[#8a6d24]">{children}</ol>,
              blockquote: ({ children }) => <blockquote className="my-6 rounded-r-md border-l-4 border-[#c4a247] bg-[#faf7ed] px-5 py-3 text-[#4f4a38]">{children}</blockquote>,
              table: ({ children }) => <div className="my-7 overflow-x-auto rounded-md border border-[#dbe3e7]"><table className="w-full min-w-[760px] border-collapse text-left text-xs leading-5">{children}</table></div>,
              thead: ({ children }) => <thead className="bg-[#0a2d46] text-white">{children}</thead>,
              th: ({ children }) => <th className="border-r border-white/10 px-3 py-3 font-semibold last:border-r-0">{children}</th>,
              td: ({ children }) => <td className="border-b border-r border-[#e3e8eb] px-3 py-3 align-top last:border-r-0">{children}</td>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer noopener" className="font-semibold text-[#0a4b72] underline decoration-[#9ebdcd] underline-offset-2">{children}</a>,
              strong: ({ children }) => <strong className="font-semibold text-[#1d3a4d]">{children}</strong>,
            }}
          >{body}</ReactMarkdown>
        </div>

        <section className="mt-10 border-t border-[#e2e7ea] pt-7" aria-labelledby="learning-sources">
          <h2 id="learning-sources" className="font-serif text-2xl font-semibold text-[#143247]">{c.sources}</h2>
          <ol className="mt-4 list-none space-y-3">
            {resource.sources.map((source) => <li key={source.id} className="rounded-md bg-[#f5f7f8] px-4 py-3 text-sm text-[#4d626f]">
              <a href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 font-semibold text-[#0a4b72]">{source.title}<ExternalLink className="size-3.5" /></a>
              <p className="mt-1 text-xs text-[#74828b]">{source.publisher}{source.publishedOn ? ` · ${source.publishedOn}` : ""} · {c.accessed}: {source.accessedAt}</p>
            </li>)}
          </ol>
        </section>

        <div className="mt-7 flex items-start gap-3 rounded-md border border-[#d7e1e6] bg-[#f1f6f8] p-4 text-xs leading-5 text-[#526b78]">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#0a4b72]" /><p>{tx(resource.disclaimer, lang)}</p>
        </div>
      </div>
    </div>

    <aside className="mt-7 rounded-lg border border-[#d8e0e4] bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#eef4f7] text-[#0a4b72]"><BookOpen className="size-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6d24]">{c.related}</p><h2 className="mt-1 text-lg font-semibold text-[#18384e]">{c.relatedTitle}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#61737e]">{c.relatedBody}</p></div></div>
      <Link href={`${NORTH_BASE}/resources/investor-readiness`} className="mt-5 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white sm:mt-0">{c.open}<ArrowRight className="size-4" /></Link>
    </aside>
  </article>;
}
