"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  INVESTMENT_BASE_PATH,
  investmentBrandFor,
} from "@/lib/capital/investment-brand";

/** Canonical public path for the advisory application. */
export const NORTH_BASE = INVESTMENT_BASE_PATH;

export function ParvisCoBrand({
  dark = false,
  compact = false,
  className = "",
}: {
  dark?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const { lang } = useLang();
  const copy = investmentBrandFor(lang);
  return (
    <span
      aria-label={`${copy.poweredBy} Parvis`}
      className={`inline-flex shrink-0 items-center gap-2 ${compact ? "lg:size-9 lg:justify-center lg:gap-0 lg:overflow-hidden lg:!p-0" : ""} ${className}`}
    >
      <span className={`text-[7px] font-bold uppercase tracking-[0.13em] ${dark ? "text-[#71808a]" : "text-white/48"} ${compact ? "lg:hidden" : ""}`}>
        {copy.poweredBy}
      </span>
      <span className={`relative block h-[18px] w-[74px] overflow-hidden ${compact ? "lg:h-8 lg:w-7" : ""}`}>
        <Image
          src={compact ? "/logos/parvis-mark.png" : "/logos/parvis-lockup.png"}
          alt="Parvis"
          width={compact ? 565 : 3012}
          height={compact ? 670 : 736}
          sizes={compact ? "28px" : "74px"}
          className={`absolute left-0 top-0 h-full w-auto max-w-none ${dark ? "" : "brightness-0 invert"}`}
        />
      </span>
    </span>
  );
}

export function NorthBrand({
  compact = false,
  markOnlyOnDesktop = false,
  dark = false,
  stacked = false,
  showCoBrand = true,
}: {
  compact?: boolean;
  markOnlyOnDesktop?: boolean;
  dark?: boolean;
  stacked?: boolean;
  showCoBrand?: boolean;
}) {
  const { lang } = useLang();
  const copy = investmentBrandFor(lang);
  const secondaryVisibility = markOnlyOnDesktop ? "lg:hidden" : "";
  return (
    <div className={`inline-flex min-w-0 ${stacked ? "flex-col items-start gap-2" : "flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3"}`}>
      <Link
        href={NORTH_BASE}
        className="inline-flex min-w-0 items-center gap-3"
        aria-label={copy.name}
      >
        <Image
          src="/logos/HUNTER_Brandmark_Gold.png"
          alt=""
          width={44}
          height={44}
          className="size-9 shrink-0 object-contain"
          priority
        />
        <span className={`min-w-0 leading-none ${secondaryVisibility}`}>
          <span className={`block truncate text-[15px] font-semibold ${dark ? "text-[#0a2d46]" : "text-white"}`}>
            {copy.primary}
          </span>
          {!compact && (
            <span className="mt-1 block whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b99747]">
              {copy.descriptor}
            </span>
          )}
        </span>
      </Link>
      {showCoBrand && <ParvisCoBrand dark={dark} className={secondaryVisibility} />}
    </div>
  );
}
