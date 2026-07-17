"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  firmRoles,
  hasPlatformRole,
  type PortalWorkspace,
  type PreviewPersona,
} from "@/lib/capital/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { usePortalAccess } from "./PortalAccessProvider";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const COPY = {
  tr: {
    workspace: "Çalışma alanı",
    workspaceNames: {
      investor: "Yatırımcı",
      partner: "Bireysel partner",
      firm: "Firma yönetimi",
      admin: "Hunter North",
    },
    account: "Hesap",
    signOut: "Güvenli çıkış",
    menu: "Menü",
    collapseMenu: "Menüyü daralt",
    expandMenu: "Menüyü genişlet",
    preview: "Gizlilik önizlemesi",
    previewNames: {
      investor: "Yatırımcı",
      applicant: "Partner adayı",
      partner: "Aktif partner",
      "firm-admin": "Firma yöneticisi",
      "hnc-admin": "HNC yöneticisi",
    },
    resources: "Kaynaklar",
    accessDenied: "Bu çalışma alanına erişiminiz yok.",
    accessDeniedBody:
      "İstenen ekran mevcut onaylarınız ve firma izinleriniz kapsamında değil. Yatırımcı erişiminiz devam eder.",
    returnDashboard: "Yatırımcı paneline dön",
    backendPreview: "Yerel güvenlik önizlemesi",
  },
  en: {
    workspace: "Workspace",
    workspaceNames: {
      investor: "Investor",
      partner: "Individual partner",
      firm: "Firm administration",
      admin: "Hunter North",
    },
    account: "Account",
    signOut: "Secure sign out",
    menu: "Menu",
    collapseMenu: "Collapse menu",
    expandMenu: "Expand menu",
    preview: "Privacy preview",
    previewNames: {
      investor: "Investor",
      applicant: "Partner applicant",
      partner: "Active partner",
      "firm-admin": "Firm administrator",
      "hnc-admin": "HNC administrator",
    },
    resources: "Resources",
    accessDenied: "You do not have access to this workspace.",
    accessDeniedBody:
      "This screen is outside your current approvals and firm permissions. Your investor access remains available.",
    returnDashboard: "Return to investor dashboard",
    backendPreview: "Local security preview",
  },
} as const;

