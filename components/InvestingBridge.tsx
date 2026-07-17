"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

const HNC_URL = process.env.NEXT_PUBLIC_HNC_SITE_URL ?? "https://hunternorthcapital.com";

const COPY = {
  tr: {
    eyebrow: "Özel piyasalar geçişi",
    title: "Hunter North Capital ayrı bir platformdur.",
    body: "Jack Hunter sitesi gayrimenkul ve mortgage danışmanlığına odaklanır. Fon araştırması, hesap oluşturma ve ilgi talepleri kontrollü Hunter North Capital ortamında sunulur.",
    points: ["Yalnızca onaylanmış ve yayımlanmış fon bilgileri", "Avantajlarla birlikte riskler, likidite ve kaynak tarihleri", "Çevrimiçi satın alma veya ödeme yok; sonraki adım insan destekli inceleme"],
    continue: "Hunter North Capital'a devam et",
    back: "Jack Hunter'a dön",
    disclosure: "Devam ettiğinizde farklı bir marka ve platforma geçersiniz. Hesap açmak uygunluk, yerindelik veya yatırım onayı oluşturmaz.",
  },
  en: {
    eyebrow: "Private-markets transition",
    title: "Hunter North Capital is a separate platform.",
    body: "The Jack Hunter site focuses on real estate and mortgage guidance. Fund research, account creation, and interest requests are provided in the controlled Hunter North Capital environment.",
    points: ["Only approved and published fund information", "Risks, liquidity, and source dates presented alongside potential advantages", "No online purchase or payment; the next step is a human-assisted review"],
    continue: "Continue to Hunter North Capital",
    back: "Return to Jack Hunter",
    disclosure: "You are continuing to a separate brand and platform. Creating an account does not establish eligibility, suitability, or investment approval.",
  },
} as const;

export function InvestingBridge() {
  const { lang } = useLang();
  const c = COPY[lang];
  return (
    <main className="min-h-screen bg-[#071c2c] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <section className="w-full overflow-hidden border border-white/15 bg-[#0a2539] shadow-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 sm:p-12 lg:p-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8bf7a]">{c.eyebrow}</p>
            <h1 className="mt-5 max-w-xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">{c.title}</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/68">{c.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={HNC_URL} className="inline-flex h-12 items-center gap-2 bg-[#d8bf7a] px-5 text-sm font-bold text-[#071c2c]">{c.continue}<ExternalLink className="size-4" /></a>
              <Link href="/" className="inline-flex h-12 items-center gap-2 border border-white/20 px-5 text-sm font-semibold"><ArrowLeft className="size-4" />{c.back}</Link>
            </div>
          </div>
          <aside className="border-t border-white/12 bg-[#f5f1e7] p-7 text-[#1e3545] sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <ShieldCheck className="size-8 text-[#8f7030]" />
            <div className="mt-8 space-y-6">{c.points.map((point, index) => <div key={point} className="flex gap-4 border-b border-[#d8d1c2] pb-6 last:border-0"><span className="font-serif text-xl text-[#9b7b32]">0{index + 1}</span><p className="text-sm leading-7 text-[#50616c]">{point}</p></div>)}</div>
            <p className="mt-8 text-xs leading-6 text-[#6e777c]">{c.disclosure}</p>
            <a href={HNC_URL} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0a4b72]">{c.continue}<ArrowRight className="size-4" /></a>
          </aside>
        </section>
      </div>
    </main>
  );
}
