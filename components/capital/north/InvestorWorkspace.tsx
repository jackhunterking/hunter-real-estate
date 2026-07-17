"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  FileText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { usePortalAccess } from "./PortalAccessProvider";
import { NORTH_BASE } from "./NorthBrand";
import { PageHeader, Panel, SectionHeader, money, shortDate } from "./PortalUI";
import { InterestRequestsPanel } from "./InterestRequestsPanel";

const COPY = {
  tr: {
    eyebrow: "Yatırımcı çalışma alanı",
    title: "Yatırımcı paneli",
    description:
      "Fonları inceleyin, kendi yatırım başvurularınızı takip edin ve isterseniz lisanslı partner erişimine başvurun.",
    browse: "Fonları incele",
    investments: "Yatırım başvuruları",
    documents: "Belge merkezi",
    partner: "Partner durumu",
    noApplication: "Başvuru yapılmadı",
    apply: "Partner erişimine başvur",
    recent: "Son yatırım hareketleri",
    offering: "Fon",
    amount: "Tutar",
    status: "Durum",
    updated: "Güncelleme",
    none: "Henüz yatırım başvurunuz bulunmuyor.",
    review: "Uyum incelemesinde",
    submitted: "Gönderildi",
    funded: "Fonlandı",
    open: "Tüm yatırımları aç",
    privacy:
      "Kişisel yatırımlarınız firma çalışma alanlarından ayrıdır ve firma yöneticileriyle paylaşılmaz.",
  },
  en: {
    eyebrow: "Investor workspace",
    title: "Investor dashboard",
    description:
      "Review funds, track your own investment applications, and apply separately for licensed-partner access.",
    browse: "Browse funds",
    investments: "Investment applications",
    documents: "Document centre",
    partner: "Partner status",
    noApplication: "No application",
    apply: "Apply for partner access",
    recent: "Recent investment activity",
    offering: "Offering",
    amount: "Amount",
    status: "Status",
    updated: "Updated",
    none: "You do not have any investment applications yet.",
    review: "Compliance review",
    submitted: "Submitted",
    funded: "Funded",
    open: "Open all investments",
    privacy:
      "Your personal investments are separated from firm workspaces and are not shared with firm administrators.",
  },
} as const;

function investmentStatus(status: string, lang: "tr" | "en") {
  const labels: Record<string, { tr: string; en: string }> = {
    draft: { tr: "Taslak", en: "Draft" },
    submitted: { tr: "Gönderildi", en: "Submitted" },
    compliance_review: { tr: "Uyum incelemesi", en: "Compliance review" },
    approved_for_subscription: { tr: "Abonelik için onaylandı", en: "Approved for subscription" },
    accepted: { tr: "Kabul edildi", en: "Accepted" },
    funded: { tr: "Fonlandı", en: "Funded" },
    declined: { tr: "Reddedildi", en: "Declined" },
    withdrawn: { tr: "Geri çekildi", en: "Withdrawn" },
    closed: { tr: "Kapandı", en: "Closed" },
  };
  return labels[status]?.[lang] ?? status;
}

