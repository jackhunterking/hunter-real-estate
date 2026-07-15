"use client";

import { ArrowRight, BadgeCheck, Building2, CheckCircle2, FileCheck2, Handshake, ShieldCheck, UsersRound } from "lucide-react";
import type { PartnerTier } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { PARTNER_TIER_THRESHOLDS } from "@/lib/capital/partner-data";
import { PageHeader, Panel } from "@/components/capital/north/PortalUI";

const COPY = {
  tr: {
    eyebrow: "Lisanslı dağıtım ağı",
    title: "Partner Programı",
    desc: "Kanada özel gayrimenkul fonlarını nitelikli yatırımcı ilişkilerine taşıyan lisanslı firmalar için yapılandırılmış iş birliği programı.",
    tiers: "Yıllık partner kademeleri",
    tiersMeta: "Kabul edilmiş ve aktarımı tamamlanmış sermaye üzerinden ölçülür.",
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
    workflow: "Partner süreci",
    steps: [
      ["Fonu inceleyin", "Koşulları, riskleri, belgeleri ve portföyü değerlendirin."],
      ["Müşteriyi tanıştırın", "Ön bilgiyi yalnızca gerekli kapsamda paylaşın."],
      ["Lisanslı incelemeyi tamamlayın", "Yerel ve Kanada tarafı kontrolleri ilgili yetkili kurumlar yürütür."],
      ["Kapanışı doğrulayın", "Yalnızca kabul edilmiş, aktarılmış ve iade edilmemiş sermaye sayılır."],
    ],
  },
  en: {
    eyebrow: "Licensed distribution network",
    title: "Partner Program",
    desc: "A structured collaboration program for licensed firms bringing Canadian private real-estate funds to qualified investor relationships.",
    tiers: "Annual partner tiers",
    tiersMeta: "Measured on accepted capital after completed transfer.",
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
    workflow: "Partner workflow",
    steps: [
      ["Review the fund", "Evaluate terms, risks, documents, and the underlying portfolio."],
      ["Introduce the client", "Share preliminary information only within the permitted scope."],
      ["Complete licensed review", "Applicable institutions conduct local and Canadian-side checks."],
      ["Confirm closing", "Only accepted, transferred, and non-refunded capital is counted."],
    ],
  },
} as const;

const TIER_ICONS = [Building2, BadgeCheck, Handshake];
const STEP_ICONS = [FileCheck2, UsersRound, ShieldCheck, CheckCircle2];

function formatCompactAmount(value: number) {
  if (value >= 1_000_000) {
    return `${value / 1_000_000}M`;
  }

  if (value >= 1_000) {
    return `${value / 1_000}K`;
  }

  return `${value}`;
}

function formatTierRange(min: number, max: number | null) {
  if (max === null) {
    return `CA$${formatCompactAmount(min)}+`;
  }

  return `CA$${formatCompactAmount(min)}-${formatCompactAmount(max)}`;
}

export default function PartnerProgramPage() {
  const { lang } = useLang();
  const c = COPY[lang];
  const tiers = [
    [c.tierLabels.associate, PARTNER_TIER_THRESHOLDS.associate],
    [c.tierLabels.principal, PARTNER_TIER_THRESHOLDS.principal],
    [c.tierLabels.managingPartner, PARTNER_TIER_THRESHOLDS.managingPartner],
  ] as const;

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.desc} />

      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#172e40]">{c.tiers}</h2>
          <p className="mt-1 text-xs text-[#75818a]">{c.tiersMeta}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {tiers.map(([name, threshold], index) => {
            const Icon = TIER_ICONS[index];
            const nextThreshold = tiers[index + 1]?.[1] ?? null;
            const rangeLabel = formatTierRange(threshold, nextThreshold ?? null);
            return (
              <Panel key={name} className={`relative overflow-hidden p-5 ${index === 2 ? "border-[#cfb365]" : ""}`}>
                <div className={`absolute inset-x-0 top-0 h-1 ${index === 0 ? "bg-[#9b754f]" : index === 1 ? "bg-[#8d98a1]" : "bg-[#c5a34d]"}`} />
                <Icon className="size-5 text-[#0a2d46]" />
                <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.1em] text-[#74808a]">{name}</p>
                <p className="mt-2 text-[1.95rem] font-semibold leading-tight tabular-nums text-[#163044] md:text-[2.15rem]">{rangeLabel}</p>
              </Panel>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-[#172e40]">{c.workflow}</h2>
        <Panel className="overflow-hidden">
          <div className="grid md:grid-cols-4">
            {c.steps.map(([title, body], index) => {
              const Icon = STEP_ICONS[index];
              return (
                <div key={title} className="relative border-b border-[#e5e9ec] p-5 last:border-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <span className="grid size-9 place-items-center rounded-md bg-[#edf2f5] text-[#0a2d46]">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a949c]">0{index + 1}</p>
                  <h3 className="mt-2 text-sm font-semibold text-[#223743]">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#6b7882]">{body}</p>
                  {index < 3 && <ArrowRight className="absolute right-[-9px] top-8 z-10 hidden size-4 rounded-full bg-white text-[#9ba4ab] md:block" />}
                </div>
              );
            })}
          </div>
        </Panel>
      </section>
    </div>
  );
}
