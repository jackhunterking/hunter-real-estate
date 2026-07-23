"use client";

import { CheckCircle2, CircleAlert, Globe2, Mail, MapPin } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { PartnerApplicationView } from "./PartnerApplicationView";
import { PageHeader, Panel, SectionHeader } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";
import { InvestorSelfCheckButton } from "./InvestorSelfCheckButton";
import { selfCheckCategoryLabel } from "./InvestorSelfCheck";

const COPY = {
  tr: {
    title: "Profil",
    description: "Hesap bilgilerinizi, doğrulama durumunuzu ve profesyonel erişiminizi yönetin.",
    accountType: "Hesap türü",
    investorType: "Yatırımcı türü",
    accountStatus: "Hesap durumu",
    active: "Aktif",
    suspended: "Askıya alınmış",
    investorAccount: "Yatırımcı hesabı",
    individual: "Bireysel yatırımcı",
    entity: "Kurumsal yatırımcı",
    accountInformation: "Hesap bilgileri",
    accountDetails: "Hesap ayrıntıları",
    email: "E-posta adresi",
    verified: "Doğrulandı",
    unverified: "Doğrulanmadı",
    residence: "İkamet bölgesi",
    notProvided: "Belirtilmedi",
    language: "Tercih edilen dil",
    turkish: "Türkçe",
    english: "English",
    professionalAccess: "Profesyonel erişim",
    professionalAccessMeta: "Lisans, firma bağlantısı ve profesyonel çalışma alanı durumunuz.",
  },
  en: {
    title: "Profile",
    description: "Manage your account information, verification status, and professional access.",
    accountType: "Account type",
    investorType: "Investor type",
    accountStatus: "Account status",
    active: "Active",
    suspended: "Suspended",
    investorAccount: "Investor account",
    individual: "Individual investor",
    entity: "Entity investor",
    accountInformation: "Account information",
    accountDetails: "Account details",
    email: "Email address",
    verified: "Verified",
    unverified: "Not verified",
    residence: "Residence jurisdiction",
    notProvided: "Not provided",
    language: "Preferred language",
    turkish: "Türkçe",
    english: "English",
    professionalAccess: "Professional access",
    professionalAccessMeta: "Your licence, firm association, and professional workspace status.",
  },
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toLocaleUpperCase();
}

export function ProfileView() {
  const { lang, setLang } = useLang();
  const { currentUser } = usePortalAccess();
  const c = pick(COPY, lang);
  const accountType = currentUser.investorAccountType === "individual"
    ? c.individual
    : currentUser.investorAccountType === "entity"
      ? c.entity
      : c.investorAccount;
  // Prefer the persisted qualification band; fall back to the coarse account
  // type until the investor completes the self-check at least once.
  const investorTypeLabel = currentUser.investorQualificationCategory
    ? selfCheckCategoryLabel(currentUser.investorQualificationCategory, lang)
    : accountType;
  const accountActive = currentUser.accountStatus === "active";

  const detailFields = [
    {
      label: c.email,
      value: currentUser.email,
      icon: Mail,
      badge: (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${currentUser.emailVerified ? "text-[#326449]" : "text-[#8a4b42]"}`}>
          {currentUser.emailVerified ? <CheckCircle2 className="size-3" /> : <CircleAlert className="size-3" />}
          {currentUser.emailVerified ? c.verified : c.unverified}
        </span>
      ),
    },
    {
      label: c.residence,
      value: currentUser.residenceJurisdiction ?? c.notProvided,
      icon: MapPin,
      badge: undefined,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <PageHeader title={c.title} description={c.description} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Identity rail — who this account belongs to, and its standing. */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Panel className="p-6">
            <div className="flex flex-col items-center text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-[#0a2d46] text-lg font-bold tracking-[0.04em] text-white" aria-hidden="true">
                {initials(currentUser.displayName)}
              </span>
              <h2 className="mt-4 w-full truncate text-lg font-semibold text-[#172e3e]">{currentUser.displayName}</h2>
              <p className="mt-1 text-xs text-[#77838c]">{c.investorType}</p>
              <p className="text-sm font-semibold text-[#415563]">{investorTypeLabel}</p>
              <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${accountActive ? "bg-[#e8f2ec] text-[#326449]" : "bg-[#fbefed] text-[#8a4b42]"}`}>
                <span className="size-1.5 rounded-full bg-current opacity-75" />
                {accountActive ? c.active : c.suspended}
              </span>
            </div>
            <div className="mt-5 border-t border-[#e7ebee] pt-5">
              <InvestorSelfCheckButton className="w-full" />
            </div>
          </Panel>
        </aside>

        {/* Detail column — editable / factual account fields and pro access. */}
        <div className="flex flex-col gap-8">
          <section aria-label={c.accountDetails}>
            <SectionHeader title={c.accountDetails} />
            <Panel className="overflow-hidden">
              <dl className="divide-y divide-[#eaeef1]">
                {detailFields.map(({ label, value, icon: Icon, badge }) => (
                  <div key={label} className="flex min-w-0 items-start gap-3.5 px-5 py-4 sm:px-6">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#eef2f4] text-[#31546a]">
                      <Icon className="size-[17px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <dt className="text-xs text-[#77838c]">{label}</dt>
                        {badge}
                      </div>
                      <dd className="mt-1 break-words text-sm font-semibold text-[#263c4a]">{value}</dd>
                    </div>
                  </div>
                ))}
                {/* Language is changed right here in the profile (no menu-bar switch). */}
                <div className="flex min-w-0 items-center gap-3.5 px-5 py-4 sm:px-6">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#eef2f4] text-[#31546a]">
                    <Globe2 className="size-[17px]" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <dt className="text-xs text-[#77838c]">{c.language}</dt>
                    <dd>
                      <div className="inline-flex rounded-md border border-[#d5dde2] p-0.5" role="group" aria-label={c.language}>
                        {(["tr", "en"] as const).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setLang(item)}
                            aria-pressed={lang === item}
                            className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                              lang === item ? "bg-[#0a2d46] text-white" : "text-[#5a6b76] hover:text-[#0a2d46]"
                            }`}
                          >
                            {item === "tr" ? c.turkish : c.english}
                          </button>
                        ))}
                      </div>
                    </dd>
                  </div>
                </div>
              </dl>
            </Panel>
          </section>

          <section aria-label={c.professionalAccess}>
            <SectionHeader title={c.professionalAccess} meta={c.professionalAccessMeta} />
            <PartnerApplicationView embedded />
          </section>
        </div>
      </div>
    </div>
  );
}
