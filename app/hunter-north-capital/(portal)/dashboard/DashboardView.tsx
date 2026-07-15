"use client";

import Link from "next/link";
import { ArrowRight, Building2, FileText, Plus, TrendingUp, UsersRound } from "lucide-react";
import type { OfferingBundle, PartnerTier, ReferralStatus } from "@/lib/capital/types";
import { partnerSummary } from "@/lib/capital/partner-data";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { fundHeadline, formatReturnPhrase, primaryShareClass } from "@/lib/capital/present";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel, SectionHeader, money, shortDate } from "@/components/capital/north/PortalUI";
import { useClients } from "@/components/capital/north/ClientProvider";
import { StageIndicator } from "@/components/capital/north/StageIndicator";

const COPY = {
  tr: {
    eyebrow: "Partner merkezi",
    title: "Genel Bakış",
    desc: "Fon erişimi, müşteri tanıştırmaları ve yıllık partner ilerlemesi tek görünümde.",
    newReferral: "Yeni müşteri",
    cleared: "Yıllık kabul edilen sermaye",
    tier: "Partner kademesi",
    referrals: "Müşteriler",
    products: "Aktif fonlar",
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
    next: (tier: string) => `Bir sonraki kademe: ${tier}`,
    remaining: "kaldı",
    latestReferrals: "Son müşteri kayıtları",
    all: "Tümünü gör",
    investor: "Yatırımcı",
    product: "Fon",
    amount: "Gösterge tutarı",
    status: "Durum",
    lastUpdate: "Son güncelleme",
    availableProducts: "Kullanılabilir fonlar",
    productMeta: "Partner incelemesine açık Kanada gayrimenkul fonları",
    available: "Kullanılabilir",
    coming: "Yakında",
    min: "Minimum",
    target: "Hedef getiri",
    headline: "Fon büyüklüğü",
    updated: "Raporlama tarihi",
    review: "Fonu incele",
    targetDisclaimer: "Hedefler garanti değildir; resmi belgeler belirleyicidir.",
    statusMap: {
      introduced: "Tanıştırıldı",
      contacted: "İletişime geçildi",
      "compliance-review": "Uyum incelemesi",
      accepted: "Kabul edildi",
      funded: "Fonlandı",
    } as Record<ReferralStatus, string>,
  },
  en: {
    eyebrow: "Partner centre",
    title: "Overview",
    desc: "Fund access, client introductions, and annual partner progress in one view.",
    newReferral: "New client",
    cleared: "Annual accepted capital",
    tier: "Partner tier",
    referrals: "Clients",
    products: "Active funds",
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
    next: (tier: string) => `Progress to ${tier}`,
    remaining: "remaining",
    latestReferrals: "Recent client records",
    all: "View all",
    investor: "Investor",
    product: "Fund",
    amount: "Illustrative amount",
    status: "Status",
    lastUpdate: "Last update",
    availableProducts: "Available funds",
    productMeta: "Canadian real-estate funds available for partner review",
    available: "Available",
    coming: "Coming soon",
    min: "Minimum",
    target: "Target return",
    headline: "Fund size",
    updated: "Reporting date",
    review: "Review fund",
    targetDisclaimer: "Targets are not guaranteed; official documents control.",
    statusMap: {
      introduced: "Introduced",
      contacted: "Contacted",
      "compliance-review": "Compliance review",
      accepted: "Accepted",
      funded: "Funded",
    } as Record<ReferralStatus, string>,
  },
} as const;

function statusClass(status: ReferralStatus) {
  if (status === "funded" || status === "accepted") return "bg-[#e8f2ec] text-[#2d6849]";
  if (status === "compliance-review") return "bg-[#f7efd9] text-[#7b5c19]";
  return "bg-[#eaf0f5] text-[#3c5d75]";
}

