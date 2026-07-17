"use client";

import Link from "next/link";
import { BadgeCheck, Building2, CircleDollarSign, FileText, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import type { OfferingBundle, PartnerTier } from "@/lib/capital/types";
import { PARTNER_COMMISSION_ALLOCATIONS, PARTNER_TIER_THRESHOLDS, nextPartnerTier } from "@/lib/capital/commissions";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { usePortalAccess } from "./PortalAccessProvider";
import { NORTH_BASE } from "./NorthBrand";
import { PageHeader, Panel, money, shortDate } from "./PortalUI";

const TIERS: PartnerTier[] = ["associate", "principal", "managingPartner"];
const LABELS = {
  tr: {
    eyebrow: "Partner hesabı",
    title: "Partnerlik özeti",
    description: "Kişisel yatırım erişiminizden ayrı olan doğrulanmış firma, müşteri, fon ve komisyon görünümü.",
    noAccount: "Partner hesabınız henüz etkin değil. Yatırımcı erişiminiz devam eder; firma ve komisyon araçları yalnızca bağımsız doğrulama kapıları tamamlandığında açılır.",
    application: "Başvuru durumunu görüntüle",
    tier: "Mevcut kademe",
    capital: "Yıllık kabul edilen sermaye",
    clients: "Atanmış müşteriler",
    funds: "Firma fonları",
    commission: "Görülebilir komisyon",
    progress: "Sonraki kademeye ilerleme",
    organization: "Doğrulanmış firma",
    membership: "Üyelik ve lisans",
    recent: "Son müşteri tanıştırmaları",
    none: "Henüz kayıt yok.",
  },
  en: {
    eyebrow: "Partner account",
    title: "Partnership overview",
    description: "A live view of the verified firm, clients, funds, and commissions kept separate from your personal investor access.",
    noAccount: "Your partner account is not active yet. Investor access continues, while firm and commission tools open only after the independent verification gates are complete.",
    application: "View application status",
    tier: "Current tier",
    capital: "Annual accepted capital",
    clients: "Assigned clients",
    funds: "Firm funds",
    commission: "Visible commissions",
    progress: "Progress to next tier",
    organization: "Verified firm",
    membership: "Membership and licence",
    recent: "Recent client introductions",
    none: "No records yet.",
  },
} as const;

export function PartnershipOverview({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, currentOrganization, currentMembership, currentApplication, dataset, commissions } = usePortalAccess();
  const c = LABELS[lang];
  const account = dataset.partnerAccounts.find((item) => item.userId === currentUser.id);
  const referrals = dataset.referrals.filter((item) => item.ownerUserId === currentUser.id);
  const tier = account?.tier ?? "associate";
  const nextTier = nextPartnerTier(tier);
  const threshold = nextTier ? PARTNER_TIER_THRESHOLDS[nextTier] : PARTNER_TIER_THRESHOLDS.managingPartner;
  const progress = nextTier ? Math.min(((account?.annualClearedCapital ?? 0) / threshold) * 100, 100) : 100;
  const accessibleIds = new Set(dataset.offeringAccess.filter((item) => item.organizationId === currentOrganization?.id && ["approved", "on_shelf"].includes(item.status)).map((item) => item.offeringId));
  const accessibleOfferings = offerings.filter((item) => accessibleIds.has(item.id));
  const visibleCommissionTotal = commissions.filter((item) => item.status === "approved" || item.status === "paid").reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />
      {!account || account.status !== "active" ? (
        <Panel className="border-[#dbc990] bg-[#fffaf0] p-6">
          <ShieldCheck className="size-6 text-[#8a6c24]" />
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#66572f]">{c.noAccount}</p>
          <Link href={`${NORTH_BASE}/partner/apply`} className="mt-5 inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.application}</Link>
        </Panel>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              [c.tier, tier === "managingPartner" ? "Managing Partner" : tier[0].toUpperCase() + tier.slice(1), BadgeCheck],
              [c.capital, money(account.annualClearedCapital, lang), TrendingUp],
              [c.clients, String(referrals.length), UsersRound],
              [c.funds, String(accessibleOfferings.length), FileText],
              [c.commission, money(visibleCommissionTotal, lang), CircleDollarSign],
            ].map(([label, value, Icon]) => <Panel key={String(label)} className="p-5"><Icon className="size-5 text-[#0a4b72]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#75818b]">{String(label)}</p><p className="mt-2 text-xl font-semibold text-[#193143]">{String(value)}</p></Panel>)}
          </div>

          <Panel className="mt-4 p-6">
            <div className="flex flex-wrap justify-between gap-3 text-sm"><p className="font-semibold text-[#243845]">{c.progress}{nextTier ? ` · ${nextTier === "managingPartner" ? "Managing Partner" : "Principal"}` : ""}</p><p className="text-[#64727d]">{money(account.annualClearedCapital, lang)} / {money(threshold, lang)} · {PARTNER_COMMISSION_ALLOCATIONS[tier]}%</p></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8ecef]"><div className="h-full bg-[#b79442]" style={{ width: `${progress}%` }} /></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">{TIERS.map((item) => <div key={item} className={`rounded-md border p-3 ${item === tier ? "border-[#b79442] bg-[#fffaf0]" : "border-[#e0e4e7]"}`}><p className="text-xs font-semibold text-[#314653]">{item === "managingPartner" ? "Managing Partner" : item[0].toUpperCase() + item.slice(1)}</p><p className="mt-1 text-[10px] text-[#75818b]">{money(PARTNER_TIER_THRESHOLDS[item], lang)} · {PARTNER_COMMISSION_ALLOCATIONS[item]}%</p></div>)}</div>
          </Panel>
        </>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel className="p-6"><Building2 className="size-6 text-[#0a4b72]" /><h2 className="mt-4 font-semibold text-[#243845]">{c.organization}</h2><p className="mt-3 text-sm text-[#596873]">{currentOrganization?.legalName ?? "—"}</p><p className="mt-1 text-xs text-[#75818b]">{currentOrganization?.businessDomain ?? currentOrganization?.website ?? "—"}</p></Panel>
        <Panel className="p-6"><BadgeCheck className="size-6 text-[#0a4b72]" /><h2 className="mt-4 font-semibold text-[#243845]">{c.membership}</h2><p className="mt-3 text-sm text-[#596873]">{currentMembership?.registeredName ?? currentUser.displayName}</p><p className="mt-1 text-xs text-[#75818b]">{currentMembership?.licenceType ?? currentApplication?.licenceType ?? "—"} · {currentMembership?.verificationStatus ?? currentApplication?.status ?? "—"}</p></Panel>
      </div>

      <Panel className="mt-5 overflow-hidden"><div className="border-b border-[#e4e8eb] px-5 py-4"><h2 className="font-semibold text-[#243845]">{c.recent}</h2></div>{referrals.length ? referrals.slice(0, 5).map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-[#edf0f2] px-5 py-4 text-sm last:border-0"><div><p className="font-semibold text-[#314653]">{item.displayName}</p><p className="mt-1 text-xs text-[#75818b]">{offerings.find((offering) => offering.id === item.offeringId)?.shortName[lang] ?? item.offeringId ?? "—"}</p></div><div className="text-right"><p className="text-xs font-semibold text-[#52616d]">{item.status}</p><p className="mt-1 text-[10px] text-[#849099]">{shortDate(item.updatedAt.slice(0, 10), lang)}</p></div></div>) : <p className="p-8 text-sm text-[#75818b]">{c.none}</p>}</Panel>
    </div>
  );
}
