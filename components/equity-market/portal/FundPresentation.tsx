"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, X } from "lucide-react";
import type { OfferingBundle } from "@/lib/equity-market/types";
import { FundMapEmbed } from "@/components/equity-market/map/FundMapEmbed";
import { formatCurrencyCad, riskText } from "@/lib/equity-market/present";
import { allPublishedFacts, investorFacts } from "@/lib/equity-market/key-facts";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { tx } from "@/lib/i18n/localize";
import { investmentBrandFor } from "@/lib/equity-market/investment-brand";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";

export function FundPresentation({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const brand = investmentBrandFor(lang);
  const [copied, setCopied] = useState(false);
  const share = offering.shareClasses[0];
  // This deck is shared with clients (it offers a sign-in-required link), so it
  // applies the same audience gate as the investment page: dealer-compensation
  // facts stay in the Offering Memorandum and the advisor view.
  const definedFacts = investorFacts(allPublishedFacts(offering, share), share?.id);
  const labels = lang === "tr" ? {
    presentation: "Yatırım sunumu", copy: "Giriş gerektiren bağlantıyı kopyala", copied: "Kopyalandı", close: "Sunumu kapat",
    owns: "Yatırımın dayanak binaları", terms: "Seçili pay sınıfı koşulları", risks: "Önemli riskler",
    target: "Yayımlanan hedef", distribution: "Yayımlanan dağıtım hedefi", minimum: "Minimum yatırım", redemption: "Erken çıkış ve para çekme koşulları",
  } : {
    presentation: "Investment presentation", copy: "Copy sign-in-required link", copied: "Copied", close: "Close presentation",
    owns: "The investment's underlying buildings", terms: "Selected share-class conditions", risks: "Material risks",
    target: "Published target", distribution: "Published distribution target", minimum: "Minimum investment", redemption: "Early-exit and withdrawal conditions",
  };

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f5f7f8] text-[#193143]">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09283d] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">{brand.name} · {labels.presentation}</p><p className="mt-1 text-sm font-semibold">{tx(offering.shortName, lang)}</p></div>
        <div className="flex items-center gap-2"><button type="button" onClick={copyLink} className="inline-flex h-9 items-center gap-2 rounded-md border border-white/20 px-3 text-xs font-semibold hover:bg-white/10">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}<span className="hidden sm:inline">{copied ? labels.copied : labels.copy}</span></button><Link href={`${INVESTMENT_BASE_PATH}/investments/${offering.slug}`} aria-label={labels.close} className="grid size-9 place-items-center rounded-md border border-white/20 hover:bg-white/10"><X className="size-4" /></Link></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
      <section className="grid items-end gap-6 rounded-2xl bg-[#0b2d43] p-6 text-white sm:p-10 lg:grid-cols-[1fr_0.7fr]">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d8bd79]">{tx(offering.manager.name, lang)}</p><h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{tx(offering.name, lang)}</h1><p className="mt-5 max-w-3xl text-base leading-7 text-white/75">{tx(offering.summary, lang)}</p></div>
        <div className="grid grid-cols-2 gap-3">{offering.portfolioFacts.slice(0, 4).map((fact) => <div key={`${fact.sourceId}-${fact.value}`} className="rounded-xl bg-white/8 p-4"><p className="text-xl font-semibold">{String(fact.value)}</p><p className="mt-1 text-[10px] text-white/55">{fact.sourceId} · {fact.asOfDate}</p></div>)}</div>
      </section>

      <section><h2 className="mb-3 text-2xl font-semibold">{labels.owns}</h2><FundMapEmbed offering={offering} /></section>

      <section>
        <div className="rounded-xl border border-[#dce3e7] bg-white p-6"><h2 className="text-xl font-semibold">{labels.terms}</h2><dl className="mt-4 divide-y divide-[#e8ecee] text-sm">{definedFacts.map((fact) => <div key={fact.id} className="py-3"><dt className="text-[#6b7982]">{tx(fact.label, lang)}</dt><dd className="mt-1 font-semibold leading-6">{tx(fact.value, lang)}</dd><span className="mt-1 block text-[10px] text-[#87929a]">{fact.sourceId} · {fact.effectiveDate}</span></div>)}{!definedFacts.some((fact) => fact.category === "target") && share?.targetReturn && <div className="py-3"><dt className="text-[#6b7982]">{labels.target}</dt><dd className="mt-1 font-semibold">{share.targetReturn.value}</dd></div>}<div className="py-3"><dt className="text-[#6b7982]">{labels.minimum}</dt><dd className="mt-1 font-semibold">{share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : "—"}</dd></div>{!definedFacts.some((fact) => fact.category === "early-exit") && <div className="py-3"><dt className="text-[#6b7982]">{labels.redemption}</dt><dd className="mt-1 font-semibold leading-6">{tx(share?.redemptionTerms, lang) ?? "—"}</dd></div>}</dl></div>
      </section>
      <section className="rounded-xl border border-[#e7d39f] bg-[#fffaf0] p-6"><h2 className="text-xl font-semibold text-[#4a3b22]">{labels.risks}</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-[#665537]">{offering.risks.map((risk) => <li key={tx(riskText(risk), lang)}>• {tx(riskText(risk), lang)}</li>)}</ul></section>
    </main>
  </div>;
}
