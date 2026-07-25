"use client";

/**
 * The single line of legal text the product shows. One row: copyright,
 * Jack's registration, a `Disclosures` toggle, and the Parvis co-brand.
 * Everything else — risk language, NRD registration, legal links — stays
 * folded away until the reader asks for it.
 *
 * This replaces the stacked `DealerDisclosure` paragraphs on every surface
 * except the full legal page, so no screen carries a wall of prose.
 */

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { investmentBrandFor } from "@/lib/capital/investment-brand";
import { NORTH_BASE, ParvisCoBrand } from "./NorthBrand";

export function DisclosureBar({
  tone = "light",
  copyright = false,
  coBrand = true,
  align = "start",
  className = "",
}: {
  tone?: "light" | "dark";
  /** Show `© 2026 …` ahead of the registration line (page footers only). */
  copyright?: boolean;
  /** Off where the Parvis lockup already appears nearby (e.g. the sidebar). */
  coBrand?: boolean;
  align?: "start" | "center";
  className?: string;
}) {
  const { lang } = useLang();
  const copy = investmentBrandFor(lang);
  const [open, setOpen] = useState(false);

  const muted = tone === "dark" ? "text-white/55" : "text-[#6b7680]";
  // Full class strings, not composed fragments — Tailwind only sees literals.
  const strong = tone === "dark"
    ? "text-white/80 hover:text-white"
    : "text-[#44515f] hover:text-[#0a2d46]";
  const rule = tone === "dark" ? "border-white/10" : "border-[#dfe4e9]";

  return (
    <div className={`text-[11px] leading-5 ${muted} ${className}`}>
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${align === "center" ? "justify-center text-center" : ""}`}
      >
        {copyright && <span>© 2026 {copy.primary}</span>}
        <span>{copy.registrationLine}</span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1 font-semibold transition-colors ${strong}`}
        >
          {copy.disclosuresToggle}
          <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {coBrand && <ParvisCoBrand dark={tone === "light"} className={align === "center" ? "" : "ml-auto"} />}
      </div>

      {open && (
        <div className={`mt-3 border-t ${rule} pt-3 ${align === "center" ? "text-center" : ""}`}>
          <p>{copy.riskLine}</p>
          <p className="mt-1.5">{copy.microDisclosure}</p>
          <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 ${align === "center" ? "justify-center" : ""}`}>
            <Link href={`${NORTH_BASE}/legal`} className={`font-semibold ${strong}`}>
              {copy.legalLink}
            </Link>
            <a
              href="https://www.parvisinvest.com/legal/disclosures"
              target="_blank"
              rel="noreferrer"
              className={`font-semibold ${strong}`}
            >
              {copy.parvisLink}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
