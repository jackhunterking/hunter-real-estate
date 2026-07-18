"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { canUseWorkspace, defaultPortalPath } from "@/lib/capital/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { usePortalAccess } from "./PortalAccessProvider";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type NavigationGroup = {
  id: "investing" | "professional" | "operations" | "account";
  label: string;
  items: NavigationItem[];
};

const COPY = {
  tr: {
    groups: { investing: "Yatırımlar", professional: "Profesyonel", operations: "Hunter North" },
    investing: [
      ["/portfolio", "Portföyüm", WalletCards],
      ["/funds", "Fonları keşfet", Compass],
      ["/requests", "Taleplerim", BriefcaseBusiness],
    ],
    investorReadiness: ["/resources/investor-readiness", "Yatırımcı öz kontrolü", BadgeCheck],
    professional: [
      ["/professional", "Profesyonel özet", LayoutDashboard],
      ["/clients", "Müşteriler", UsersRound],
      ["/resources/investor-readiness", "Yatırımcı yeterliliği", BadgeCheck],
      ["/commissions", "Komisyonlar", CircleDollarSign],
    ],
    operations: [["/operations", "Operasyonlar", ShieldCheck]],
    account: "Hesap",
    profile: "Profil",
    signOut: "Güvenli çıkış",
    menu: "Menü",
    collapseMenu: "Menüyü daralt",
    expandMenu: "Menüyü genişlet",
    accessDenied: "Bu alana erişiminiz yok.",
    accessDeniedBody: "Bu sayfa mevcut hesap onaylarınızın dışında. Yetkili ana sayfanıza dönebilirsiniz.",
    returnHome: "Ana sayfama dön",
  },
  en: {
    groups: { investing: "Investing", professional: "Professional", operations: "Hunter North" },
    investing: [
      ["/portfolio", "My portfolio", WalletCards],
      ["/funds", "Explore funds", Compass],
      ["/requests", "My requests", BriefcaseBusiness],
    ],
    investorReadiness: ["/resources/investor-readiness", "Investor self-check", BadgeCheck],
    professional: [
      ["/professional", "Professional overview", LayoutDashboard],
      ["/clients", "Clients", UsersRound],
      ["/resources/investor-readiness", "Investor qualification", BadgeCheck],
      ["/commissions", "Commissions", CircleDollarSign],
    ],
    operations: [["/operations", "Operations", ShieldCheck]],
    account: "Account",
    profile: "Profile",
    signOut: "Secure sign out",
    menu: "Menu",
    collapseMenu: "Collapse menu",
    expandMenu: "Expand menu",
    accessDenied: "You do not have access to this area.",
    accessDeniedBody: "This page is outside your current account approvals. Return to your authorized home.",
    returnHome: "Return to my home",
  },
} as const;

