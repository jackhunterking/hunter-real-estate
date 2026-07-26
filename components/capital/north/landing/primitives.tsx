"use client";

/**
 * Shared, re-skinned presentation primitives + light hooks for the landing page.
 *
 * These deliberately use the landing's own hex palette (navy #071c2c / blue
 * #0a2d46 / gold #c5a34d·#d6b96e) rather than the shadcn theme tokens, whose
 * `--primary` (#1e3378) is a brighter navy that would not match. They never
 * fetch or mutate — callers pass already-derived, localized values.
 */

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Lock, ShieldCheck, type LucideIcon } from "lucide-react";
import type {
  PublicOfferingPreview,
  PublicOfferingPropertyPreview,
} from "@/lib/capital/types";
import { buildFootprintGallery } from "@/lib/capital/landing-gallery";

/* ------------------------------------------------------------------ */
/* Data helpers (pure — no React state)                                */
/* ------------------------------------------------------------------ */

/** "12-15% annually" → "12–15%" for big stat tiles; falls back to input. */
export { tightRange as shortRange } from "@/components/capital/OfferingSummaryCard";

/** A photo shown in the real-assets footprint, with an honest caption. */
export type { FootprintImage } from "@/lib/capital/landing-gallery";

/** EN→TR fallback for free-text portfolio facts (kept for future TR pass). */
export function localizedPortfolioFact(value: string, lang: string) {
  if (lang !== "tr") return value;
  return value
    .replace(/\bproperties\b/gi, "mülk")
    .replace(/\bcommunities\b/gi, "yerleşim")
    .replace(/\bunits\b/gi, "ünite");
}

export function deriveLandingData(offerings: PublicOfferingPreview[]) {
  const heroOfferings = offerings.slice(0, 2);
  const propertyMap = new Map<string, PublicOfferingPropertyPreview>();
  offerings.forEach((offering) =>
    offering.properties.forEach((property) => propertyMap.set(property.id, property)),
  );
  const properties = Array.from(propertyMap.values());
  const picturedProperties = properties.filter((p) =>
    Boolean(p.media?.card?.src ?? p.media?.gallery?.[0]?.src),
  );

  // Footprint photography, mixed round-robin across the published funds so no
  // single portfolio owns the top of the grid. See `buildFootprintGallery`.
  const galleryItems = buildFootprintGallery(offerings);

  return {
    hasOfferings: offerings.length > 0,
    heroPrimary: heroOfferings[0],
    heroSecondary: heroOfferings[1],
    primaryOffering: offerings[0] as PublicOfferingPreview | undefined,
    properties,
    picturedProperties,
    galleryItems,
    heroBackdrop: galleryItems.find((item) => item.src)?.src,
  };
}

/* ------------------------------------------------------------------ */
/* Scroll-reveal (no framer-motion; respects reduced motion)           */
/* ------------------------------------------------------------------ */

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  opts?: IntersectionObserverInit,
) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px", ...opts },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [opts]);
  return { ref, shown };
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-700 ease-out will-change-[opacity,transform] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout + heading primitives                                         */
/* ------------------------------------------------------------------ */

type BandVariant = "light" | "muted" | "white" | "navy" | "deep";

const BAND_BG: Record<BandVariant, string> = {
  light: "bg-[#f5f7f7]",
  muted: "bg-[#eef3f4]",
  white: "bg-white",
  navy: "bg-[#071c2c] text-white",
  deep: "bg-[#09283d] text-white",
};

export function SectionShell({
  id,
  variant,
  children,
  className = "",
}: {
  id?: string;
  variant: BandVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${BAND_BG[variant]} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "gold";
}) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[0.18em] ${
        tone === "gold" ? "text-[#d6b96e]" : "text-[#0a4b72]"
      }`}
    >
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
  tone = "blue",
  center = false,
  invert = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  tone?: "blue" | "gold";
  center?: boolean;
  invert?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-3 font-serif text-3xl font-semibold sm:text-4xl ${
          invert ? "text-white" : "text-[#102638]"
        }`}
      >
        {title}
      </h2>
      {body && (
        <p
          className={`mt-4 max-w-2xl text-base leading-7 ${center ? "mx-auto" : ""} ${
            invert ? "text-white/70" : "text-[#62727c]"
          }`}
        >
          {body}
        </p>
      )}
    </div>
  );
}

export function StatTile({
  label,
  value,
  suffix,
  icon: Icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-[#dce3e7] bg-[#fbfcfc] p-5">
      {Icon && (
        <span className="mb-3 inline-grid size-10 place-items-center rounded-lg bg-[#0a2d46] text-[#d6b96e]">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <p className="font-serif text-2xl font-semibold leading-tight text-[#102638] sm:text-[1.75rem]">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-[#7a8790]">{suffix}</span>}
      </p>
      <p className="mt-2 text-xs font-medium text-[#7a8790]">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Browser chrome + growth chart (reused by mockups & auth panel)      */
/* ------------------------------------------------------------------ */

export function BrowserFrame({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#d5dde2] bg-white shadow-[0_28px_70px_-38px_rgba(7,28,44,0.5)] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#e5eaed] bg-[#fbfcfc] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#d8dde0]" />
          <span className="size-2.5 rounded-full bg-[#d8dde0]" />
          <span className="size-2.5 rounded-full bg-[#c5a34d]" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#70808a]">
          <Lock className="size-3" />
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Confident portfolio-growth curve. Decorative: no numeric axis, no claim. */
export function GrowthChart({ className = "", height = 90 }: { className?: string; height?: number }) {
  const series = [8, 12, 10, 18, 24, 21, 30, 36, 33, 44, 52];
  const w = 280;
  const h = height;
  const max = 58;
  const pts = series.map(
    (v, i) => [(i / (series.length - 1)) * w, h - (v / max) * h] as const,
  );
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `M0,${h} L${line.split(" ").join(" L")} L${w},${h} Z`;
  const [lastX, lastY] = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Portfolio growth over time"
      preserveAspectRatio="none"
      className={`w-full ${className}`}
    >
      <defs>
        <linearGradient id="hnc-growth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(197,163,77,0.34)" />
          <stop offset="100%" stopColor="rgba(197,163,77,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hnc-growth)" />
      <polyline points={line} fill="none" stroke="#d6b96e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill="#fff" stroke="#c5a34d" strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Membership panel (landing hero side + auth left column)             */
/* ------------------------------------------------------------------ */

export function MembershipPanel({
  eyebrow,
  title,
  body,
  benefits,
  secured,
  mockLabel,
}: {
  eyebrow: string;
  title: string;
  body: string;
  benefits: string[];
  secured: string;
  mockLabel: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <span className="grid size-11 place-items-center rounded-xl bg-white/5 text-[#d8bf7a] ring-1 ring-white/10">
          <ShieldCheck className="size-6" />
        </span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-[#d8bf7a]">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/62">{body}</p>
        <ul className="mt-8 space-y-3 text-sm text-white/72">
          {benefits.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#d8bf7a]" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 overflow-hidden rounded-xl border border-white/12 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
              {mockLabel}
            </p>
            <span className="text-[10px] font-semibold text-[#d8bf7a]">+ growth</span>
          </div>
          <div className="mt-3 h-14 overflow-hidden">
            <GrowthChart className="h-full" height={56} />
          </div>
        </div>
      </div>
      <p className="mt-8 inline-flex items-center gap-2 text-xs font-semibold text-white/55">
        <Lock className="size-3.5 text-[#d8bf7a]" />
        {secured}
      </p>
    </div>
  );
}
