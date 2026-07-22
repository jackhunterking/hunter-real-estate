"use client";

/**
 * The "Available funds" banner card from the professional dashboard, extracted
 * as a pure presentational component so the public landing page can render the
 * exact same product surface inside its marketing mockups.
 *
 * Callers pass already-resolved strings; no portal context is used here.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type FundBannerCardProps = {
  image?: string;
  imageAlt?: string;
  logo?: string;
  name: string;
  manager: string;
  strategyLabel?: string;
  summary: string;
  cta?: { href: string; label: string };
  /** Extra content rendered below the summary (e.g. landing-page metrics). */
  footer?: React.ReactNode;
  /** Slimmer banner, no summary — for tight marketing frames. */
  compact?: boolean;
};

export function FundBannerCard({
  image,
  imageAlt,
  logo,
  name,
  manager,
  strategyLabel,
  summary,
  cta,
  footer,
  compact = false,
}: FundBannerCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
      <div className={`relative overflow-hidden bg-[#0d2d43] ${compact ? "aspect-[6/1]" : "aspect-[60/13]"}`}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={imageAlt ?? name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/75 via-[#071c2c]/15 to-transparent" />
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="absolute bottom-3 left-3 h-9 max-w-24 rounded bg-white object-contain p-1.5 shadow-sm" />
        )}
      </div>
      <div className={compact ? "p-3.5" : "p-4"}>
        <div className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-2 ${compact ? "" : "mb-3"}`}>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#152b3b]">{name}</h3>
            <p className="mt-1 text-xs text-[#75818a]">{manager}</p>
          </div>
          {strategyLabel && (
            <span className="inline-flex shrink-0 rounded border border-[#dbe1e5] bg-[#f5f7f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64727d]">
              {strategyLabel}
            </span>
          )}
        </div>
        {!compact && (
          <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#5f6d78]">{summary}</p>
        )}
        {footer}
        {cta && (
          <div className="mt-3 flex items-center justify-end gap-3">
            <Link href={cta.href} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#0a2d46] px-3 text-xs font-semibold text-white hover:bg-[#123f5e]">
              {cta.label}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