export function NorthShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, context, canAccess } = usePortalAccess();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const c = COPY[lang];
  const investor = canUseWorkspace(context, "investor");
  const professional = canUseWorkspace(context, "professional");
  const operations = canUseWorkspace(context, "operations");
  const allowed = canAccess(pathname);

  const groups: NavigationGroup[] = [
    ...(investor ? [{
      id: "investing",
      label: c.groups.investing,
      items: [...c.investing, ...(!professional ? [c.investorReadiness] : [])]
        .map(([href, label, icon]) => ({ href, label, icon })),
    } as NavigationGroup] : []),
    ...(professional
      ? [{ id: "professional" as const, label: c.groups.professional, items: c.professional.map(([href, label, icon]) => ({ href, label, icon })) }]
      : []),
    ...(operations
      ? [{ id: "operations" as const, label: c.groups.operations, items: c.operations.map(([href, label, icon]) => ({ href, label, icon })) }]
      : []),
    {
      id: "account",
      label: c.account,
      items: [{ href: "/profile", label: c.profile, icon: UserRound }],
    },
  ];

  useEffect(() => {
    try {
      setDesktopCollapsed(window.localStorage.getItem("hnc-sidebar-collapsed") === "true");
    } catch {
      // Keep the expanded default when storage is unavailable.
    }
  }, []);

  if (/\/funds\/[^/]+\/present$/.test(pathname)) {
    return <>{children}</>;
  }

  function toggleDesktopSidebar() {
    const next = !desktopCollapsed;
    setDesktopCollapsed(next);
    try {
      window.localStorage.setItem("hnc-sidebar-collapsed", String(next));
    } catch {
      // The setting remains active for this visit.
    }
  }

  function goHome() {
    router.push(`${NORTH_BASE}${defaultPortalPath(context)}`);
  }

  return (
    <div className="min-h-screen bg-[#f3f5f6] text-[#17202b]">
      <aside
        id="hnc-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#071c2c] text-white transition-[width,transform] duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          desktopCollapsed ? "lg:w-[78px]" : "lg:w-[248px]",
        )}
      >
        <button
          type="button"
          className="absolute -right-3 top-6 z-10 hidden size-7 place-items-center rounded-full border border-[#dfe4e9] bg-white text-[#44515f] shadow-sm lg:grid"
          onClick={toggleDesktopSidebar}
          aria-controls="hnc-sidebar"
          aria-expanded={!desktopCollapsed}
          aria-label={desktopCollapsed ? c.expandMenu : c.collapseMenu}
        >
          {desktopCollapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
        </button>

        <div className={cn("flex h-20 items-center justify-between border-b border-white/10 px-5", desktopCollapsed && "lg:justify-center lg:px-0")}>
          <NorthBrand markOnlyOnDesktop={desktopCollapsed} />
          <button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-md text-white/70 lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Hunter North Capital">
          <div className="space-y-7">
            {groups.map((group) => (
              <section key={group.id}>
                <p className={cn("mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60", desktopCollapsed && "lg:hidden")}>{group.label}</p>
                <div className="space-y-1">
                  {group.items.map(({ href, label, icon: Icon }) => {
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
                          active ? "bg-white text-[#071c2c]" : "text-white/70 hover:bg-white/8 hover:text-white",
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" />
                        <span className={cn(desktopCollapsed && "lg:hidden")}>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className={cn("border-t border-white/10 p-3", desktopCollapsed && "lg:p-2")}>
          <div className={cn("mb-2 flex h-9 items-center rounded-md border border-white/10 bg-white/5 p-0.5", desktopCollapsed && "lg:h-auto lg:flex-col lg:border-0 lg:bg-transparent lg:p-0")} role="group" aria-label="Language">
            {(["tr", "en"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setLang(item)} className={cn("h-8 flex-1 rounded px-2 text-[11px] font-bold uppercase", desktopCollapsed && "lg:w-full lg:flex-none", lang === item ? "bg-white text-[#0a2d46]" : "text-white/55")} aria-pressed={lang === item}>{item}</button>
            ))}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setAccountOpen((open) => !open)} className={cn("flex w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-left text-white", desktopCollapsed && "lg:justify-center lg:px-0")} aria-expanded={accountOpen}>
              <span className="grid size-7 shrink-0 place-items-center rounded bg-[#e8edf1] text-[#0a2d46]"><UserRound className="size-3.5" /></span>
              <span className={cn("min-w-0", desktopCollapsed && "lg:hidden")}>
                <span className="block truncate text-[11px] font-semibold">{currentUser.displayName}</span>
                <span className="block truncate text-[9px] uppercase tracking-[0.08em] text-white/60">{operations ? c.groups.operations : professional ? c.groups.professional : c.groups.investing}</span>
              </span>
              <ChevronDown className={cn("ml-auto size-3.5 text-white/60", desktopCollapsed && "lg:hidden")} />
            </button>
            {accountOpen && (
              <div className={cn("absolute bottom-12 left-0 z-10 w-full min-w-64 rounded-md border border-[#dfe4e9] bg-white p-2 text-[#17202b] shadow-lg", desktopCollapsed && "lg:left-[calc(100%+0.75rem)] lg:bottom-0")}>
                <p className="px-2 py-1 text-xs text-[#6b7680]">{currentUser.email}</p>
                <form action={`${NORTH_BASE}/auth/sign-out`} method="post">
                  <button className="mt-1 flex h-9 w-full items-center gap-2 rounded px-2 text-sm hover:bg-[#f3f5f7]"><LogOut className="size-4" />{c.signOut}</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", desktopCollapsed ? "lg:pl-[78px]" : "lg:pl-[248px]")}>
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <button type="button" className="mb-4 grid size-9 place-items-center rounded-md border border-[#dfe4e9] bg-white text-[#44515f] lg:hidden" onClick={() => setMobileOpen(true)} aria-label={c.menu}><Menu className="size-5" /></button>
          {allowed ? children : (
            <div className="mx-auto mt-16 max-w-xl rounded-xl border border-[#dfe4e9] bg-white p-8 text-center">
              <ShieldCheck className="mx-auto size-9 text-[#9b7b27]" />
              <h1 className="mt-5 font-serif text-2xl font-semibold text-[#102638]">{c.accessDenied}</h1>
              <p className="mt-3 text-sm leading-6 text-[#65717e]">{c.accessDeniedBody}</p>
              <button type="button" onClick={goHome} className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.returnHome}</button>
            </div>
          )}
        </main>
        <footer className="border-t border-[#dfe4e9] bg-white px-4 py-5 text-xs text-[#6b7680] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-between gap-2 md:flex-row">
            <p>© 2026 Hunter North Capital.</p>
            <p className="max-w-3xl md:text-right">Access, eligibility, suitability, and subscription remain subject to the applicable licensed process.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
