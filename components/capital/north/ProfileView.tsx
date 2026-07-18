"use client";

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  CheckCircle2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  PARTNER_COMMISSION_ALLOCATIONS,
  PARTNER_TIER_THRESHOLDS,
  nextPartnerTier,
} from "@/lib/capital/commissions";
import { professionalProfileState } from "@/lib/capital/portal-access";
import type { PartnerTier } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { PartnerApplicationView } from "./PartnerApplicationView";
import { PageHeader, SectionHeader, money, shortDate } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";

const TIERS: PartnerTier[] = ["associate", "principal", "managingPartner"];

const COPY = {
  tr: {
    eyebrow: "Hesap",
    title: "Profil",
    accountType: "Hesap türü",
    accountStatus: "Aktif hesap",
    suspended: "Askıya alınmış",
    investorAccount: "Yatırımcı hesabı",
    individual: "Bireysel yatırımcı",
    entity: "Kurumsal yatırımcı",
    applicant: "Profesyonel başvuru sahibi",
    partner: "Profesyonel partner",
    programTitle: "Partner programı",
    programMeta: "Yıllık kabul edilen sermayeniz büyüdükçe fonun yayımladığı brüt komisyonundan aldığınız pay artar.",
    annualCapital: "Yıllık kabul edilen sermaye",
    commissionShare: "Yayımlanan fon komisyonundan pay",
    commissionDescription: "İlgili fon sayfasında yayımlanan brüt komisyon tutarına uygulanan partner payı.",
    currentTier: "Mevcut kademe",
    current: "Mevcut kademeniz",
    progress: "Sonraki kademeye ilerleme",
    remaining: "kaldı",
    topTier: "En üst kademeye ulaşıldı",
    firm: "Firma",
    licence: "Lisans",
    since: "Başlangıç",
    verified: "Doğrulandı",
    bands: {
      associate: "1.000.000 CA$ altı",
      principal: "1.000.000 CA$–5.000.000 CA$ altı",
      managingPartner: "5.000.000 CA$ ve üzeri",
    } as Record<PartnerTier, string>,
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
  },
  en: {
    eyebrow: "Account",
    title: "Profile",
    accountType: "Account type",
    accountStatus: "Active account",
    suspended: "Suspended",
    investorAccount: "Investor Account",
    individual: "Individual Investor",
    entity: "Entity Investor",
    applicant: "Professional Applicant",
    partner: "Professional Partner",
    programTitle: "Partner program",
    programMeta: "As your annual cleared capital grows, so does your share of the gross commission published by each fund.",
    annualCapital: "Annual cleared capital",
    commissionShare: "Share of published fund commission",
    commissionDescription: "The partner allocation applied to the gross commission posted on the relevant fund page.",
    currentTier: "Current tier",
    current: "Your current tier",
    progress: "Progress to the next tier",
    remaining: "remaining",
    topTier: "Top tier reached",
    firm: "Firm",
    licence: "Licence",
    since: "Since",
    verified: "Verified",
    bands: {
      associate: "Below CA$1,000,000",
      principal: "CA$1,000,000 to below CA$5,000,000",
      managingPartner: "CA$5,000,000 and above",
    } as Record<PartnerTier, string>,
    tierLabels: {
      associate: "Associate",
      principal: "Principal",
      managingPartner: "Managing Partner",
    } as Record<PartnerTier, string>,
  },
} as const;

