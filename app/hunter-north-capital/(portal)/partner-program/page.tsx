"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  Hash,
  Landmark,
  MapPin,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { PartnerTier, ReferralStatus } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  PARTNER_TIER_THRESHOLDS,
  partnerSummary,
  REFERRAL_STATUS_ORDER,
} from "@/lib/capital/partner-data";
import { useClients } from "@/components/capital/north/ClientProvider";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel, money } from "@/components/capital/north/PortalUI";

const COPY = {
  tr: {
    eyebrow: "Partner hesabı",
    desc: "Hunter North Capital ile performansınızı, mevcut kademenizi ve hesap bilgilerinizi tek bir yerde takip edin.",
    active: "Aktif partner",
    underReview: "İncelemede",
    inactive: "Pasif",
    tierEyebrow: "Mevcut partner kademesi",
    annualCapital: "Yıllık kabul edilen sermaye",
    progressTo: (tier: string) => `${tier} kademesine ilerleme`,
    remaining: "kaldı",
    tierScale: "Yıllık kademe eşikleri",
    current: "Mevcut",
    performance: "Yıl içi performans",
    performanceMeta: "Mevcut müşteri kayıtları ve kabul edilen sermayeye göre.",
    metrics: {
      acceptedCapital: "Kabul edilen sermaye",
      introductions: "Müşteri tanıştırmaları",
      outcomes: "Kabul edilen veya fonlanan",
      activeFunds: "Aktif fonlar",
    },
    pipeline: "Müşteri aşamaları",
    pipelineMeta: "Müşteri sayısı ve birincil fon ilgisine ait gösterge tutarı.",
    viewClients: "Tüm müşterileri gör",
    indicativeAmount: "Gösterge tutarı",
    statuses: {
      introduced: "Tanıştırıldı",
      contacted: "İletişime geçildi",
      "compliance-review": "Uyum incelemesi",
      accepted: "Kabul edildi",
      funded: "Fonlandı",
    } as Record<ReferralStatus, string>,
    recentActivity: "Son partner aktiviteleri",
    recentActivityMeta: "Müşteri profillerindeki en son gelişmeler.",
    noActivity: "Henüz gösterilecek aktivite yok.",
    profile: "Hunter North profili",
    profileMeta: "Hunter North Capital kayıtlarındaki salt okunur hesap bilgileri.",
    profileFields: {
      organization: "Kurum",
      partnerId: "Partner numarası",
      accountStatus: "Hesap durumu",
      relationshipSince: "İlişki başlangıcı",
      primaryMarket: "Ana pazar",
      relationshipManager: "İlişki yöneticisi",
      profileReviewed: "Profil son inceleme",
    },
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
  },
  en: {
    eyebrow: "Partner account",
    desc: "Track your performance, current standing, and account details with Hunter North Capital in one place.",
    active: "Active partner",
    underReview: "Under review",
    inactive: "Inactive",
    tierEyebrow: "Current partner tier",
    annualCapital: "Annual accepted capital",
    progressTo: (tier: string) => `Progress to ${tier}`,
    remaining: "remaining",
    tierScale: "Annual tier thresholds",
    current: "Current",
    performance: "Year-to-date performance",
    performanceMeta: "Based on current client records and accepted capital.",
    metrics: {
      acceptedCapital: "Accepted capital",
      introductions: "Client introductions",
      outcomes: "Accepted or funded",
      activeFunds: "Active funds",
    },
    pipeline: "Client pipeline",
    pipelineMeta: "Client count and indicative amount from each primary fund interest.",
    viewClients: "View all clients",
    indicativeAmount: "Indicative amount",
    statuses: {
      introduced: "Introduced",
      contacted: "Contacted",
      "compliance-review": "Compliance review",
      accepted: "Accepted",
      funded: "Funded",
    } as Record<ReferralStatus, string>,
    recentActivity: "Recent partner activity",
    recentActivityMeta: "The latest developments across client profiles.",
    noActivity: "There is no activity to show yet.",
    profile: "Profile with Hunter North",
    profileMeta: "Read-only account information held by Hunter North Capital.",
    profileFields: {
      organization: "Organization",
      partnerId: "Partner ID",
      accountStatus: "Account status",
      relationshipSince: "Relationship since",
      primaryMarket: "Primary market",
      relationshipManager: "Relationship manager",
      profileReviewed: "Profile last reviewed",
    },
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
  },
} as const;