const NAVIGATION: Record<"tr" | "en", Record<PortalWorkspace, NavigationItem[]>> = {
  tr: {
    investor: [
      { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
      { href: "/funds", label: "Fonlar", icon: Building2 },
      { href: "/investments", label: "Yatırımlarım", icon: WalletCards },
      { href: "/documents", label: "Belgelerim", icon: FileText },
      { href: "/profile", label: "Profil", icon: UserRound },
      { href: "/partner/apply", label: "Partner başvurusu", icon: BadgeCheck },
    ],
    partner: [
      { href: "/partner", label: "Partner özeti", icon: LayoutDashboard },
      { href: "/funds", label: "Firma fonları", icon: PackageCheck },
      { href: "/clients", label: "Müşterilerim", icon: UsersRound },
      { href: "/commissions", label: "Dağıtım komisyonlarım", icon: HandCoins },
      { href: "/partner-program", label: "Partner kademem", icon: BriefcaseBusiness },
    ],
    firm: [
      { href: "/firm", label: "Firma özeti", icon: Building2 },
      { href: "/firm/members", label: "Üyelik onayları", icon: UsersRound },
      { href: "/firm/products", label: "Ürün rafı", icon: PackageCheck },
      { href: "/firm/commissions", label: "Firma dağıtım komisyonları", icon: CircleDollarSign },
    ],
    admin: [
      { href: "/admin/leads", label: "Lead gelen kutusu", icon: ClipboardCheck },
      { href: "/admin/interests", label: "Fon ilgi talepleri", icon: MessageSquareText },
      { href: "/admin/partner-applications", label: "Partner başvuruları", icon: ClipboardCheck },
      { href: "/admin/license-verifications", label: "SPL doğrulamaları", icon: BadgeCheck },
      { href: "/admin/firms", label: "Firmalar", icon: Building2 },
      { href: "/admin/firm-memberships", label: "Firma üyelikleri", icon: UsersRound },
      { href: "/admin/commissions", label: "Dağıtım komisyonu yönetimi", icon: HandCoins },
      { href: "/admin/audit", label: "Denetim kaydı", icon: ScrollText },
    ],
  },
  en: {
    investor: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/funds", label: "Funds", icon: Building2 },
      { href: "/investments", label: "My investments", icon: WalletCards },
      { href: "/documents", label: "My documents", icon: FileText },
      { href: "/profile", label: "Profile", icon: UserRound },
      { href: "/partner/apply", label: "Partner application", icon: BadgeCheck },
    ],
    partner: [
      { href: "/partner", label: "Partner overview", icon: LayoutDashboard },
      { href: "/funds", label: "Firm products", icon: PackageCheck },
      { href: "/clients", label: "My clients", icon: UsersRound },
      { href: "/commissions", label: "My distribution commissions", icon: HandCoins },
      { href: "/partner-program", label: "My partner tier", icon: BriefcaseBusiness },
    ],
    firm: [
      { href: "/firm", label: "Firm overview", icon: Building2 },
      { href: "/firm/members", label: "Membership approvals", icon: UsersRound },
      { href: "/firm/products", label: "Product shelf", icon: PackageCheck },
      { href: "/firm/commissions", label: "Firm distribution commissions", icon: CircleDollarSign },
    ],
    admin: [
      { href: "/admin/leads", label: "Lead inbox", icon: ClipboardCheck },
      { href: "/admin/interests", label: "Fund interest requests", icon: MessageSquareText },
      { href: "/admin/partner-applications", label: "Partner applications", icon: ClipboardCheck },
      { href: "/admin/license-verifications", label: "SPL verifications", icon: BadgeCheck },
      { href: "/admin/firms", label: "Firms", icon: Building2 },
      { href: "/admin/firm-memberships", label: "Firm memberships", icon: UsersRound },
      { href: "/admin/commissions", label: "Distribution commission admin", icon: HandCoins },
      { href: "/admin/audit", label: "Audit trail", icon: ScrollText },
    ],
  },
};

function workspaceDestination(workspace: PortalWorkspace) {
  if (workspace === "partner") return "/partner";
  if (workspace === "firm") return "/firm";
  if (workspace === "admin") return "/admin/leads";
  return "/dashboard";
}