export function DashboardView({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { clients } = useClients();
  const c = COPY[lang];
  const currentTierLabel = c.tierLabels[partnerSummary.tier];
  const nextTierLabel = c.tierLabels[partnerSummary.nextTier];
  const progress = (partnerSummary.annualClearedCapital / partnerSummary.nextTierThreshold) * 100;
  const remaining = partnerSummary.nextTierThreshold - partnerSummary.annualClearedCapital;

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.desc}
        action={
          <Link href={`${NORTH_BASE}/clients/new`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]">
            <Plus className="size-4" /> {c.newReferral}
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [c.cleared, money(partnerSummary.annualClearedCapital, lang), TrendingUp],
          [c.tier, currentTierLabel, Building2],
          [c.referrals, String(clients.length), UsersRound],
          [c.products, String(partnerSummary.activeProducts), FileText],
        ].map(([label, value, Icon]) => (
          <Panel key={String(label)} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-[#6e7983]">{label as string}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-[#102638]">{value as string}</p>
              </div>
              <span className="grid size-9 place-items-center rounded-md bg-[#eef2f5] text-[#0a2d46]">
                <Icon className="size-[18px]" />
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="mt-4 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#1a2c3a]">{c.next(nextTierLabel)}</p>
            <p className="mt-1 text-xs text-[#73808a]">{money(remaining, lang)} {c.remaining}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-[#0a2d46]">
            {money(partnerSummary.annualClearedCapital, lang)} / {money(partnerSummary.nextTierThreshold, lang)}
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7ebef]">
          <div className="h-full rounded-full bg-[#c5a34d]" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </Panel>

      <div className="mt-8">
        <SectionHeader
          title={c.latestReferrals}
          action={<Link href={`${NORTH_BASE}/clients`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline">{c.all}<ArrowRight className="size-3.5" /></Link>}
        />
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[690px] border-collapse text-left">
              <thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
                <tr>{[c.investor, c.product, c.amount, c.status, c.lastUpdate].map((item) => <th key={item} className="border-b border-[#e2e6e9] px-4 py-3">{item}</th>)}</tr>
              </thead>
              <tbody className="text-sm">
                {[...clients].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4).map((client) => {
                  const interest = client.fundInterests.find((item) => item.primary) ?? client.fundInterests[0];
                  const offering = offerings.find((item) => item.id === interest?.offeringId);
                  return (
                    <tr key={client.id} className="border-b border-[#edf0f2] last:border-0 hover:bg-[#fafbfc]">
                      <td className="px-4 py-3.5 font-semibold text-[#21313e]"><Link href={`${NORTH_BASE}/clients/${client.id}`} className="hover:text-[#0a4b72] hover:underline">{client.displayName}</Link></td>
                      <td className="max-w-52 truncate px-4 py-3.5 text-[#5e6a74]">{offering?.shortName[lang]}</td>
                      <td className="px-4 py-3.5 tabular-nums text-[#3f4e5a]">{interest ? money(interest.amount, lang) : "—"}</td>
                      <td className="px-4 py-3.5"><StageIndicator status={client.status} label={<span className={`rounded px-2 py-1 text-[10px] font-bold ${statusClass(client.status)}`}>{c.statusMap[client.status]}</span>} labels={c.statusMap} /></td>
                      <td className="px-4 py-3.5 text-xs text-[#78838c]">{shortDate(client.updatedAt.slice(0, 10), lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-8">
        <SectionHeader title={c.availableProducts} meta={c.productMeta} action={<Link href={`${NORTH_BASE}/funds`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline">{c.all}<ArrowRight className="size-3.5" /></Link>} />
        <div className="grid gap-4 md:grid-cols-2">
            {offerings.map((offering) => {
              const share = primaryShareClass(offering);
              const image = offering.media?.card?.src;
              return (
                <article key={offering.id} className="overflow-hidden rounded-md border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
                  <div className="relative aspect-[16/6] overflow-hidden bg-[#0d2d43]">
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={offering.media?.card?.alt?.[lang] ?? offering.shortName[lang]} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/75 via-[#071c2c]/15 to-transparent" />
                    {offering.media?.logo?.src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={offering.media.logo.src} alt="" className="absolute bottom-3 left-3 h-9 max-w-24 rounded bg-white object-contain p-1.5 shadow-sm" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#e9f2ec] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#2f694a]">{offering.status === "available" ? c.available : c.coming}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#76818a]">{taxonomyLabel(strategies, offering.strategyIds[0], lang)}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#152b3b]">{offering.shortName[lang]}</h3>
                    <p className="mt-1 text-xs text-[#75818a]">{offering.manager.name[lang]}</p>
                    <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#5f6d78]">{offering.summary[lang]}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-[#e6eaed] py-3">
                      <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.min}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{share?.minimumInvestment ? money(share.minimumInvestment.value, lang) : "—"}</dd></div>
                      <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.target}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{share?.targetReturn ? formatReturnPhrase(share.targetReturn.value, lang) : "—"}</dd></div>
                      <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.headline}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{fundHeadline(offering, lang) ?? "—"}</dd></div>
                      <div><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b858e]">{c.updated}</dt><dd className="mt-1 text-sm font-semibold text-[#243845]">{offering.lastUpdated ?? offering.verifiedAt}</dd></div>
                    </dl>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[10px] text-[#838d95]">{c.targetDisclaimer}</p>
                      <Link href={`${NORTH_BASE}/funds/${offering.slug}`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#0a2d46] px-3 text-xs font-semibold text-white hover:bg-[#123f5e]">{c.review}<ArrowRight className="size-3.5" /></Link>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </div>
  );
}