const TIER_ORDER: PartnerTier[] = ["associate", "principal", "managingPartner"];

function compactMoney(value: number, lang: "tr" | "en") {
  const locale = lang === "tr" ? "tr-TR" : "en-CA";
  if (value >= 1_000_000) return `CA$${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1_000_000)}M`;
  if (value >= 1_000) return `CA$${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1_000)}K`;
  return `CA$${new Intl.NumberFormat(locale).format(value)}`;
}

function fullDate(value: string, lang: "tr" | "en") {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function monthYear(value: string, lang: "tr" | "en") {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function activityIcon(kind: string) {
  if (kind === "status") return CheckCircle2;
  if (kind === "document") return BadgeCheck;
  if (kind === "created") return UsersRound;
  return Activity;
}

export default function PartnerProgramPage() {
  const { lang } = useLang();
  const { clients } = useClients();
  const c = COPY[lang];
  const currentTier = c.tierLabels[partnerSummary.tier];
  const nextTier = c.tierLabels[partnerSummary.nextTier];
  const rawProgress = (partnerSummary.annualClearedCapital / partnerSummary.nextTierThreshold) * 100;
  const progress = Math.min(Math.max(rawProgress, 0), 100);
  const remaining = Math.max(partnerSummary.nextTierThreshold - partnerSummary.annualClearedCapital, 0);
  const completedClients = clients.filter((client) => client.status === "accepted" || client.status === "funded").length;
  const statusLabels = {
    active: c.active,
    "under-review": c.underReview,
    inactive: c.inactive,
  } as const;
  const accountStatus = partnerSummary.accountStatus ? statusLabels[partnerSummary.accountStatus] : "—";
  const statusBadgeClass = partnerSummary.accountStatus === "active"
    ? "border-[#c9dfd0] bg-[#e8f2ec] text-[#2d6849]"
    : partnerSummary.accountStatus === "under-review"
      ? "border-[#ead8a7] bg-[#f7efd9] text-[#7b5c19]"
      : "border-[#d8dfe4] bg-[#f1f4f6] text-[#66747f]";
  const statusDotClass = partnerSummary.accountStatus === "active"
    ? "bg-[#3e805c]"
    : partnerSummary.accountStatus === "under-review"
      ? "bg-[#a57a22]"
      : "bg-[#7d8992]";

  const pipeline = REFERRAL_STATUS_ORDER.map((status) => {
    const matching = clients.filter((client) => client.status === status);
    const amount = matching.reduce((total, client) => {
      const primary = client.fundInterests.find((interest) => interest.primary) ?? client.fundInterests[0];
      return total + (primary?.amount ?? 0);
    }, 0);
    return { status, count: matching.length, amount };
  });

  const recentActivity = clients
    .flatMap((client) => client.activity.map((item) => ({ ...item, clientId: client.id, clientName: client.displayName })))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 5);

  const profileRows = [
    [c.profileFields.organization, partnerSummary.partnerName, Building2],
    [c.profileFields.partnerId, partnerSummary.partnerId ?? "—", Hash],
    [c.profileFields.accountStatus, accountStatus, CircleCheckBig],
    [c.profileFields.relationshipSince, partnerSummary.relationshipSince ? monthYear(partnerSummary.relationshipSince, lang) : "—", CalendarDays],
    [c.profileFields.primaryMarket, partnerSummary.primaryMarket?.[lang] ?? "—", MapPin],
    [c.profileFields.relationshipManager, partnerSummary.relationshipManager ?? "—", UserRoundCheck],
    [c.profileFields.profileReviewed, partnerSummary.profileReviewedAt ? monthYear(partnerSummary.profileReviewedAt, lang) : "—", Clock3],
  ] as const;

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={partnerSummary.partnerName}
        description={c.desc}
        action={
          <span className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold ${statusBadgeClass}`}>
            <span className={`size-1.5 rounded-full ${statusDotClass}`} aria-hidden="true" />
            {accountStatus}
          </span>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(310px,0.75fr)]">
        <div className="min-w-0 space-y-8">
          <section className="overflow-hidden rounded-lg border border-[#17384e] bg-[#082337] text-white shadow-[0_14px_40px_rgba(7,28,44,0.12)]">
            <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
              <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full border border-[#c5a34d]/15" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-8 -top-16 size-44 rounded-full bg-[#c5a34d]/8 blur-2xl" aria-hidden="true" />
              <div className="relative grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/58">{c.tierEyebrow}</p>
                    <span className="rounded-full border border-[#d9bd72]/35 bg-[#c5a34d]/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#e6cd88]">{c.current}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-[2.4rem]">{currentTier}</h2>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">{c.annualCapital}</p>
                  <p className="mt-1.5 text-3xl font-semibold tabular-nums text-white sm:text-[2.15rem]">{compactMoney(partnerSummary.annualClearedCapital, lang)}</p>
                </div>

                <div className="rounded-md border border-white/12 bg-white/[0.055] p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-sm font-semibold text-white">{c.progressTo(nextTier)}</p>
                      <p className="mt-1 text-xs text-white/58">{money(remaining, lang)} {c.remaining}</p>
                    </div>
                    <p className="text-xl font-semibold tabular-nums text-[#e6cd88]">{Math.round(progress)}%</p>
                  </div>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-white/12"
                    role="progressbar"
                    aria-label={c.progressTo(nextTier)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                  >
                    <div className="h-full rounded-full bg-[#c5a34d]" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-white/45">
                    <span>{compactMoney(partnerSummary.annualClearedCapital, lang)}</span>
                    <span>{compactMoney(partnerSummary.nextTierThreshold, lang)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#061b2b]/70 px-5 py-5 sm:px-7">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{c.tierScale}</p>
              <ol className="grid grid-cols-3 gap-2" aria-label={c.tierScale}>
                {TIER_ORDER.map((tier, index) => {
                  const isCurrent = tier === partnerSummary.tier;
                  const reached = partnerSummary.annualClearedCapital >= PARTNER_TIER_THRESHOLDS[tier];
                  return (
                    <li key={tier} className="relative min-w-0">
                      {index > 0 && <span className={`absolute -left-[calc(50%+4px)] right-[calc(50%+16px)] top-2 h-px ${reached ? "bg-[#c5a34d]" : "bg-white/18"}`} aria-hidden="true" />}
                      <div className={`relative z-10 size-4 rounded-full border-2 ${isCurrent ? "border-[#e3c979] bg-[#c5a34d] shadow-[0_0_0_4px_rgba(197,163,77,0.14)]" : reached ? "border-[#c5a34d] bg-[#c5a34d]" : "border-white/30 bg-[#071c2c]"}`} aria-hidden="true" />
                      <p className={`mt-3 truncate text-[10px] font-bold uppercase tracking-[0.08em] ${isCurrent ? "text-[#e9d28f]" : "text-white/64"}`}>{c.tierLabels[tier]}</p>
                      <p className="mt-1 text-xs font-semibold tabular-nums text-white/88">{compactMoney(PARTNER_TIER_THRESHOLDS[tier], lang)}{index === TIER_ORDER.length - 1 ? "+" : ""}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <section aria-labelledby="performance-heading">
            <div className="mb-4">
              <h2 id="performance-heading" className="text-base font-semibold text-[#172e40]">{c.performance}</h2>
              <p className="mt-1 text-xs text-[#75818a]">{c.performanceMeta}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {[
                [c.metrics.acceptedCapital, compactMoney(partnerSummary.annualClearedCapital, lang), TrendingUp],
                [c.metrics.introductions, String(clients.length), UsersRound],
                [c.metrics.outcomes, String(completedClients), CircleCheckBig],
                [c.metrics.activeFunds, String(partnerSummary.activeProducts), Landmark],
              ].map(([label, value, Icon]) => (
                <Panel key={String(label)} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#74808a]">{label as string}</p>
                      <p className="mt-3 text-2xl font-semibold tabular-nums text-[#102638]">{value as string}</p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#edf2f5] text-[#0a2d46]">
                      <Icon className="size-[18px]" />
                    </span>
                  </div>
                </Panel>
              ))}
            </div>
          </section>

          <section aria-labelledby="pipeline-heading">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 id="pipeline-heading" className="text-base font-semibold text-[#172e40]">{c.pipeline}</h2>
                <p className="mt-1 text-xs text-[#75818a]">{c.pipelineMeta}</p>
              </div>
              <Link href={`${NORTH_BASE}/clients`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4b72] hover:underline">
                {c.viewClients}<ArrowRight className="size-3.5" />
              </Link>
            </div>
            <Panel className="overflow-hidden">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5">
                {pipeline.map((stage, index) => (
                  <div key={stage.status} className="relative border-b border-[#e5e9ec] p-4 last:border-0 sm:odd:border-r sm:last:col-span-2 sm:last:border-r-0 lg:border-b-0 lg:border-r lg:last:col-span-1 lg:last:border-r-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`grid size-7 place-items-center rounded-full text-[10px] font-bold ${stage.count > 0 ? "bg-[#0a2d46] text-white" : "border border-[#d8dfe4] bg-[#f7f9fa] text-[#82909a]"}`}>{index + 1}</span>
                      <span className="text-2xl font-semibold tabular-nums text-[#173044]">{stage.count}</span>
                    </div>
                    <h3 className="mt-4 min-h-8 text-xs font-semibold leading-4 text-[#324754]">{c.statuses[stage.status]}</h3>
                    <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8a949c]">{c.indicativeAmount}</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-[#50616d]">{compactMoney(stage.amount, lang)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section aria-labelledby="activity-heading">
            <div className="mb-4">
              <h2 id="activity-heading" className="text-base font-semibold text-[#172e40]">{c.recentActivity}</h2>
              <p className="mt-1 text-xs text-[#75818a]">{c.recentActivityMeta}</p>
            </div>
            <Panel className="overflow-hidden">
              {recentActivity.length > 0 ? (
                <ul className="divide-y divide-[#e8ecef]">
                  {recentActivity.map((item) => {
                    const Icon = activityIcon(item.kind);
                    return (
                      <li key={`${item.clientId}-${item.id}`}>
                        <Link href={`${NORTH_BASE}/clients/${item.clientId}`} className="group flex items-start gap-3 px-4 py-4 hover:bg-[#fafbfc] sm:px-5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#edf2f5] text-[#0a2d46]">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-[#243845] group-hover:text-[#0a4b72]">{item.clientName}</span>
                            <span className="mt-1 block text-xs leading-5 text-[#66747f]">{item.description[lang]}</span>
                          </span>
                          <span className="shrink-0 pt-0.5 text-[10px] text-[#87929a]">{fullDate(item.occurredAt, lang)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-5 py-12 text-center">
                  <Activity className="mx-auto size-5 text-[#9aa4ab]" />
                  <p className="mt-3 text-sm text-[#74808a]">{c.noActivity}</p>
                </div>
              )}
            </Panel>
          </section>
        </div>

        <aside className="xl:sticky xl:top-24" aria-labelledby="profile-heading">
          <Panel className="overflow-hidden">
            <div className="border-b border-[#e3e8eb] bg-[#fafbfc] px-5 py-5">
              <span className="grid size-10 place-items-center rounded-md bg-[#0a2d46] text-white">
                <BadgeCheck className="size-5" />
              </span>
              <h2 id="profile-heading" className="mt-4 text-base font-semibold text-[#172e40]">{c.profile}</h2>
              <p className="mt-1 text-xs leading-5 text-[#75818a]">{c.profileMeta}</p>
            </div>
            <dl className="divide-y divide-[#e8ecef] px-5">
              {profileRows.map(([label, value, Icon]) => (
                <div key={label} className="flex gap-3 py-4">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded bg-[#eef2f5] text-[#0a2d46]">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#84909a]">{label}</dt>
                    <dd className="mt-1 break-words text-xs font-semibold leading-5 text-[#334955]">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
