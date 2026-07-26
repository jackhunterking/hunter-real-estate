"use client";

/**
 * The language picker for every Equity Market surface — landing header and
 * portal alike. One dropdown, all four site locales, driven by `LOCALE_OPTIONS`.
 *
 * Reads `lang` / `setLang` from `LanguageProvider`; `setLang` navigates to the
 * same route under the chosen locale prefix (and sets the NEXT_LOCALE cookie),
 * so the choice is server-authoritative and survives the next visit.
 *
 * Built as a real dropdown — flag + language name written in its own language —
 * rather than a bare two-way toggle, so a first-time visitor immediately
 * recognises it as "pick your language" and every locale we route is reachable.
 *
 * Variants only change the trigger; the list is identical everywhere:
 *   - `compact` — globe + flag + EN badge. The landing header pill.
 *   - `inline`  — flag + full language name. Sits in a portal settings row.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LOCALE_OPTIONS, localeOption } from "@/lib/i18n/locale-options";
import type { Lang } from "@/lib/i18n/dictionaries";

export type LanguageSelectVariant = "compact" | "inline";

export function LanguageSelect({
  variant = "compact",
  className = "",
  ariaLabel = "Select language",
}: {
  variant?: LanguageSelectVariant;
  className?: string;
  /** Accessible name for the trigger; pass the surrounding row's label. */
  ariaLabel?: string;
}) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const active = localeOption(lang);

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

  const trigger =
    variant === "compact"
      ? "h-10 gap-1.5 px-2.5 text-sm font-semibold"
      : "h-9 gap-2 px-2.5 text-sm font-semibold";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        className={`inline-flex items-center rounded-md border border-[#d8dee2] text-[#0a2d46] transition-colors hover:bg-[#eef2f4] ${trigger}`}
      >
        {variant === "compact" && <Globe className="size-4 text-[#52636f]" aria-hidden />}
        <active.Flag />
        {variant === "compact" ? (
          <span className="tabular-nums">{active.short}</span>
        ) : (
          <span>{active.label}</span>
        )}
        <ChevronDown
          className={`size-3.5 text-[#52636f] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 z-50 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-[#e0e6ea] bg-white py-1 shadow-[0_20px_50px_-24px_rgba(7,28,44,0.55)]"
        >
          {LOCALE_OPTIONS.map((o) => {
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
