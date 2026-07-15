"use client";

import { useState } from "react";
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
    nav: [
      ["/dashboard", "Genel Bakış", LayoutDashboard],
      ["/funds", "Fonlar", Building2],
      ["/clients", "Müşteriler", UsersRound],
      ["/partner-program", "Partner Profili", BriefcaseBusiness],
    ],
    resources: "Kurumsal kaynaklar",
    resourceLink: "Yatırımcı hazırlığı",
  },
  en: {
    portal: "Partner portal",
    account: "Partner account",
    accountName: "Marmara Wealth Partners",
    signOut: "Exit platform",
    menu: "Menu",
    nav: [
      ["/dashboard", "Overview", LayoutDashboard],
      ["/funds", "Funds", Building2],
      ["/clients", "Clients", UsersRound],
      ["/partner-program", "Partner Profile", BriefcaseBusiness],
    ],
    resources: "Institutional resources",
    resourceLink: "Investor readiness",
  },
} as const;

export function NorthShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const c = COPY[lang];

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#17202b]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-[#071c2c] text-white transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <NorthBrand />
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
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
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
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-white text-[#071c2c]"
                      : "text-white/72 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 border-t border-white/10 pt-5">
            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              {c.resources}
            </div>
            <Link
              href={`${NORTH_BASE}/funds/lankin-apartment-reit?tab=readiness`}
              onClick={() => setMobileOpen(false)}
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/72 hover:bg-white/8 hover:text-white"
            >
              <BookOpenText className="size-[18px]" />
              {c.resourceLink}
            </Link>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="text-xs leading-relaxed text-white/50">
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

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#dfe4e9] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-md border border-[#dfe4e9] text-[#44515f] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={c.menu}
            >
              <Menu className="size-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center rounded-md border border-[#dfe4e9] bg-[#f7f8fa] p-0.5" role="group" aria-label="Language">
              {(["tr", "en"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLang(item)}
                  className={cn(
                    "h-7 min-w-8 rounded px-2 text-[11px] font-bold uppercase",
                    lang === item ? "bg-white text-[#0a2d46] shadow-sm" : "text-[#77818b]",
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
                className="flex h-9 max-w-[210px] items-center gap-2 rounded-md border border-[#dfe4e9] bg-white px-2.5 text-left hover:bg-[#f7f8fa]"
                aria-expanded={accountOpen}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded bg-[#e8edf1] text-[#0a2d46]">
                  <UserRound className="size-3.5" />
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-[11px] font-semibold text-[#1d2a35]">{c.accountName}</span>
                  <span className="block text-[9px] uppercase tracking-[0.08em] text-[#7b858e]">{c.account}</span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-[#7b858e]" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-md border border-[#dfe4e9] bg-white p-2 shadow-lg">
                  <Link
                    href={NORTH_BASE}
                    className="mt-1 flex h-9 items-center gap-2 rounded px-2 text-sm text-[#34414d] hover:bg-[#f3f5f7]"
                  >
                    <LogOut className="size-4" /> {c.signOut}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1460px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
