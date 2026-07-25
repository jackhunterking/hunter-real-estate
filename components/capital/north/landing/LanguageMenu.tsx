"use client";

/**
 * Compact language dropdown for the landing header — all four site locales
 * (Türkçe / English / Français / Español).
 *
 * Reads `lang` / `setLang` from `LanguageProvider`; `setLang` navigates to the
 * same route under the chosen locale prefix (and sets the NEXT_LOCALE cookie).
 * Built as a real dropdown — flag + language name — rather than a bare toggle,
 * so a first-time Instagram visitor immediately recognises it as "pick your
 * language". Styled in the landing's own light-header palette; the list is
 * data-driven via `OPTIONS`.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { Lang } from "@/lib/i18n/dictionaries";

/* Inline flag glyphs — same simple style as the main-site nav, sized here. */
function FlagTR() {
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5 rounded-[2px]" aria-hidden="true">
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="11" cy="10" r="4.5" fill="#fff" />
      <circle cx="12.3" cy="10" r="3.5" fill="#E30A17" />
      <polygon
        points="17.4,7.6 18.2,9.6 20.3,9.6 18.6,10.8 19.3,12.8 17.4,11.6 15.5,12.8 16.2,10.8 14.5,9.6 16.6,9.6"
        fill="#fff"
      />
    </svg>
  );
}

function FlagEN() {
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5 rounded-[2px]" aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20" stroke="#fff" strokeWidth="3" />
      <path d="M30,0 L0,20" stroke="#fff" strokeWidth="3" />
      <path d="M0,0 L30,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M30,0 L0,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M15,0 V20" stroke="#fff" strokeWidth="5" />
      <path d="M0,10 H30" stroke="#fff" strokeWidth="5" />
      <path d="M15,0 V20" stroke="#C8102E" strokeWidth="3" />
      <path d="M0,10 H30" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}

function FlagFR() {
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5 rounded-[2px]" aria-hidden="true">
      <rect width="10" height="20" x="0" fill="#0055A4" />
      <rect width="10" height="20" x="10" fill="#fff" />
      <rect width="10" height="20" x="20" fill="#EF4135" />
    </svg>
  );
}

function FlagES() {
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5 rounded-[2px]" aria-hidden="true">
      <rect width="30" height="20" fill="#AA151B" />
      <rect width="30" height="10" y="5" fill="#F1BF00" />
    </svg>
  );
}

type LangOption = { code: Lang; short: string; label: string; Flag: () => React.ReactElement };

const OPTIONS: LangOption[] = [
  { code: "tr", short: "TR", label: "Türkçe", Flag: FlagTR },
  { code: "en", short: "EN", label: "English", Flag: FlagEN },
  { code: "fr", short: "FR", label: "Français", Flag: FlagFR },
  { code: "es", short: "ES", label: "Español", Flag: FlagES },
];

export function LanguageMenu({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const active = OPTIONS.find((o) => o.code === lang) ?? OPTIONS[1];

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(code: Lang) {
    setLang(code);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Select language"
        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#d8dee2] px-2.5 text-sm font-semibold text-[#0a2d46] transition-colors hover:bg-[#eef2f4]"
      >
        <Globe className="size-4 text-[#52636f]" aria-hidden />
        <active.Flag />
        <span className="tabular-nums">{active.short}</span>
        <ChevronDown
          className={`size-3.5 text-[#52636f] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-50 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-[#e0e6ea] bg-white py-1 shadow-[0_20px_50px_-24px_rgba(7,28,44,0.55)]"
        >
          {OPTIONS.map((o) => {
            const selected = o.code === lang;
            return (
              <li key={o.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => choose(o.code)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-[#f2f5f6] ${
                    selected ? "font-semibold text-[#0a2d46]" : "text-[#42525d]"
                  }`}
                >
                  <o.Flag />
                  <span className="flex-1">{o.label}</span>
                  {selected && <Check className="size-4 text-[#0a4b72]" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
