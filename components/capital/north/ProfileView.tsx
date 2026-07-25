"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, CircleAlert, Globe2, Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { canUseWorkspace } from "@/lib/capital/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { LanguageSelect } from "./LanguageSelect";
import { NORTH_BASE } from "./NorthBrand";
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
    accountHolder: "Hesap sahibi",
    email: "E-posta adresi",
    verified: "Doğrulandı",
    unverified: "Doğrulanmadı",
    residence: "İkamet bölgesi",
    notProvided: "Belirtilmedi",
    language: "Tercih edilen dil",
    professionalAccess: "Profesyonel erişim",
    professionalAccessMeta: "Lisans, firma bağlantısı ve profesyonel çalışma alanı durumunuz.",
    staffAccess: "Ekip erişimi",
    adminConsole: "Yönetim konsolu",
    adminConsoleMeta: "Yatırımlar, kişiler, firmalar, ödemeler, içerik ve sistem kayıtları.",
    openAdminConsole: "Yönetim konsolunu aç",
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
    accountHolder: "Account holder",
    email: "Email address",
    verified: "Verified",
    unverified: "Not verified",
    residence: "Residence jurisdiction",
    notProvided: "Not provided",
    language: "Preferred language",
    professionalAccess: "Professional access",
    professionalAccessMeta: "Your licence, firm association, and professional workspace status.",
    staffAccess: "Staff access",
    adminConsole: "Admin console",
    adminConsoleMeta: "Investments, people, firms, payments, content and system records.",
    openAdminConsole: "Open the Admin console",
  },
  fr: {
    title: "Profil",
    description: "Gérez les informations de votre compte, votre statut de vérification et votre accès professionnel.",
    accountType: "Type de compte",
    investorType: "Type d'investisseur",
    accountStatus: "Statut du compte",
    active: "Actif",
    suspended: "Suspendu",
    investorAccount: "Compte investisseur",
    individual: "Investisseur individuel",
    entity: "Investisseur — personne morale",
    accountInformation: "Informations du compte",
    accountDetails: "Détails du compte",
    accountHolder: "Titulaire du compte",
    email: "Adresse courriel",
    verified: "Vérifiée",
    unverified: "Non vérifiée",
    residence: "Territoire de résidence",
    notProvided: "Non renseigné",
    language: "Langue préférée",
    professionalAccess: "Accès professionnel",
    professionalAccessMeta: "Votre permis, votre firme et le statut de votre espace professionnel.",
    staffAccess: "Accès de l'équipe",
    adminConsole: "Console d'administration",
    adminConsoleMeta: "Placements, personnes, firmes, paiements, contenus et registres système.",
    openAdminConsole: "Ouvrir la console d'administration",
  },
  es: {
    title: "Perfil",
    description: "Gestione la información de su cuenta, su estado de verificación y su acceso profesional.",
    accountType: "Tipo de cuenta",
    investorType: "Tipo de inversor",
    accountStatus: "Estado de la cuenta",
    active: "Activa",
    suspended: "Suspendida",
    investorAccount: "Cuenta de inversor",
    individual: "Inversor individual",
    entity: "Inversor persona jurídica",
    accountInformation: "Información de la cuenta",
    accountDetails: "Detalles de la cuenta",
    accountHolder: "Titular de la cuenta",
    email: "Correo electrónico",
    verified: "Verificado",
    unverified: "Sin verificar",
    residence: "Jurisdicción de residencia",
    notProvided: "No indicado",
    language: "Idioma preferido",
    professionalAccess: "Acceso profesional",
    professionalAccessMeta: "Su licencia, su firma y el estado de su espacio profesional.",
    staffAccess: "Acceso del equipo",
    adminConsole: "Consola de administración",
    adminConsoleMeta: "Inversiones, personas, firmas, pagos, contenidos y registros del sistema.",
    openAdminConsole: "Abrir la consola de administración",
  },
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toLocaleUpperCase();
}

export function ProfileView() {
  const { lang } = useLang();
  const { currentUser, context } = usePortalAccess();
  const c = pick(COPY, lang);
  // The Admin console has no place in the sidebar; staff open it from here, and
  // everyone else never learns it exists. The route stays gated on its own.
  const staff = canUseWorkspace(context, "operations");
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
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8">
      <PageHeader title={c.title} description={c.description} />

      {/* Identity band — a single account-holder row in the same tile language
          as Account details, so the panels read as one uniform system. */}
      <Panel className="overflow-hidden">
        <div className="flex min-w-0 items-center gap-3.5 px-5 py-4 sm:px-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#0a2d46] text-[11px] font-bold tracking-[0.04em] text-white" aria-hidden="true">
            {initials(currentUser.displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#77838c]">{c.accountHolder}</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#263c4a]">{currentUser.displayName}</p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${accountActive ? "bg-[#e8f2ec] text-[#326449]" : "bg-[#fbefed] text-[#8a4b42]"}`}>
            <span className="size-1.5 rounded-full bg-current opacity-75" />
            {accountActive ? c.active : c.suspended}
          </span>
        </div>
      </Panel>

      <section aria-label={c.accountDetails}>
        <SectionHeader title={c.accountDetails} />
        {/* No `overflow-hidden` here: the language dropdown opens out of the
            last row and must not be clipped. Rows carry no background of their
            own, so nothing bleeds past the rounded corners without it. */}
        <Panel>
          <dl className="divide-y divide-[#eaeef1]">
            {/* Investor type lives with the account fields; Re-check updates it. */}
            <div className="flex min-w-0 items-center gap-3.5 px-5 py-4 sm:px-6">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#eef2f4] text-[#31546a]">
                <UserRound className="size-[17px]" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-[#77838c]">{c.investorType}</dt>
                <dd className="mt-1 truncate text-sm font-semibold text-[#263c4a]">{investorTypeLabel}</dd>
              </div>
              <InvestorSelfCheckButton className="shrink-0" />
            </div>
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
            {/* Language is changed right here in the profile (no menu-bar
                switch) — same four-locale dropdown the landing header uses. */}
            <div className="flex min-w-0 items-center gap-3.5 px-5 py-4 sm:px-6">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#eef2f4] text-[#31546a]">
                <Globe2 className="size-[17px]" />
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <dt className="text-xs text-[#77838c]">{c.language}</dt>
                <dd>
                  <LanguageSelect variant="inline" ariaLabel={c.language} />
                </dd>
              </div>
            </div>
          </dl>
        </Panel>
      </section>

      {staff && (
        <section aria-label={c.staffAccess}>
          <SectionHeader title={c.staffAccess} />
          <Panel className="overflow-hidden">
            <Link
              href={`${NORTH_BASE}/admin`}
              aria-label={c.openAdminConsole}
              className="flex min-w-0 items-center gap-3.5 px-5 py-4 transition-colors hover:bg-[#f7f9fa] sm:px-6"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#eef2f4] text-[#31546a]">
                <ShieldCheck className="size-[17px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#263c4a]">{c.adminConsole}</p>
                <p className="mt-1 text-xs text-[#77838c]">{c.adminConsoleMeta}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-[#8b96a0]" />
            </Link>
          </Panel>
        </section>
      )}
    </div>
  );
}
