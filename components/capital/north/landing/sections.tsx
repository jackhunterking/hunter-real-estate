"use client";

/**
 * Marketing sections for the Hunter & Hunter landing page. Each takes the
 * resolved `c: LandingCopy` (+ offering/derived data where needed) and composes
 * primitives + product frames. `PublicLanding` orchestrates them.
 *
 * Layout intent (Parvis-style): image-first, card-heavy, minimal prose. The
 * product mockups are the REAL portal components fed with real offering data.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  ChevronDown,
  HandCoins,
  KeyRound,
  Layers,
  MapPin,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { PublicOfferingPreview } from "@/lib/capital/types";
import { tx } from "@/lib/i18n/localize";
import type { Lang } from "@/lib/i18n/dictionaries";
import { NORTH_BASE, NorthBrand, ParvisCoBrand } from "../NorthBrand";
import type { LandingCopy } from "./copy";
import { LanguageMenu } from "./LanguageMenu";
import {
  Reveal,
  SectionHeader,
  SectionShell,
  type FootprintImage,
} from "./primitives";
import { OpportunityCard } from "./mockups";
import {
  BuildingsFrame,
  DashboardFrame,
  OfferingDetailFrame,
  OpenFundsFrame,
  PerformanceFrame,
} from "./product-frames";

const SIGN_UP = `${NORTH_BASE}/sign-up?path=investor`;

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function LandingHeader({ c, hasOfferings }: { c: LandingCopy; hasOfferings: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e0e6ea] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <NorthBrand dark showCoBrand={false} />
        <nav aria-label="Landing" className="hidden items-center gap-6 lg:flex">
          <a href="#why" className="text-xs font-semibold text-[#52636f] transition-colors hover:text-[#0a2d46]">
            {c.nav.why}
          </a>
          <a href="#how" className="text-xs font-semibold text-[#52636f] transition-colors hover:text-[#0a2d46]">
            {c.nav.how}
          </a>
          {hasOfferings && (
            <a href="#opportunities" className="text-xs font-semibold text-[#52636f] transition-colors hover:text-[#0a2d46]">
              {c.nav.opportunities}
            </a>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {/* Soft, low-pressure primary action for cold visitors — the committed
              "Get access" now lives in the hero and closing sections. */}
          <a
            href="#how"
            className="hidden h-10 items-center gap-1.5 rounded-md border border-[#d8dee2] px-3.5 text-sm font-semibold text-[#0a2d46] transition-colors hover:bg-[#eef2f4] sm:inline-flex"
          >
            {c.actions.seeHowItWorks}
          </a>
          <Link
            href={`${NORTH_BASE}/sign-in`}
            className="hidden h-10 items-center rounded-md px-3 text-sm font-semibold text-[#0a2d46] hover:bg-[#eef2f4] sm:inline-flex"
          >
            {c.actions.signIn}
          </Link>
          {/* Language selector sits in the prominent top-right corner. */}
          <LanguageMenu />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — full-bleed photo + floating real-product composition         */
/* ------------------------------------------------------------------ */

