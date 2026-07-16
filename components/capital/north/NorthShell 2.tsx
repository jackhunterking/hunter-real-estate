"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

const COPY = {
  tr: {
    portal: "Partner platformu",
    account: "Partner hesabı",
    accountName: "Marmara Wealth Partners",
    signOut: "Platformdan çık",
    menu: "Menü",
    collapseMenu: "Menüyü daralt",
    expandMenu: "Menüyü genişlet",
    nav: [
      ["/dashboard", "Genel Bakış", LayoutDashboard],
      ["/funds", "Fonlar", Building2],
      ["/clients", "Müşteriler", UsersRound],
      ["/partner-program", "Partner Profili", BriefcaseBusiness],
    ],
    resources: "Kaynaklar",
    resourceLink: "Yatırımcı hazırlığı",
  },
  en: {
    portal: "Partner portal",
    account: "Partner account",
    accountName: "Marmara Wealth Partners",
    signOut: "Exit platform",
    menu: "Menu",
    collapseMenu: "Collapse menu",
    expandMenu: "Expand menu",
    nav: [
      ["/dashboard", "Overview", LayoutDashboard],
      ["/funds", "Funds", Building2],
      ["/clients", "Clients", UsersRound],
      ["/partner-program", "Partner Profile", BriefcaseBusiness],
    ],
    resources: "Resources",
    resourceLink: "Investor readiness",
  },
} as const;

export function NorthShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const c = COPY[lang];

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

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#17202b]">
      <aside
        id="hnc-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-[#071c2c] text-white transition-[width,transform] duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          desktopCollapsed ? "lg:w-[84px]" : "lg:w-[268px]",
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

        <nav className="flex-1 px-3 py-5" aria-label="Hunter North Capital">
          <div
            className={cn(
              "mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45",
              desktopCollapsed && "lg:hidden",
            )}
          >
            {c.portal}
          </div>
          <div className="space-y-1">
            {c.nav.map(([href, label, Icon]) => {
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

          <div className={cn("mt-8 border-t border-white/10 pt-5", desktopCollapsed && "lg:mt-5")}>
            <div
              className={cn(
                "mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45",
                desktopCollapsed && "lg:hidden",
              )}
            >
              {c.resources}
            </div>
            <Link
              href={`${NORTH_BASE}/resources/investor-readiness`}
              onClick={() => setMobileOpen(false)}
              aria-label={c.resourceLink}
              title={desktopCollapsed ? c.resourceLink : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                desktopCollapsed && "lg:justify-center lg:px-0",
                pathname === `${NORTH_BASE}/resources/investor-readiness`
                  ? "bg-white text-[#071c2c]"
                  : "text-white/72 hover:bg-white/8 hover:text-white",
              )}
            >
              <BookOpenText className="size-[18px]" />
              <span className={cn(desktopCollapsed && "lg:hidden")}>{c.resourceLink}</span>
            </Link>
          </div>
        </nav>

        <div className={cn("border-t border-white/10 p-4", desktopCollapsed && "lg:p-3")}>
          <div className={cn("mb-4 flex h-9 items-center rounded-md border border-white/10 bg-white/5 p-0.5", desktopCollapsed && "lg:mb-3 lg:h-auto lg:flex-col lg:border-0 lg:bg-transparent lg:p-0")} role="group" aria-label="Language">
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
                title={desktopCollapsed ? item.toUpperCase() : undefined}
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
              title={desktopCollapsed ? c.accountName : undefined}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded bg-[#e8edf1] text-[#0a2d46]">
                <UserRound className="size-3.5" />
              </span>
              <span className={cn("min-w-0", desktopCollapsed && "lg:hidden")}>
                <span className="block truncate text-[11px] font-semibold text-white">{c.accountName}</span>
                <span className="block text-[9px] uppercase tracking-[0.08em] text-white/45">{c.account}</span>
              </span>
              <ChevronDown className={cn("ml-auto size-3.5 shrink-0 text-white/45", desktopCollapsed && "lg:hidden")} />
            </button>
            {accountOpen && (
              <div className={cn("absolute bottom-12 left-0 z-10 w-full min-w-56 rounded-md border border-[#dfe4e9] bg-white p-2 shadow-lg", desktopCollapsed && "lg:left-[calc(100%+0.75rem)] lg:bottom-0")}>
                <Link
                  href={NORTH_BASE}
                  onClick={() => setAccountOpen(false)}
                  className="mt-1 flex h-9 items-center gap-2 rounded px-2 text-sm text-[#34414d] hover:bg-[#f3f5f7]"
                >
                  <LogOut className="size-4" /> {c.signOut}
                </Link>
              </div>
            )}
          </div>

          <p className={cn("mt-4 text-xs leading-relaxed text-white/50", desktopCollapsed && "lg:hidden")}>
            Hunter North Capital<br />
            Canadian Private Markets Access
          </p>
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

      <div
        className={cn(
          "transition-[padding] duration-200",
          desktopCollapsed ? "lg:pl-[84px]" : "lg:pl-[268px]",
        )}
      >
        <main className="mx-auto w-full max-w-[1460px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <button
            type="button"
            className="mb-4 grid size-9 shrink-0 place-items-center rounded-md border border-[#dfe4e9] bg-white text-[#44515f] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={c.menu}
          >
            <Menu className="size-5" />
          </button>
          {children}
        </main>

        <footer className="border-t border-[#dfe4e9] bg-white px-4 py-6 text-xs leading-relaxed text-[#6b7680] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1460px] flex-col justify-between gap-3 md:flex-row">
            <p>© 2026 Hunter North Capital. Canadian Private Markets Access.</p>
            <p className="max-w-3xl md:text-right">
              Hunter North Capital partner platform. Fund access, solicitation, eligibility, and suitability remain subject to the applicable licensed process.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