export function InvestorDashboard({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, currentApplication, dataset } = usePortalAccess();
  const c = COPY[lang];
  const investments = dataset.investments.filter((item) => item.userId === currentUser.id);

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        action={
          <Link href={`${NORTH_BASE}/funds`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">
            {c.browse}<ArrowRight className="size-4" />
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`${NORTH_BASE}/investments`}>
          <Panel className="h-full p-5 transition-colors hover:border-[#b7c5cf]">
            <WalletCards className="size-5 text-[#0a4b72]" />
            <p className="mt-4 text-xs font-semibold text-[#6e7983]">{c.investments}</p>
            <p className="mt-2 text-2xl font-semibold text-[#102638]">{investments.length}</p>
          </Panel>
        </Link>
        <Link href={`${NORTH_BASE}/documents`}>
          <Panel className="h-full p-5 transition-colors hover:border-[#b7c5cf]">
            <FileText className="size-5 text-[#0a4b72]" />
            <p className="mt-4 text-xs font-semibold text-[#6e7983]">{c.documents}</p>
            <p className="mt-2 text-2xl font-semibold text-[#102638]">{offerings.flatMap((item) => item.documents).length}</p>
          </Panel>
        </Link>
        <Link href={`${NORTH_BASE}/partner/apply`}>
          <Panel className="h-full p-5 transition-colors hover:border-[#b7c5cf]">
            <BadgeCheck className="size-5 text-[#0a4b72]" />
            <p className="mt-4 text-xs font-semibold text-[#6e7983]">{c.partner}</p>
            <p className="mt-2 text-lg font-semibold text-[#102638]">
              {currentApplication?.status ?? c.noApplication}
            </p>
          </Panel>
        </Link>
      </div>

      <div className="mt-6 flex gap-3 rounded-md border border-[#cbdde8] bg-[#edf5f9] p-4 text-sm leading-6 text-[#365b70]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <p>{c.privacy}</p>
      </div>

      <div className="mt-8">
        <SectionHeader
          title={c.recent}
          action={<Link href={`${NORTH_BASE}/investments`} className="text-xs font-semibold text-[#0a4b72] hover:underline">{c.open}</Link>}
        />
        <Panel className="overflow-hidden">
          {investments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
                  <tr>
                    {[c.offering, c.amount, c.status, c.updated].map((label) => <th key={label} className="border-b border-[#e2e6e9] px-5 py-3">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => {
                    const offering = offerings.find((item) => item.id === investment.offeringId);
                    return (
                      <tr key={investment.id} className="border-b border-[#edf0f2] last:border-0">
                        <td className="px-5 py-4 font-semibold text-[#293d49]">{offering?.shortName[lang] ?? investment.offeringId}</td>
                        <td className="px-5 py-4 text-[#63717c]">{money(investment.amount, lang)}</td>
                        <td className="px-5 py-4"><span className="rounded bg-[#edf2f5] px-2 py-1 text-[10px] font-bold text-[#486474]">{investmentStatus(investment.status, lang)}</span></td>
                        <td className="px-5 py-4 text-[#63717c]">{shortDate(investment.updatedAt.slice(0, 10), lang)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <Clock3 className="mx-auto size-6 text-[#82909a]" />
              <p className="mt-3 text-sm text-[#65717e]">{c.none}</p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function InvestmentsView({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, dataset } = usePortalAccess();
  const c = COPY[lang];
  const investments = dataset.investments.filter((item) => item.userId === currentUser.id);

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.investments}
        description={c.privacy}
        action={<Link href={`${NORTH_BASE}/funds`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.browse}<ArrowRight className="size-4" /></Link>}
      />
      <div className="grid gap-4">
        {investments.map((investment) => {
          const offering = offerings.find((item) => item.id === investment.offeringId);
          return (
            <Panel key={investment.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#71808b]">{investmentStatus(investment.status, lang)}</p>
                  <h2 className="mt-2 text-lg font-semibold text-[#193143]">{offering?.shortName[lang] ?? investment.offeringId}</h2>
                  <p className="mt-2 text-xs text-[#73808a]">{c.updated}: {shortDate(investment.updatedAt.slice(0, 10), lang)}</p>
                </div>
                <p className="text-xl font-semibold text-[#102638]">{money(investment.amount, lang)}</p>
              </div>
            </Panel>
          );
        })}
        {!investments.length && <Panel className="p-12 text-center text-sm text-[#65717e]">{c.none}</Panel>}
      </div>
    </div>
  );
}

export function ProfileView({ offerings = [] }: { offerings?: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, currentOrganization, currentMembership, backendConfigured } = usePortalAccess();
  const c = COPY[lang];

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={lang === "tr" ? "Profil" : "Profile"} description={c.privacy} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-6">
          <ShieldCheck className="size-6 text-[#0a4b72]" />
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="text-xs font-semibold text-[#75818b]">{lang === "tr" ? "Ad" : "Name"}</dt><dd className="mt-1 font-semibold text-[#243845]">{currentUser.displayName}</dd></div>
            <div><dt className="text-xs font-semibold text-[#75818b]">{lang === "tr" ? "E-posta" : "Email"}</dt><dd className="mt-1 text-[#243845]">{currentUser.email}</dd></div>
            <div><dt className="text-xs font-semibold text-[#75818b]">{lang === "tr" ? "Hesap" : "Account"}</dt><dd className="mt-1 text-[#243845]">{currentUser.accountStatus}</dd></div>
          </dl>
        </Panel>
        <Panel className="p-6">
          <Building2 className="size-6 text-[#0a4b72]" />
          <h2 className="mt-5 font-semibold text-[#243845]">{lang === "tr" ? "Firma bağlantısı" : "Firm association"}</h2>
          <p className="mt-2 text-sm text-[#65717e]">{currentOrganization?.legalName ?? (lang === "tr" ? "Aktif firma bağlantısı yok" : "No active firm association")}</p>
          {currentMembership && <p className="mt-3 text-xs text-[#75818b]">{currentMembership.workEmail}</p>}
        </Panel>
        <InterestRequestsPanel offerings={offerings} enabled={backendConfigured} />
      </div>
    </div>
  );
}