export function Hero({
  c,
  offerings,
  hasOfferings,
  backdrop,
}: {
  c: LandingCopy;
  offerings: PublicOfferingPreview[];
  hasOfferings: boolean;
  backdrop?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#071c2c] text-white">
      {backdrop && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,28,44,0.96)_30%,rgba(7,28,44,0.72)_60%,rgba(7,28,44,0.55)),radial-gradient(circle_at_88%_12%,rgba(197,163,77,0.2),transparent_34%)]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b96e]">{c.hero.eyebrow}</p>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-[1.08] sm:text-[3rem]">
            {c.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">{c.hero.body}</p>

          {/* Return figure kept as a small, clearly-qualified stat — not the
              headline — so it reads as honest, not a promise. */}
          <div className="mt-7 inline-flex items-center gap-3 rounded-xl border border-white/12 bg-white/5 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/5 text-[#d6b96e] ring-1 ring-white/10">
              <TrendingUp className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="font-serif text-2xl font-semibold text-white">{c.hero.stat.value}</span>
              <span className="ml-2 text-sm font-medium text-white/75">{c.hero.stat.label}</span>
              <span className="mt-0.5 block text-[11px] text-white/50">{c.hero.stat.note}</span>
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={SIGN_UP}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#0a2d46] transition-transform hover:-translate-y-0.5"
            >
              {c.actions.getAccess}
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center rounded-md border border-white/24 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {c.actions.seeHowItWorks}
            </a>
          </div>

          <div className="mt-8 border-t border-white/12 pt-5">
            <ParvisCoBrand />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div aria-hidden className="absolute -inset-5 rounded-[2rem] bg-[#2f7194]/18 blur-2xl" />
          <div className="relative">
            {hasOfferings && <OpenFundsFrame offerings={offerings} c={c} />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust bar — product-agnostic credibility, no fund figures           */
/* ------------------------------------------------------------------ */

export function TrustBar({ c }: { c: LandingCopy }) {
  const icons: LucideIcon[] = [Building2, BadgeCheck, PiggyBank, ShieldCheck];
  return (
    <section className="border-b border-white/10 bg-[#09283d] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-4 px-4 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {c.trustBar.items.map((item, i) => {
          const Icon = icons[i] ?? ShieldCheck;
          return (
            <div key={item} className="flex items-center gap-3 text-sm font-semibold text-white/80">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 text-[#d6b96e] ring-1 ring-white/10">
                <Icon className="size-4.5" />
              </span>
              {item}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Platform tabs — Parvis-style tab rail + floating product frames     */
/* ------------------------------------------------------------------ */

export function PlatformTabs({
  c,
  offerings,
  isPreview = false,
}: {
  c: LandingCopy;
  offerings: PublicOfferingPreview[];
  isPreview?: boolean;
}) {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    };
  }, []);

  const primary = offerings[0];
  if (!primary) return null;
  const performanceOffering = offerings.find((o) => o.performance?.length) ?? primary;
  const buildingsOffering =
    offerings.find((o) => (o.media?.gallery?.length ?? 0) > 0) ?? primary;

  const frames = [
    <DashboardFrame key="dash" offerings={offerings} c={c} isPreview={isPreview} />,
    <OfferingDetailFrame key="detail" offering={primary} c={c} />,
    <PerformanceFrame key="perf" offering={performanceOffering} c={c} />,
    <BuildingsFrame key="build" offering={buildingsOffering} c={c} />,
  ];

  function isMobileView() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  function motionBehavior(): ScrollBehavior {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
  }

  function setActiveView(index: number) {
    if (activeRef.current === index) return;
    activeRef.current = index;
    setActive(index);
  }

  function revealActiveFrame(delay = 150) {
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => {
      frameRef.current?.scrollIntoView({
        behavior: motionBehavior(),
        block: "start",
      });
    }, delay);
  }

  function selectView(index: number) {
    setActiveView(index);
    if (!isMobileView()) return;

    tabRefs.current[index]?.scrollIntoView({
      behavior: motionBehavior(),
      block: "nearest",
      inline: "center",
    });
    revealActiveFrame();
  }

  function syncViewFromRail() {
    const rail = railRef.current;
    if (!rail || !isMobileView()) return;

    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let closestIndex = activeRef.current;
    let closestDistance = Number.POSITIVE_INFINITY;

    tabRefs.current.forEach((tab, index) => {
      if (!tab) return;
      const tabCenter = tab.offsetLeft + tab.offsetWidth / 2;
      const distance = Math.abs(tabCenter - railCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveView(closestIndex);
    revealActiveFrame();
  }

  return (
    <SectionShell id="platform" variant="navy">
      <SectionHeader eyebrow={c.platform.eyebrow} title={c.platform.title} body={c.platform.body} tone="gold" invert />
      <div className="mt-10 grid min-w-0 grid-cols-1 items-start gap-10 lg:grid-cols-[0.42fr_0.58fr]">
        <div className="min-w-0">
          <div className="mb-3 flex justify-end lg:hidden">
            <p className="text-xs font-semibold tabular-nums text-white/55">
              {active + 1} / {c.platform.tabs.length}
            </p>
          </div>
          <div
            ref={railRef}
            role="tablist"
            aria-label={c.platform.eyebrow}
            onScroll={syncViewFromRail}
            className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible lg:pb-0 lg:pr-0"
          >
            {c.platform.tabs.map((tab, index) => {
              const selected = index === active;
              return (
                <button
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  key={tab.label}
                  id={`platform-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-controls="platform-frame"
                  aria-selected={selected}
                  onClick={() => selectView(index)}
                  className={`w-[84%] max-w-sm flex-none snap-start rounded-2xl border p-5 text-left transition-colors lg:w-full lg:max-w-none ${
                    selected
                      ? "border-[#d6b96e]/60 bg-white/8"
                      : "border-white/10 bg-white/4 hover:bg-white/6"
                  }`}
                >
                  <p className={`text-sm font-bold ${selected ? "text-white" : "text-white/75"}`}>
                    {tab.label}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/55">{tab.body}</p>
                  <span
                    className={`mt-4 block h-0.5 rounded-full transition-all ${
                      selected ? "w-full bg-[#d6b96e]" : "w-8 bg-white/15"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <div
          ref={frameRef}
          id="platform-frame"
          role="tabpanel"
          aria-labelledby={`platform-tab-${active}`}
          className="relative min-w-0 scroll-mt-24"
        >
          <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-[#2f7194]/14 blur-2xl" />
          <Reveal key={active} className="relative min-w-0">
            {frames[active]}
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Featured opportunities                                              */
/* ------------------------------------------------------------------ */

export function FeaturedOpportunities({
  c,
  offerings,
}: {
  c: LandingCopy;
  offerings: PublicOfferingPreview[];
}) {
  return (
    <SectionShell id="opportunities" variant="light" className="border-b border-[#dfe5e8]">
      <SectionHeader eyebrow={c.featured.eyebrow} title={c.featured.title} body={c.featured.body} />
      <div
        className={`mt-10 grid gap-6 ${offerings.length === 1 ? "mx-auto max-w-2xl" : "lg:grid-cols-2"}`}
      >
        {offerings.map((offering, i) => (
          <Reveal key={offering.id} delay={(i % 2) * 80}>
            <OpportunityCard offering={offering} c={c} />
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Benefits + ways to invest                                           */
/* ------------------------------------------------------------------ */

/** Three plain-language reasons people invest, each topped with a real photo. */
export function WhyPillars({ c, images }: { c: LandingCopy; images: FootprintImage[] }) {
  const icons: LucideIcon[] = [HandCoins, ShieldCheck, Building2];
  return (
    <SectionShell id="why" variant="white">
      <SectionHeader eyebrow={c.benefits.eyebrow} title={c.benefits.title} center />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {c.benefits.items.map((item, i) => {
          const Icon = icons[i] ?? HandCoins;
          const image = images[i % Math.max(images.length, 1)];
          return (
            <Reveal key={item.title} delay={i * 70}>
              <article className="h-full overflow-hidden rounded-2xl border border-[#dbe1e5] bg-white">
                <div className="relative h-28 overflow-hidden bg-[#0a2d46]">
                  {image?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.src}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full bg-[radial-gradient(circle_at_78%_20%,rgba(197,163,77,0.3),transparent_40%),linear-gradient(135deg,#071c2c,#0a4b72)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071c2c]/55 to-transparent" />
                  <span className="absolute bottom-3 left-4 grid size-10 place-items-center rounded-lg bg-white text-[#0a2d46] shadow-md">
                    <Icon className="size-5" />
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[#152b3b]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#63737d]">{item.body}</p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}

/** The trust anchor: real building photos, captioned with name + city. */
export function BuildingsGallery({
  c,
  images,
  lang,
}: {
  c: LandingCopy;
  images: FootprintImage[];
  lang: Lang;
}) {
  const shots = images.slice(0, 8);
  if (shots.length === 0) return null;
  return (
    <SectionShell id="buildings" variant="light" className="border-y border-[#dfe5e8]">
      <SectionHeader eyebrow={c.buildings.eyebrow} title={c.buildings.title} body={c.buildings.body} />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shots.map((img, i) => (
          <Reveal key={`${img.src}-${i}`} delay={(i % 4) * 60}>
            <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#dbe1e5] bg-[#0a2d46]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={tx(img.alt, lang) || tx(img.title, lang)}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071c2c]/80 via-[#071c2c]/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-3.5">
                <p className="truncate text-sm font-semibold text-white">{tx(img.title, lang)}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/75">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{tx(img.subtitle, lang)}</span>
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

/** Three simple steps, jargon-free. */
export function HowItWorks({ c }: { c: LandingCopy }) {
  const icons: LucideIcon[] = [Layers, BadgeCheck, Banknote];
  return (
    <SectionShell id="how" variant="white">
      <SectionHeader eyebrow={c.ways.eyebrow} title={c.ways.title} body={c.ways.caption} center />
      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
        {c.ways.items.map((item, i) => {
          const Icon = icons[i] ?? Building2;
          return (
            <Reveal key={item.title} delay={i * 80}>
              <article className="flex h-full flex-col rounded-2xl border border-[#dbe1e5] bg-[#fbfcfc] p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#0a2d46] text-[#d6b96e]">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-serif text-2xl font-semibold tabular-nums text-[#d6b96e]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#152b3b]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#63737d]">{item.body}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}

/** Plain-language FAQ — directly answers the questions a cold visitor asks. */
export function FAQ({ c }: { c: LandingCopy }) {
  return (
    <SectionShell id="faq" variant="light" className="border-t border-[#dfe5e8]">
      <div className="mx-auto max-w-3xl">
        <SectionHeader eyebrow={c.faq.eyebrow} title={c.faq.title} center />
        <div className="mt-10 space-y-3">
          {c.faq.items.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[#dbe1e5] bg-white px-5 transition-shadow open:shadow-[0_20px_50px_-40px_rgba(7,28,44,0.6)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-[#152b3b] marker:content-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="size-5 shrink-0 text-[#0a4b72] transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="pb-5 text-sm leading-6 text-[#5a6a74]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

export function FinalCta({ c }: { c: LandingCopy }) {
  return (
    <section className="bg-[#09283d] text-white">
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#d6b96e]">
          <KeyRound className="size-3.5" />
          {c.final.eyebrow}
        </span>
        <h2 className="mt-6 font-serif text-3xl font-semibold sm:text-4xl">{c.final.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70">{c.final.body}</p>
        <Link
          href={SIGN_UP}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#0a2d46] transition-transform hover:-translate-y-0.5"
        >
          {c.actions.getAccess}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer (minimal required disclosure only)                           */
/* ------------------------------------------------------------------ */

export function LandingFooter({ c }: { c: LandingCopy }) {
  return (
    <footer className="bg-[#071c2c] px-4 py-8 text-xs leading-5 text-white/55 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-[auto_minmax(0,54rem)] md:items-start md:justify-between">
        <div>
          <p>{c.footer.rights}</p>
          <ParvisCoBrand className="mt-3" />
        </div>
        <div className="md:text-right">
          <p className="text-white/70">{c.footer.risk}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:justify-end">
            <span>{c.footer.dealer}</span>
            <Link href={`${NORTH_BASE}/legal`} className="font-semibold text-white/75 transition-colors hover:text-white">
              {c.footer.legalLink}
            </Link>
            <span className="inline-flex items-center gap-3">
              <span aria-hidden="true" className="text-white/25">·</span>
              <a
                href="https://www.parvisinvest.com/legal/disclosures"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-white/75 transition-colors hover:text-white"
              >
                {c.footer.parvisLink}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