export function NorthShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    currentOrganization,
    context,
    workspace,
    workspaces,
    previewEnabled,
    previewPersona,
    setPreviewPersona,
    setWorkspace,
    canAccess,
  } = usePortalAccess();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const c = COPY[lang];
  const roles = firmRoles(context);
  const nav = NAVIGATION[lang][workspace].filter((item) => {
    if (item.href === "/firm/commissions") return roles.includes("finance_admin");
    if (item.href === "/admin/commissions") {
      return hasPlatformRole(currentUser, "finance_admin", "platform_admin");
    }
    return true;
  });
  const allowed = canAccess(pathname);

  useEffect(() => {
    try {
      setDesktopCollapsed(window.localStorage.getItem("hnc-sidebar-collapsed") === "true");
    } catch {
      // Keep the default expanded state when storage is unavailable.
    }
  }, []);

  function toggleDesktopSidebar() {
    const next = !desktopCollapsed;
    setDesktopCollapsed(next);
    try {
      window.localStorage.setItem("hnc-sidebar-collapsed", String(next));
    } catch {
      // The toggle still works for this visit when storage is unavailable.
    }
  }

  function changeWorkspace(next: PortalWorkspace) {
    setWorkspace(next);
    setAccountOpen(false);
    setMobileOpen(false);
    router.push(`${NORTH_BASE}${workspaceDestination(next)}`);
  }

  function changePersona(next: PreviewPersona) {
    setPreviewPersona(next);
    setAccountOpen(false);
    router.push(`${NORTH_BASE}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#17202b]">
      <aside
        id="hnc-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#071c2c] text-white transition-[width,transform] duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          desktopCollapsed ? "lg:w-[84px]" : "lg:w-[280px]",
        )}
      >
        <button
          type="button"
          className="absolute -right-3 top-6 z-10 hidden size-7 place-items-center rounded-full border border-[#dfe4e9] bg-white text-[#44515f] shadow-sm transition-colors hover:border-[#c5a34d] hover:text-[#071c2c] lg:grid"
          onClick={toggleDesktopSidebar}
          aria-controls="hnc-sidebar"
          aria-expanded={!desktopCollapsed}
          aria-label={desktopCollapsed ? c.expandMenu : c.collapseMenu}
          title={desktopCollapsed ? c.expandMenu : c.collapseMenu}
        >
          {desktopCollapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
        </button>

        <div
          className={cn(
            "flex h-20 items-center justify-between border-b border-white/10 px-6",
            desktopCollapsed && "lg:justify-center lg:px-0",
          )}
        >
          <NorthBrand markOnlyOnDesktop={desktopCollapsed} />
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Hunter North Capital">
          <div className={cn("mb-3 px-3", desktopCollapsed && "lg:hidden")}>
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              {c.workspace}
              <select
                value={workspace}
                onChange={(event) => changeWorkspace(event.target.value as PortalWorkspace)}
                className="mt-2 h-10 w-full rounded-md border border-white/15 bg-white/8 px-3 text-sm font-semibold text-white outline-none"
              >
                {workspaces.map((item) => (
                  <option key={item} value={item} className="text-[#17202b]">
                    {c.workspaceNames[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const fullHref = `${NORTH_BASE}${href}`;
              const active = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
              return (
                <Link
                  key={href}
                  href={fullHref}
                  onClick={() => setMobileOpen(false)}
                  aria-label={label}
                  title={desktopCollapsed ? label : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    desktopCollapsed && "lg:justify-center lg:px-0",
                    active
                      ? "bg-white text-[#071c2c]"
                      : "text-white/72 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className={cn(desktopCollapsed && "lg:hidden")}>{label}</span>
                </Link>
              );
            })}
          </div>

          {workspace === "investor" && (
            <div className={cn("mt-8 border-t border-white/10 pt-5", desktopCollapsed && "lg:mt-5")}>
              <div className={cn("mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45", desktopCollapsed && "lg:hidden")}>
                {c.resources}
              </div>
              <Link
                href={`${NORTH_BASE}/resources/investor-readiness`}
                onClick={() => setMobileOpen(false)}
                aria-label="Investor readiness"
                title={desktopCollapsed ? "Investor readiness" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  desktopCollapsed && "lg:justify-center lg:px-0",
                  pathname === `${NORTH_BASE}/resources/investor-readiness`
                    ? "bg-white text-[#071c2c]"
                    : "text-white/72 hover:bg-white/8 hover:text-white",
                )}
              >
                <BookOpenText className="size-[18px]" />
                <span className={cn(desktopCollapsed && "lg:hidden")}>Investor readiness</span>
              </Link>
            </div>
          )}
        </nav>

        <div className={cn("border-t border-white/10 p-4", desktopCollapsed && "lg:p-3")}>
          {previewEnabled && (
            <label className={cn("mb-3 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#d8bf7a]", desktopCollapsed && "lg:hidden")}>
              {c.preview}
              <select
                value={previewPersona}
                onChange={(event) => changePersona(event.target.value as PreviewPersona)}
                className="mt-2 h-9 w-full rounded-md border border-[#d8bf7a]/25 bg-[#d8bf7a]/10 px-2 text-xs font-semibold text-white outline-none"
              >
                {(Object.keys(c.previewNames) as PreviewPersona[]).map((item) => (
                  <option key={item} value={item} className="text-[#17202b]">
                    {c.previewNames[item]}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className={cn("mb-3 flex h-9 items-center rounded-md border border-white/10 bg-white/5 p-0.5", desktopCollapsed && "lg:h-auto lg:flex-col lg:border-0 lg:bg-transparent lg:p-0")} role="group" aria-label="Language">
            {(["tr", "en"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLang(item)}
                className={cn(
                  "h-8 flex-1 rounded px-2 text-[11px] font-bold uppercase transition-colors",
                  desktopCollapsed && "lg:w-full lg:flex-none",
                  lang === item ? "bg-white text-[#0a2d46] shadow-sm" : "text-white/55 hover:text-white",
                )}
                aria-pressed={lang === item}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((open) => !open)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-left hover:bg-white/10",
                desktopCollapsed && "lg:justify-center lg:px-0",
              )}
              aria-expanded={accountOpen}
              title={desktopCollapsed ? currentUser.displayName : undefined}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded bg-[#e8edf1] text-[#0a2d46]">
                <UserRound className="size-3.5" />
              </span>
              <span className={cn("min-w-0", desktopCollapsed && "lg:hidden")}>
                <span className="block truncate text-[11px] font-semibold text-white">{currentUser.displayName}</span>
                <span className="block truncate text-[9px] uppercase tracking-[0.08em] text-white/45">
                  {currentOrganization?.tradingName ?? c.workspaceNames[workspace]}
                </span>
              </span>
              <ChevronDown className={cn("ml-auto size-3.5 shrink-0 text-white/45", desktopCollapsed && "lg:hidden")} />
            </button>
            {accountOpen && (
              <div className={cn("absolute bottom-12 left-0 z-10 w-full min-w-60 rounded-md border border-[#dfe4e9] bg-white p-2 text-[#17202b] shadow-lg", desktopCollapsed && "lg:left-[calc(100%+0.75rem)] lg:bottom-0")}>
                <p className="px-2 py-1 text-xs text-[#6b7680]">{currentUser.email}</p>
                {previewEnabled ? (
                  <p className="mt-1 flex items-center gap-2 rounded bg-[#f6f0df] px-2 py-2 text-xs text-[#71591d]">
                    <ShieldCheck className="size-4" />
                    {c.backendPreview}
                  </p>
                ) : (
                  <form action={`${NORTH_BASE}/auth/sign-out`} method="post">
                    <button className="mt-1 flex h-9 w-full items-center gap-2 rounded px-2 text-sm text-[#34414d] hover:bg-[#f3f5f7]">
                      <LogOut className="size-4" /> {c.signOut}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={cn("transition-[padding] duration-200", desktopCollapsed ? "lg:pl-[84px]" : "lg:pl-[280px]")}>
        <main className="mx-auto min-h-[calc(100vh-86px)] w-full max-w-[1460px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <button
            type="button"
            className="mb-4 grid size-9 shrink-0 place-items-center rounded-md border border-[#dfe4e9] bg-white text-[#44515f] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={c.menu}
          >
            <Menu className="size-5" />
          </button>
          {allowed ? (
            children
          ) : (
            <div className="mx-auto mt-16 max-w-xl rounded-md border border-[#dfe4e9] bg-white p-8 text-center">
              <ShieldCheck className="mx-auto size-9 text-[#9b7b27]" />
              <h1 className="mt-5 font-serif text-2xl font-semibold text-[#102638]">{c.accessDenied}</h1>
              <p className="mt-3 text-sm leading-6 text-[#65717e]">{c.accessDeniedBody}</p>
              <button
                type="button"
                onClick={() => changeWorkspace("investor")}
                className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white"
              >
                {c.returnDashboard}
              </button>
            </div>
          )}
        </main>

        <footer className="border-t border-[#dfe4e9] bg-white px-4 py-6 text-xs leading-relaxed text-[#6b7680] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1460px] flex-col justify-between gap-3 md:flex-row">
            <p>© 2026 Hunter North Capital. Canadian Private Markets Access.</p>
            <p className="max-w-3xl md:text-right">
              Access, approval, eligibility, suitability, and subscription remain subject to the applicable licensed and compliance process.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
