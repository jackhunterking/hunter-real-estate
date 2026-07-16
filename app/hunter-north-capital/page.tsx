"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Globe2, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";

const COPY = {
  tr: {
    eyebrow: "Kurumsal partner platformu",
    title: "Kanada özel piyasalarına daha düzenli bir erişim.",
    body: "Hunter North Capital, lisanslı firmaların Kanada gayrimenkul fonlarını incelemesi, belgeleri karşılaştırması ve müşteri tanıştırmalarını koordine etmesi için tasarlanmıştır.",
    enter: "Giriş yap",
    create: "Yatırımcı hesabı oluştur",
    preview: "Portal önizlemesi",
    features: [
      ["Fon inceleme", "Koşullar, performans, varlıklar ve resmi belgeler."],
      ["Müşteri takibi", "Müşteri kayıtları, yıllık sermaye ve seviye ilerlemesi."],
      ["Sınır ötesi süreç", "Lisanslı incelemeye kadar açık sorumluluk ayrımı."],
    ],
    legal: "Bu platform yatırım tavsiyesi veya fon erişim onayı sağlamaz. Fon erişimi, uygunluk ve yerindelik ilgili lisanslı sürece tabidir.",
  },
  en: {
    eyebrow: "Institutional partner platform",
    title: "A more structured path to Canadian private markets.",
    body: "Hunter North Capital is designed for licensed firms to review Canadian real-estate funds, compare materials, and coordinate client introductions.",
    enter: "Sign in",
    create: "Create investor account",
    preview: "Portal preview",
    features: [
      ["Fund review", "Terms, performance, assets, and official documents."],
      ["Client tracking", "Client records, annual capital, and tier progress."],
      ["Cross-border process", "Clear ownership through the licensed review stage."],
    ],
    legal: "This platform does not provide investment advice or fund-access approval. Fund access, eligibility, and suitability remain subject to the applicable licensed process.",
  },
} as const;

const ICONS = [Building2, FileCheck2, ShieldCheck];

export default function HunterNorthAccessPage() {
  const { lang, setLang } = useLang();
  const c = COPY[lang];

  return (
    <main className="min-h-screen bg-[#071c2c] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Image src="/logos/HUNTER_Brandmark_Gold.png" alt="" width={48} height={48} className="size-10 object-contain" priority />
            <div className="leading-none">
              <span className="block text-base font-semibold">Hunter North</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#d8bf7a]">Capital</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe2 className="hidden size-4 text-white/45 sm:block" />
            <div className="flex rounded-md border border-white/15 p-0.5" role="group" aria-label="Language">
              {(["tr", "en"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLang(item)}
                  className={`h-7 rounded px-2.5 text-[11px] font-bold uppercase ${lang === item ? "bg-white text-[#071c2c]" : "text-white/60"}`}
                  aria-pressed={lang === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:py-16">
          <section className="max-w-3xl">
            <div className="mb-7"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">{c.eyebrow}</span></div>
            <h1 className="max-w-3xl font-serif text-[clamp(2.5rem,6vw,5.6rem)] font-semibold leading-[0.98] text-white">
              {c.title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/67 sm:text-lg">{c.body}</p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-white/12 bg-white/12 sm:grid-cols-3">
              {c.features.map(([title, body], index) => {
                const Icon = ICONS[index];
                return (
                  <div key={title} className="bg-[#0a2539] p-5">
                    <Icon className="size-5 text-[#d8bf7a]" />
                    <h2 className="mt-5 text-sm font-semibold">{title}</h2>
                    <p className="mt-2 text-xs leading-5 text-white/52">{body}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="rounded-md border border-white/15 bg-white p-7 text-[#17202b] shadow-2xl shadow-black/20 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#79838c]">Hunter North Capital</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-[#0a2d46]">{c.enter}</h2>
            <Link
              href={`${NORTH_BASE}/sign-in`}
              className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8bf7a] focus-visible:ring-offset-2"
            >
              {c.enter} <ArrowRight className="size-4" />
            </Link>
            <Link
              href={`${NORTH_BASE}/sign-up`}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-md border border-[#cfd7dc] px-4 text-sm font-semibold text-[#334550] hover:border-[#0a2d46]"
            >
              {c.create}
            </Link>
            <Link href={`${NORTH_BASE}/dashboard`} className="mt-4 block text-center text-xs font-semibold text-[#0a4b72] hover:underline">
              {c.preview}
            </Link>
            <p className="mt-7 border-t border-[#e6e9ec] pt-5 text-[11px] leading-5 text-[#7a838b]">{c.legal}</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
