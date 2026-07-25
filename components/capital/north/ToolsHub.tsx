"use client";

/**
 * Resources → Tools. The sidebar names the group; each tool names itself here
 * and again as the title of its own page, so a tool can be renamed or added
 * without touching the navigation.
 *
 * The qualification tool reads differently in each account view — a partner
 * runs it on a client, an investor runs it on themselves — so it carries a
 * second set of strings rather than a second card.
 */

import { useEffect } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { ArrowRight, BadgeCheck, GitCompareArrows, Scale } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { canUseWorkspace } from "@/lib/capital/portal-access";
import { NORTH_BASE } from "./NorthBrand";
import { usePortalAccess } from "./PortalAccessProvider";
import { PageHeader } from "./PortalUI";

const COPY = {
  en: {
    title: "Tools",
    description: "Calculators built on published manager figures. None of them forecast.",
    tools: [
      {
        href: "/resources/tools/active-vs-passive",
        name: "Passive vs. Active Investments",
        kind: "Calculator",
        summary: "An investment fund vs. rental property. What a condo or house nets each month after real expenses, against what the same cash actually earned in a fund.",
      },
      {
        href: "/resources/tools/passive-vs-passive",
        name: "Passive vs. Passive Investments",
        kind: "Comparison",
        summary: "One fund against another, on the same cash. Published returns period by period, plus a side-by-side of the terms each fund publishes.",
      },
    ],
    qualification: {
      href: "/resources/investor-readiness",
      kind: "Assessment",
      professional: {
        name: "Investor qualification",
        summary: "Identify the Canadian financial category indicated by a client’s answers, regardless of where they live, and record the assessment on their file.",
      },
      investor: {
        name: "Check your investor category",
        summary: "Answer the questions yourself to see your preliminary Canadian financial category and Canadian offering OM investment ceiling.",
      },
    },
    open: "Open tool",
  },
  tr: {
    title: "Araçlar",
    description: "Yöneticinin yayımladığı rakamlara dayanan hesaplayıcılar. Öngörü üretmezler.",
    tools: [
      {
        href: "/resources/tools/active-vs-passive",
        name: "Pasif ve Aktif Yatırımlar",
        kind: "Hesaplayıcı",
        summary: "Yatırım fonu ile kiralık mülk. Bir condo ya da evin gerçek giderlerden sonra aylık net getirisi ile aynı nakdin bir fonda gerçekte kazandığı.",
      },
      {
        href: "/resources/tools/passive-vs-passive",
        name: "Pasif ve Pasif Yatırımlar",
        kind: "Karşılaştırma",
        summary: "Aynı nakitle iki fonun karşılaştırması. Dönem dönem yayımlanan getiriler ve her fonun yayımladığı koşulların yan yana görünümü.",
      },
    ],
    qualification: {
      href: "/resources/investor-readiness",
      kind: "Değerlendirme",
      professional: {
        name: "Yatırımcı sınıflandırması",
        summary: "Müşterinin nerede yaşadığına bakılmaksızın, yanıtlarının gösterdiği Kanada finansal kategorisini belirleyin ve değerlendirmeyi dosyasına kaydedin.",
      },
      investor: {
        name: "Yatırımcı kategorinizi kontrol edin",
        summary: "Ön Kanada finansal kategorinizi ve Kanada teklifi OM yatırım tavanınızı görmek için soruları kendiniz yanıtlayın.",
      },
    },
    open: "Aracı aç",
  },
} as const;

const ICONS = [Scale, GitCompareArrows];

export function ToolsHub() {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const posthog = usePostHog();
  const { context, accountView } = usePortalAccess();

  useEffect(() => {
    posthog?.capture("hnc_tools_hub_opened", { language: lang });
  }, [posthog, lang]);

  const professionalMode = accountView === "professional" && canUseWorkspace(context, "professional");
  const qualification = professionalMode ? c.qualification.professional : c.qualification.investor;
  const tools = [
    ...c.tools.map((tool, index) => ({ ...tool, icon: ICONS[index] ?? Scale })),
    { href: c.qualification.href, kind: c.qualification.kind, ...qualification, icon: BadgeCheck },
  ];

  return (
    <div>
      <PageHeader title={c.title} />
      <p className="-mt-3 mb-6 max-w-2xl text-sm leading-6 text-[#65727c]">{c.description}</p>

      <div className="grid gap-5 xl:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <article
              key={tool.href}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-[#d8e0e4] bg-white shadow-[0_1px_2px_rgba(8,34,52,0.04)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#a9c0d0] hover:shadow-[0_10px_24px_rgba(8,34,52,0.10)]"
            >
              <div className="flex items-center justify-between bg-[#0a3452] px-6 py-4 sm:px-7">
                <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-white/10 text-[#bcd3e4]">
                  <Icon className="size-5" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8fa9bc]">{tool.kind}</span>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h2 className="font-serif text-2xl font-semibold leading-tight text-[#102c3f]">{tool.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#5a6c77]">{tool.summary}</p>
                <div className="mt-auto flex items-center justify-between border-t border-[#eef1f3] pt-4">
                  <Link
                    href={`${NORTH_BASE}${tool.href}`}
                    className="text-sm font-semibold text-[#0a4b72] after:absolute after:inset-0"
                  >
                    {c.open}
                  </Link>
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#eef4f7] text-[#0a4b72] transition-colors group-hover:bg-[#0a4b72] group-hover:text-white">
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
