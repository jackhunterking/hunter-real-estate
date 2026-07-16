"use client";

import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  Eye,
  Hash,
  Landmark,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";
import { Popover } from "radix-ui";
import type { PartnerTier } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  PARTNER_TIER_THRESHOLDS,
  partnerSummary,
} from "@/lib/capital/partner-data";
import { PARTNER_COMMISSION_ALLOCATIONS } from "@/lib/capital/commissions";
import { useClients } from "@/components/capital/north/ClientProvider";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel, money } from "@/components/capital/north/PortalUI";

const COPY = {
  tr: {
    eyebrow: "Partner hesabı",
    title: "Partnerlik özeti",
    desc: "Hunter North Capital ile yıllık partnerlik durumunuzu ve kabul edilen sermaye faaliyetlerinizi inceleyin.",
    active: "Aktif partner",
    underReview: "İncelemede",
    inactive: "Pasif",
    tierEyebrow: "Mevcut partner kademesi",
    annualCapital: "Yıllık kabul edilen sermaye",
    commissionAllocation: "Fon dağıtım komisyonu payı",
    nextThreshold: (tier: string) => `${tier} kademe eşiği`,
    progressTo: (tier: string) => `${tier} kademesine ilerleme`,
    remaining: "kaldı",
    tierScale: "Yıllık kademe eşikleri",
    tierScaleMeta: "Yıllık kabul edilen sermaye ve fon dağıtım komisyonu payına göre",
    viewTierScale: "Yıllık kademe eşiklerini görüntüle",
    closeTierScale: "Kademe eşiklerini kapat",
    current: "Mevcut",
    performance: "Yıl içi performans",
    performanceMeta: "Mevcut müşteri kayıtları ve kabul edilen sermayeye göre.",
    metrics: {
      acceptedCapital: "Kabul edilen sermaye",
      introductions: "Müşteri tanıştırmaları",
      outcomes: "Kabul edilen veya fonlanan",
      activeFunds: "Aktif fonlar",
    },
    recentActivity: "Son partner aktiviteleri",
    recentActivityMeta: "Müşteri profillerindeki en son gelişmeler.",
    noActivity: "Henüz gösterilecek aktivite yok.",
    profile: "Hunter North profili",
    pendingOnboarding: "Onboarding sırasında tamamlanacak",
    profileSections: {
      organization: "Kurum bilgileri",
      contact: "Birincil kurum yetkilisi",
      relationship: "Hunter North ilişkisi",
    },
    profileFields: {
      organization: "Kurum",
      partnerId: "Partner numarası",
      accountStatus: "Hesap durumu",
      organizationAddress: "Kurum adresi",
      contactName: "Yetkili kişi",
      contactRole: "Görevi / unvanı",
      contactEmail: "İş e-postası",
      contactPhone: "İş telefonu",
      relationshipSince: "İlişki başlangıcı",
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
    title: "Partnership overview",
    desc: "Review annual partner standing and accepted-capital activity with Hunter North Capital.",
    active: "Active partner",
    underReview: "Under review",
    inactive: "Inactive",
    tierEyebrow: "Current partner tier",
    annualCapital: "Annual accepted capital",
    commissionAllocation: "Fund distribution commission allocation",
    nextThreshold: (tier: string) => `${tier} threshold`,
    progressTo: (tier: string) => `Progress to ${tier}`,
    remaining: "remaining",
    tierScale: "Annual tier thresholds",
    tierScaleMeta: "Based on annual accepted capital and fund distribution commission allocation",
    viewTierScale: "View annual tier thresholds",
    closeTierScale: "Close tier thresholds",
    current: "Current",
    performance: "Year-to-date performance",
    performanceMeta: "Based on current client records and accepted capital.",
    metrics: {
      acceptedCapital: "Accepted capital",
      introductions: "Client introductions",
      outcomes: "Accepted or funded",
      activeFunds: "Active funds",
    },
    recentActivity: "Recent partner activity",
    recentActivityMeta: "The latest developments across client profiles.",
    noActivity: "There is no activity to show yet.",
    profile: "Profile with Hunter North",
    pendingOnboarding: "Pending onboarding",
    profileSections: {
      organization: "Organization details",
      contact: "Primary organization contact",
      relationship: "Hunter North relationship",
    },
    profileFields: {
      organization: "Organization",
      partnerId: "Partner ID",
      accountStatus: "Account status",
      organizationAddress: "Organization address",
      contactName: "Primary contact",
      contactRole: "Role / title",
      contactEmail: "Work email",
      contactPhone: "Work phone",
      relationshipSince: "Relationship since",
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

  const recentActivity = clients
    .flatMap((client) => client.activity.map((item) => ({ ...item, clientId: client.id, clientName: client.displayName })))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 5);

  const address = partnerSummary.organizationAddress;
  const addressLocality = [address?.city, address?.region, address?.postalCode].filter(Boolean).join(", ");
  const organizationAddress = [address?.line1, address?.line2, addressLocality, address?.country]
    .filter(Boolean)
    .join(" · ") || c.pendingOnboarding;
  const contact = partnerSummary.primaryContact;
  const profileGroups = [
    {
      label: c.profileSections.organization,
      rows: [
        [c.profileFields.organization, partnerSummary.partnerName, Building2],
        [c.profileFields.partnerId, partnerSummary.partnerId ?? "—", Hash],
        [c.profileFields.accountStatus, accountStatus, CircleCheckBig],
        [c.profileFields.organizationAddress, organizationAddress, MapPin],
      ],
    },
    {
      label: c.profileSections.contact,
      rows: [
        [c.profileFields.contactName, contact?.fullName ?? c.pendingOnboarding, UserRoundCheck],
        [c.profileFields.contactRole, contact?.role ?? c.pendingOnboarding, BriefcaseBusiness],
        [c.profileFields.contactEmail, contact?.email ?? c.pendingOnboarding, Mail],
        [c.profileFields.contactPhone, contact?.phone ?? c.pendingOnboarding, Phone],
      ],
    },
    {
      label: c.profileSections.relationship,
      rows: [
        [c.profileFields.relationshipManager, partnerSummary.relationshipManager ?? "—", UserRoundCheck],
        [c.profileFields.relationshipSince, partnerSummary.relationshipSince ? monthYear(partnerSummary.relationshipSince, lang) : "—", CalendarDays],
        [c.profileFields.profileReviewed, partnerSummary.profileReviewedAt ? monthYear(partnerSummary.profileReviewedAt, lang) : "—", Clock3],
      ],
    },
  ] as const;

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.desc}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(310px,0.75fr)]">
        <div className="min-w-0 space-y-8">
          <section className="overflow-hidden rounded-md border border-[#dfe4e9] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
            <dl className="grid border-b border-[#e2e7ea] sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-b border-[#e7ebee] px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7b8790]">
                  <span>{c.tierEyebrow}</span>
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        type="button"
                        className="grid size-6 shrink-0 place-items-center rounded border border-[#d8dfe4] bg-[#f8fafb] text-[#62727e] transition-colors hover:border-[#b9c4cb] hover:bg-white hover:text-[#17384e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98a3d]/45"
                        aria-label={c.viewTierScale}
                        title={c.viewTierScale}
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        align="start"
                        side="bottom"
                        sideOffset={8}
                        collisionPadding={16}
                        className="z-50 w-[min(23rem,calc(100vw-2rem))] rounded-md border border-[#d8dfe4] bg-white shadow-[0_14px_35px_rgba(10,28,43,0.16)] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                      >
                        <div className="flex items-start justify-between gap-4 border-b border-[#e4e9ec] px-4 py-3.5">
                          <div>
                            <p className="text-xs font-semibold normal-case tracking-normal text-[#1e3545]">{c.tierScale}</p>
                            <p className="mt-1 text-[10px] font-medium normal-case tracking-normal text-[#7b8790]">{c.tierScaleMeta}</p>
                          </div>
                          <Popover.Close asChild>
                            <button
                              type="button"
                              className="grid size-6 shrink-0 place-items-center rounded text-[#77858f] hover:bg-[#f0f3f5] hover:text-[#253d4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98a3d]/45"
                              aria-label={c.closeTierScale}
                            >
                              <X className="size-3.5" aria-hidden="true" />
                            </button>
                          </Popover.Close>
                        </div>
                        <dl>
                          {TIER_ORDER.map((tier, index) => {
                            const isCurrent = tier === partnerSummary.tier;
                            return (
                              <div
                                key={tier}
                                className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-[#e8ecef] px-4 py-3 last:border-b-0 ${isCurrent ? "bg-[#fbfaf6]" : "bg-white"}`}
                              >
                                <dt className="flex min-w-0 items-center gap-2 text-xs font-semibold normal-case tracking-normal text-[#2b414f]">
                                  <span>{c.tierLabels[tier]}</span>
                                  {isCurrent && <span className="rounded-sm border border-[#d8c58d] bg-[#f5eed9] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.06em] text-[#755c21]">{c.current}</span>}
                                </dt>
                                <dd className="text-xs font-semibold tabular-nums normal-case tracking-normal text-[#425764]">
                                  {compactMoney(PARTNER_TIER_THRESHOLDS[tier], lang)}{index === TIER_ORDER.length - 1 ? "+" : ""}
                                </dd>
                                <dd className="min-w-9 text-right text-xs font-semibold tabular-nums normal-case tracking-normal text-[#755c21]">
                                  {PARTNER_COMMISSION_ALLOCATIONS[tier]}%
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                        <Popover.Arrow className="fill-white drop-shadow-[0_-1px_0_#d8dfe4]" />
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </dt>
                <dd className="mt-2 font-serif text-2xl font-semibold text-[#102638]">{currentTier}</dd>
              </div>
              <div className="border-b border-[#e7ebee] px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
                <dt className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7b8790]">{c.annualCapital}</dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums text-[#102638]">{compactMoney(partnerSummary.annualClearedCapital, lang)}</dd>
              </div>
              <div className="border-b border-[#e7ebee] px-5 py-5 sm:border-b-0 lg:border-r sm:px-6">
                <dt className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7b8790]">{c.commissionAllocation}</dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums text-[#102638]">{PARTNER_COMMISSION_ALLOCATIONS[partnerSummary.tier]}%</dd>
              </div>
              <div className="px-5 py-5 sm:px-6">
                <dt className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#7b8790]">{c.nextThreshold(nextTier)}</dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums text-[#102638]">{compactMoney(partnerSummary.nextTierThreshold, lang)}</dd>
              </div>
            </dl>

            <div className="px-5 py-5 sm:px-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold text-[#253b4a]">{c.progressTo(nextTier)}</p>
                  <p className="mt-1 text-xs text-[#74808a]">{money(remaining, lang)} {c.remaining}</p>
                </div>
                <p className="text-xs font-semibold tabular-nums text-[#52636f]">
                  {compactMoney(partnerSummary.annualClearedCapital, lang)} / {compactMoney(partnerSummary.nextTierThreshold, lang)}
                </p>
              </div>
              <div
                className="mt-4 h-1 overflow-hidden bg-[#e5e9ec]"
                role="progressbar"
                aria-label={c.progressTo(nextTier)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div className="h-full bg-[#a98a3d]" style={{ width: `${progress}%` }} />
              </div>
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
            <div className="bg-[#fafbfc] px-5 py-5 sm:px-6 xl:px-5">
              <div className="flex min-w-0 items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#0a2d46] text-white">
                  <BadgeCheck className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 id="profile-heading" className="text-base font-semibold text-[#172e40]">{c.profile}</h2>
                </div>
              </div>
            </div>
            <div className="border-t border-[#e3e8eb]">
              {profileGroups.map((group) => (
                <section key={group.label} className="border-t border-[#dbe2e7] first:border-t-0">
                  <h3 className="bg-[#edf2f5] px-5 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#657682] sm:px-6 xl:px-5">
                    {group.label}
                  </h3>
                  <dl className="divide-y divide-[#e3e8eb]">
                    {group.rows.map(([label, value, Icon]) => (
                      <div key={label} className="grid min-w-0 bg-white sm:grid-cols-[minmax(210px,0.85fr)_minmax(0,1.15fr)] xl:grid-cols-1">
                        <dt className="flex min-w-0 items-center gap-3 bg-[#fafbfc] px-5 py-3.5 sm:px-6 xl:px-5">
                          <span className="grid size-8 shrink-0 place-items-center rounded bg-[#eef2f5] text-[#0a2d46]">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7d8994]">{label}</span>
                        </dt>
                        <dd className="flex min-w-0 items-center border-t border-[#e3e8eb] px-5 py-4 text-sm font-semibold leading-5 text-[#334955] sm:border-l sm:border-t-0 sm:px-6 sm:text-base xl:border-l-0 xl:border-t xl:px-5 xl:text-sm">
                          <span className={`break-words ${value === c.pendingOnboarding ? "font-medium text-[#7a8790]" : ""}`}>{value}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
