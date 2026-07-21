"use client";

import Link from "next/link";
import { ArrowRight, Building2, FileText, HandCoins, Plus, TrendingUp, UsersRound } from "lucide-react";
import type { OfferingBundle, PartnerTier, ReferralStatus } from "@/lib/capital/types";
import { PARTNER_COMMISSION_ALLOCATIONS, PARTNER_TIER_THRESHOLDS, nextPartnerTier } from "@/lib/capital/commissions";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel, SectionHeader, money } from "@/components/capital/north/PortalUI";
import { useClients } from "@/components/capital/north/ClientProvider";
import { StageIndicator } from "@/components/capital/north/StageIndicator";
import { usePortalAccess } from "@/components/capital/north/PortalAccessProvider";

const COPY = {
  tr: {
    eyebrow: "Profesyonel merkezi",
    title: "Profesyonel Genel Bakış",
    desc: "Yatırımcı süreci, fon sunumları, bireysel komisyonlar ve yıllık profesyonel ilerleme tek görünümde.",
    newReferral: "Yeni yatırımcı",
    cleared: "Yıllık kabul edilen sermaye",
    tier: "Profesyonel seviye",
    commission: "Bireysel komisyon payı",
    referrals: "Yatırımcılar",
    products: "Aktif fonlar",
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
    next: (tier: string) => `Bir sonraki kademe: ${tier}`,
    remaining: "kaldı",
    latestReferrals: "Son yatırımcı kayıtları",
    all: "Tümünü gör",
    investor: "Yatırımcı",
    status: "Durum",
    availableProducts: "Kullanılabilir fonlar",
    strategy: "Strateji",
    review: "Sunumu aç",
    statusMap: {
      introduced: "Tanıştırıldı",
      contacted: "İletişime geçildi",
      "compliance-review": "Uyum incelemesi",
      accepted: "Kabul edildi",
      funded: "Fonlandı",
    } as Record<ReferralStatus, string>,
  },
  en: {
    eyebrow: "Professional centre",
    title: "Professional Overview",
    desc: "Investor pipeline, fund presentations, individual commissions, and annual professional progress in one view.",
    newReferral: "New investor",
    cleared: "Annual accepted capital",
    tier: "Professional level",
    commission: "Individual commission allocation",
    referrals: "Investors",
    products: "Active funds",
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
    next: (tier: string) => `Progress to ${tier}`,
    remaining: "remaining",
    latestReferrals: "Recent investor records",
    all: "View all",
    investor: "Investor",
    status: "Status",
    availableProducts: "Available funds",
    strategy: "Strategy",
    review: "Open presentation",
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
  const { currentUser, currentOrganization, dataset } = usePortalAccess();
  const c = pick(COPY, lang);
  const account = dataset.partnerAccounts.find((item) => item.userId === currentUser.id);
  const tier = account?.tier ?? "associate";
  const annualClearedCapital = account?.annualClearedCapital ?? 0;
  const nextTier = nextPartnerTier(tier);
  const nextThreshold = nextTier ? PARTNER_TIER_THRESHOLDS[nextTier] : PARTNER_TIER_THRESHOLDS.managingPartner;
  const currentTierLabel = c.tierLabels[tier];
  const nextTierLabel = nextTier ? c.tierLabels[nextTier] : currentTierLabel;
  const progress = nextTier ? (annualClearedCapital / nextThreshold) * 100 : 100;
  const remaining = Math.max(nextThreshold - annualClearedCapital, 0);
  const activeProducts = currentOrganization
    ? dataset.offeringAccess.filter((item) => item.organizationId === currentOrganization.id && ["approved", "on_shelf"].includes(item.status)).length
    : 0;

  return (
    <div>
      <PageHeader
        title={c.title}
        description={c.desc}
        action={
          <Link href={`${NORTH_BASE}/clients/new`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]">
            <Plus className="size-4" /> {c.newReferral}
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          [c.cleared, money(annualClearedCapital, lang), TrendingUp],
          [c.tier, currentTierLabel, Building2],
          [c.commission, `${PARTNER_COMMISSION_ALLOCATIONS[tier]}%`, HandCoins],
          [c.referrals, String(clients.length), UsersRound],
          [c.products, String(activeProducts), FileText],
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
            {money(annualClearedCapital, lang)} / {money(nextThreshold, lang)}
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
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(9rem,auto)] border-b border-[#e2e6e9] bg-[#f6f8f9] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
            <span>{c.investor}</span>
            <span>{c.status}</span>
          </div>
          <div className="text-sm">
            {[...clients].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4).map((client) => (
              <div key={client.id} className="grid grid-cols-[minmax(0,1fr)_minmax(9rem,auto)] items-center gap-4 border-b border-[#edf0f2] px-4 py-3.5 last:border-0 hover:bg-[#fafbfc]">
                <Link href={`${NORTH_BASE}/clients/${client.id}`} className="min-w-0 break-words font-semibold text-[#21313e] hover:text-[#0a4b72] hover:underline">
                  {client.displayName}
                </Link>
                <StageIndicator status={client.status} label={<span className={`rounded px-2 py-1 text-[10px] font-bold ${statusClass(client.status)}`}>{c.statusMap[client.status]}</span>} labels={c.statusMap} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-8">
        <SectionHeader title={c.availableProducts} action={<Link href={`${NORTH_BASE}/funds`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline">{c.all}<ArrowRight className="size-3.5" /></Link>} />
        <div className="grid gap-4 md:grid-cols-2">
            {offerings.map((offering) => {
              const image = offering.media?.card?.src;
              return (
                <article key={offering.id} className="overflow-hidden rounded-md border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
                  <div className="relative aspect-[60/13] overflow-hidden bg-[#0d2d43]">
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={tx(offering.media?.card?.alt, lang) ?? tx(offering.shortName, lang)} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/75 via-[#071c2c]/15 to-transparent" />
                    {offering.media?.logo?.src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={offering.media.logo.src} alt="" className="absolute bottom-3 left-3 h-9 max-w-24 rounded bg-white object-contain p-1.5 shadow-sm" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[#152b3b]">{tx(offering.shortName, lang)}</h3>
                        <p className="mt-1 text-xs text-[#75818a]">{tx(offering.manager.name, lang)}</p>
                      </div>
                      <span className="inline-flex shrink-0 rounded border border-[#dbe1e5] bg-[#f5f7f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64727d]">
                        {c.strategy} · {taxonomyLabel(strategies, offering.strategyIds[0], lang)}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#5f6d78]">{tx(offering.summary, lang)}</p>
                    <div className="mt-3 flex items-center justify-end gap-3">
                      <Link href={`${NORTH_BASE}/funds/${offering.slug}/present`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#0a2d46] px-3 text-xs font-semibold text-white hover:bg-[#123f5e]">{c.review}<ArrowRight className="size-3.5" /></Link>
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