export function ProfileView() {
  const { lang } = useLang();
  const {
    currentUser,
    currentOrganization,
    currentMembership,
    context,
    dataset,
  } = usePortalAccess();
  const c = COPY[lang];
  const professionalState = professionalProfileState(context);
  const activePartner = professionalState === "active";
  const showProgram = professionalState !== "not_applied";
  const [applicationOpen, setApplicationOpen] = useState(false);

  const account = dataset.partnerAccounts.find((item) => item.userId === currentUser.id);
  const tier = account?.tier ?? "associate";
  const nextTier = nextPartnerTier(tier);
  const nextThreshold = nextTier
    ? PARTNER_TIER_THRESHOLDS[nextTier]
    : PARTNER_TIER_THRESHOLDS.managingPartner;
  const progress = nextTier
    ? Math.min(((account?.annualClearedCapital ?? 0) / nextThreshold) * 100, 100)
    : 100;
  const remaining = Math.max(nextThreshold - (account?.annualClearedCapital ?? 0), 0);

  const baseAccountType = currentUser.investorAccountType === "individual"
    ? c.individual
    : currentUser.investorAccountType === "entity"
      ? c.entity
      : c.investorAccount;
  const accountType = activePartner
    ? `${baseAccountType} · ${c.partner}`
    : professionalState !== "not_applied"
      ? `${baseAccountType} · ${c.applicant}`
      : baseAccountType;

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <PageHeader eyebrow={c.eyebrow} title={c.title} />

      <section className="overflow-hidden rounded-xl border border-[#dce3e7] bg-white shadow-[0_12px_36px_rgba(15,42,58,0.05)]" aria-label={c.accountType}>
        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#edf2f5] text-[#0a2d46]">
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-[#213746]">{currentUser.displayName}</h2>
              <p className="mt-1 truncate text-sm text-[#697782]">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#e8ecee] pt-4 sm:flex-row sm:items-center md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="min-w-0 sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a8790]">{c.accountType}</p>
              <p className="mt-1 text-sm font-semibold text-[#2d414e]">{accountType}</p>
            </div>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${currentUser.accountStatus === "active" ? "bg-[#e8f2ec] text-[#2d6849]" : "bg-[#fbefed] text-[#87483f]"}`}>
              <CheckCircle2 className="size-3.5" />
              {currentUser.accountStatus === "active" ? c.accountStatus : c.suspended}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <PartnerApplicationView
          embedded
          formOpen={applicationOpen}
          onFormOpenChange={setApplicationOpen}
        />
      </div>

      {showProgram && (
        <section id="partner-program" className="mt-9 scroll-mt-6" aria-label={c.programTitle}>
          <SectionHeader title={c.programTitle} meta={c.programMeta} />

          {activePartner && account && (
            <div className="mb-5 overflow-hidden rounded-xl border border-[#17384e] bg-[#082337] text-white shadow-[0_16px_42px_rgba(7,28,44,0.12)]">
              <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(360px,1.2fr)] lg:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/58">{c.currentTier}</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold">{c.tierLabels[tier]}</h2>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">{c.annualCapital}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{money(account.annualClearedCapital, lang)}</p>
                </div>
                <div className="rounded-lg border border-white/12 bg-white/[0.055] p-4 sm:p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{nextTier ? `${c.progress} · ${c.tierLabels[nextTier]}` : c.topTier}</p>
                      {nextTier && <p className="mt-1 text-xs text-white/58">{money(remaining, lang)} {c.remaining}</p>}
                    </div>
                    <p className="text-xl font-semibold tabular-nums text-[#e6cd88]">{Math.round(progress)}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label={c.progress}>
                    <div className="h-full rounded-full bg-[#c5a34d]" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-3">
                    <div><p className="text-white/48">{c.firm}</p><p className="mt-1 font-semibold text-white/90">{currentOrganization?.tradingName ?? currentOrganization?.legalName ?? "—"}</p></div>
                    <div><p className="text-white/48">{c.licence}</p><p className="mt-1 font-semibold text-white/90">{currentMembership?.verificationStatus === "verified" ? c.verified : currentMembership?.verificationStatus ?? "—"}</p></div>
                    <div><p className="text-white/48">{c.since}</p><p className="mt-1 font-semibold text-white/90">{account.relationshipSince ? shortDate(account.relationshipSince, lang) : "—"}</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((item) => {
              const current = activePartner && item === tier;
              const Icon = item === "associate" ? BadgeCheck : item === "principal" ? TrendingUp : Building2;
              return (
                <article
                  key={item}
                  className={`relative flex min-h-[270px] flex-col overflow-hidden rounded-xl border p-5 shadow-[0_10px_30px_rgba(15,42,58,0.05)] sm:p-6 ${current ? "border-[#b9963e] bg-[#fffaf0]" : "border-[#dce3e7] bg-white"}`}
                >
                  {current && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#efe1b9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#70551f]">
                      {c.current}
                    </span>
                  )}
                  <span className={`grid size-11 place-items-center rounded-xl ${current ? "bg-[#b79442] text-white" : "bg-[#edf2f5] text-[#0a2d46]"}`}>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-serif text-2xl font-semibold text-[#173246]">{c.tierLabels[item]}</h3>
                  <p className="mt-1 text-sm font-medium text-[#687681]">{c.bands[item]}</p>
                  <div className="mt-6 border-t border-[#e4e8eb] pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7b8790]">{c.commissionShare}</p>
                    <div className="mt-2 flex items-end gap-2">
                      <p className="text-4xl font-semibold tabular-nums text-[#0a4b72]">{PARTNER_COMMISSION_ALLOCATIONS[item]}%</p>
                      <Award className="mb-1 size-5 text-[#b79442]" />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#6b7881]">{c.commissionDescription}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
