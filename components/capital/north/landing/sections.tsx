"use client";

/**
 * Marketing sections for the Hunter & Hunter landing page. Each takes the
 * resolved `c: LandingCopy` (+ offering/derived data where needed) and composes
 * primitives + product frames. `PublicLanding` orchestrates them.
 *
 * Layout intent (Parvis-style): image-first, card-heavy, minimal prose. The
 * product mockups are the REAL portal components fed with real offering data.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  KeyRound,
  Layers,
  MapPin,
  MinusCircle,
  PiggyBank,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { PublicOfferingPreview } from "@/lib/capital/types";
import { tx } from "@/lib/i18n/localize";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { Lang } from "@/lib/i18n/dictionaries";
import {
  historicalEarnings,
  publicPreviewToFundComparable,
  type FundComparable,
  type FundPeriod,
} from "@/lib/capital/compare-investments";
import { NORTH_BASE, NorthBrand, ParvisCoBrand } from "../NorthBrand";
import { DisclosureBar } from "../DisclosureBar";
import { FundSelect, HeroCashFlow, PrimaryAmountField } from "../CompareUI";
import { Panel, money } from "../PortalUI";
import type { LandingCopy } from "./copy";
import { LanguageSelect } from "../LanguageSelect";
import {
  Reveal,
  SectionHeader,
  SectionShell,
  type FootprintImage,
} from "./primitives";
import { OpportunityCard } from "./mockups";

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
          <a href="#compare" className="text-xs font-semibold text-[#52636f] transition-colors hover:text-[#0a2d46]">
            {c.nav.compare}
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
          <Link
            href={`${NORTH_BASE}/sign-in`}
            className="hidden h-10 items-center rounded-md px-3 text-sm font-semibold text-[#0a2d46] hover:bg-[#eef2f4] sm:inline-flex"
          >
            {c.actions.signIn}
          </Link>
          {/* Language selector sits in the prominent top-right corner. */}
          <LanguageSelect variant="compact" />
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
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b96e]">{c.hero.eyebrow}</p>
          <h1 className="mt-5 max-w-xl font-serif text-4xl font-semibold leading-[1.06] sm:text-[3.25rem]">
            {c.hero.title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70 sm:text-lg">{c.hero.body}</p>

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

        <div className="relative">
          {hasOfferings && <HeroCarousel offerings={offerings} c={c} />}
        </div>
      </div>
    </section>
  );
}

/**
 * Swipeable rail of the real `OfferingSummaryCard` (via `OpportunityCard`) — the
 * same product surface an investor sees after signing in. Built to scale: two
 * funds today, a dozen tomorrow, with no layout change. Scroll-snap drives the
 * dots; the arrows drive the scroll. Single card → no controls.
 */
function HeroCarousel({
  offerings,
  c,
}: {
  offerings: PublicOfferingPreview[];
  c: LandingCopy;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = offerings.length;

  function behavior(): ScrollBehavior {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
  }

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(count - 1, next));
    const item = trackRef.current?.children[clamped] as HTMLElement | undefined;
    item?.scrollIntoView({ behavior: behavior(), inline: "center", block: "nearest" });
    setIndex(clamped);
  }

  function syncFromScroll() {
    const track = trackRef.current;
    if (!track) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const childMid = el.offsetLeft + el.clientWidth / 2;
      const dist = Math.abs(childMid - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setIndex(best);
  }

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
      <div aria-hidden className="absolute -inset-5 rounded-[2rem] bg-[#2f7194]/18 blur-2xl" />
      <div
        ref={trackRef}
        onScroll={syncFromScroll}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {offerings.map((offering) => (
          <div key={offering.id} className="w-full shrink-0 snap-center">
            <OpportunityCard offering={offering} c={c} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="relative mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous"
            className="grid size-9 place-items-center rounded-full border border-white/25 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {offerings.map((offering, i) => (
              <button
                key={offering.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === count - 1}
            aria-label="Next"
            className="grid size-9 place-items-center rounded-full border border-white/25 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Income simulator — published returns, per year & per month (table)  */
/* ------------------------------------------------------------------ */

const SIM_ACCENT = "#0a4b72";

/** Period → row title: a calendar year, or the inception label. */
function simPeriodTitle(p: FundPeriod, c: LandingCopy): string {
  if (p.role === "inception") {
    return p.derived ? c.simulator.averageOfYears : c.simulator.sinceInception;
  }
  return p.year ? String(p.year) : c.simulator.sinceInception;
}

/**
 * Public "what could my money earn?" tool. Same engine and components as the
 * signed-in Passive tools: `publicPreviewToFundComparable` builds a fund from
 * its PUBLISHED calendar-year returns, then a selectable Period · Return ·
 * Earned table drives the shared `HeroCashFlow` headline. Historical figures
 * only — never a forecast.
 */
export function Simulator({
  c,
  offerings,
}: {
  c: LandingCopy;
  offerings: PublicOfferingPreview[];
}) {
  const { lang } = useLang();
  // Only funds with usable published calendar-year returns can be simulated.
  const funds = offerings
    .map(publicPreviewToFundComparable)
    .filter((f): f is FundComparable => f !== null);

  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [amount, setAmount] = useState(50000);
  const fund = funds.find((f) => f.id === fundId) ?? funds[0];
  const [periodKey, setPeriodKey] = useState(fund?.periods[0]?.key ?? "");

  if (!fund) return null;

  const period = fund.periods.find((p) => p.key === periodKey) ?? fund.periods[0];
  const earn = period ? historicalEarnings(amount, period.pct) : null;

  // A new fund may not publish the selected period; reset to its newest one.
  function selectFund(id: string) {
    setFundId(id);
    setPeriodKey(funds.find((f) => f.id === id)?.periods[0]?.key ?? "");
  }

  return (
    <SectionShell id="simulator" variant="white">
      <SectionHeader
        eyebrow={c.simulator.eyebrow}
        title={c.simulator.title}
        body={c.simulator.body}
        center
      />

      <Panel className="mx-auto mt-10 max-w-2xl overflow-hidden">
        {/* Invested amount — full width, drives the whole tool. */}
        <div className="border-b border-[#e2e8eb] bg-[#f8fafb] px-5 py-4">
          <PrimaryAmountField label={c.simulator.amountLabel} value={amount} onChange={setAmount} />
        </div>

        {/* Fund picker + the selected period's headline income. */}
        <div className="px-5 py-5">
          <div className="flex min-h-9 items-center gap-2">
            <FundSelect
              funds={funds}
              value={fund.id}
              onChange={selectFund}
              lang={lang}
              label={c.simulator.fundLabel}
              focusClass="focus:border-[#0a4b72] focus:ring-2 focus:ring-[#0a4b72]/15"
              activeClass="bg-[#eef4f7] font-semibold text-[#0a4b72]"
            />
          </div>

          {earn && period && (
            <>
              <HeroCashFlow
                value={money(earn.monthly, lang)}
                unit={c.simulator.perMonth}
                color={SIM_ACCENT}
                invested={money(amount, lang)}
                investedLabel={c.simulator.invested}
                metricValue={`${period.pct >= 0 ? "+" : ""}${period.pct.toFixed(1)}%`}
                metricLabel={simPeriodTitle(period, c)}
              />
              <p className="mt-3 text-sm text-[#40515e]">
                ≈ <span className="font-semibold tabular-nums">{money(earn.annual, lang)}</span>{" "}
                <span className="text-[#7a8790]">{c.simulator.perYear}</span>
              </p>
            </>
          )}
        </div>

        {/* Published returns, period by period — tap to compare. */}
        <div className="border-t border-[#e2e8eb] px-5 py-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8291a0]">
            {c.simulator.tableCaption}
          </p>
          <SimPerformanceTable
            fund={fund}
            amount={amount}
            selectedKey={period?.key ?? ""}
            onSelect={setPeriodKey}
            lang={lang}
            c={c}
          />
        </div>
      </Panel>
    </SectionShell>
  );
}

/**
 * The fund's published returns as a selectable table — Period · Return · what
 * that paid per year and per month on the entered cash. The same interaction as
 * the portal Passive tools' period table, adapted to a single fund.
 */
function SimPerformanceTable({
  fund,
  amount,
  selectedKey,
  onSelect,
  lang,
  c,
}: {
  fund: FundComparable;
  amount: number;
  selectedKey: string;
  onSelect: (key: string) => void;
  lang: Lang;
  c: LandingCopy;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8eb] bg-white">
      <table className="w-full min-w-[420px] text-left">
        <thead className="border-b border-[#e2e8eb] bg-[#f6f9fa]">
          <tr>
            <th scope="col" className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">
              {c.simulator.colPeriod}
            </th>
            <th scope="col" className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">
              {c.simulator.colReturn}
            </th>
            <th scope="col" className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">
              {c.simulator.colPerYear}
            </th>
            <th scope="col" className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">
              {c.simulator.colPerMonth}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f4]">
          {fund.periods.map((p) => {
            const active = p.key === selectedKey;
            const e = historicalEarnings(amount, p.pct);
            return (
              <tr
                key={p.key}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => onSelect(p.key)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onSelect(p.key);
                  }
                }}
                className={`cursor-pointer transition ${active ? "bg-[#eef4f7]" : "hover:bg-[#f6f9fa]"}`}
              >
                <th scope="row" className={`px-3 py-2 text-sm font-medium ${active ? "text-[#0a2d46]" : "text-[#40515e]"}`}>
                  {simPeriodTitle(p, c)}
                </th>
                <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums" style={{ color: active ? SIM_ACCENT : "#40515e" }}>
                  {p.pct >= 0 ? "+" : ""}
                  {p.pct.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right text-sm tabular-nums text-[#67757f]">{money(e.annual, lang)}</td>
                <td className="px-3 py-2 text-right text-sm tabular-nums text-[#67757f]">{money(e.monthly, lang)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

/* ------------------------------------------------------------------ */
/* How it compares — the three paths, head to head                     */
/* ------------------------------------------------------------------ */

/**
 * Tone per cell, index-aligned to `c.compare.rows`. Decorative only — the cell
 * text carries the whole meaning, so the icons are `aria-hidden`.
 *
 * Deliberately not a clean sweep: public markets genuinely win on entry cost,
 * liquidity and no-debt, and saying so is what makes the rest of the table
 * believable. Keep it honest when editing rows.
 */
type CompareTone = "good" | "mixed" | "poor";

const COMPARE_TONES: { self: CompareTone; hnc: CompareTone; markets: CompareTone }[] = [
  { self: "mixed", hnc: "good", markets: "mixed" }, // what you own
  { self: "poor", hnc: "good", markets: "mixed" }, // who does the work
  { self: "mixed", hnc: "good", markets: "mixed" }, // where income comes from
  { self: "poor", hnc: "good", markets: "good" }, // getting started
  { self: "poor", hnc: "good", markets: "mixed" }, // how you get in
  { self: "poor", hnc: "good", markets: "good" }, // debt in your name
  { self: "poor", hnc: "good", markets: "mixed" }, // spreading the risk
  { self: "mixed", hnc: "good", markets: "mixed" }, // day-to-day swings
  { self: "poor", hnc: "good", markets: "good" }, // registered accounts
  { self: "poor", hnc: "good", markets: "good" }, // getting out
];

const TONE_ICON: Record<CompareTone, LucideIcon> = {
  good: CheckCircle2,
  mixed: MinusCircle,
  poor: XCircle,
};

/** Gold is reserved for our own column so the eye lands there first. */
function toneColor(tone: CompareTone, highlight: boolean) {
  if (tone === "good") return highlight ? "text-[#c5a34d]" : "text-[#0a4b72]";
  if (tone === "mixed") return "text-[#9aa7b0]";
  return "text-[#a2704a]";
}

function CompareCellBody({
  text,
  tone,
  highlight = false,
}: {
  text: string;
  tone: CompareTone;
  highlight?: boolean;
}) {
  const Icon = TONE_ICON[tone];
  return (
    <span className="flex gap-2.5">
      <Icon className={`mt-0.5 size-4 shrink-0 ${toneColor(tone, highlight)}`} aria-hidden />
      <span className={highlight ? "font-medium text-[#1c3143]" : ""}>{text}</span>
    </span>
  );
}

/**
 * One column's answer on mobile. Deliberately flat — a left rule instead of a
 * nested card, and the tone icon beside the column label rather than the prose,
 * so ten attributes stay a scroll rather than a trek.
 */
/**
 * Head-to-head comparison, one rival at a time. The visitor picks the
 * alternative they are actually weighing (a rental, or listed stocks) and sees
 * a focused two-column view against our approach — never three dense columns at
 * once. Same `c.compare.rows`; only the rival column swaps. Argument-based by
 * design: no index or fund return figures appear here.
 */
export function HowItCompares({ c }: { c: LandingCopy }) {
  const cols = c.compare.columns;
  const [rival, setRival] = useState<"self" | "markets">("self");
  const tones = (i: number) =>
    COMPARE_TONES[i] ?? { self: "mixed" as const, hnc: "good" as const, markets: "mixed" as const };

  const rivalLabel = rival === "self" ? cols.self : cols.markets;
  const toggle = [
    { key: "self" as const, label: cols.self },
    { key: "markets" as const, label: cols.markets },
  ];

  return (
    <SectionShell id="compare" variant="light">
      <SectionHeader eyebrow={c.compare.eyebrow} title={c.compare.title} body={c.compare.body} center />

      {/* Rival toggle — pick the one thing on the visitor's mind. */}
      <div className="mt-8 flex justify-center">
        <div role="group" aria-label={c.compare.rowHeader} className="inline-flex rounded-xl border border-[#dce3e7] bg-white p-1">
          {toggle.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRival(t.key)}
              aria-pressed={rival === t.key}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                rival === t.key ? "bg-[#0a2d46] text-white" : "text-[#52636f] hover:text-[#0a2d46]"
              }`}
            >
              <span className={rival === t.key ? "text-white/55" : "text-[#8291a0]"}>vs.</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <Reveal className="mx-auto mt-8 max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-[#dbe1e5] bg-white">
          {/* Column header (labels repeat inline per-row on phones). */}
          <div className="grid grid-cols-[1fr_1fr] border-b border-[#e2e8eb] sm:grid-cols-[0.8fr_1fr_1fr]">
            <div className="hidden px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0] sm:block">
              {c.compare.rowHeader}
            </div>
            <div className="px-4 py-3.5 text-sm font-semibold text-[#52636f]">{rivalLabel}</div>
            <div className="border-l border-t-2 border-l-[#e2e8eb] border-t-[#c5a34d] bg-[#f6f9fa] px-4 pb-3.5 pt-3">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#a8873a]">{c.compare.hncBadge}</span>
              <span className="mt-0.5 block text-sm font-semibold text-[#0a2d46]">{cols.hnc}</span>
            </div>
          </div>

          <div className="divide-y divide-[#eef2f4]">
            {c.compare.rows.map((row, i) => {
              const t = tones(i);
              return (
                <div
                  key={row.label}
                  className="grid grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-[0.8fr_1fr_1fr] sm:gap-0 sm:px-0 sm:py-0"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#67757f] sm:px-5 sm:py-4">
                    {row.label}
                  </p>
                  <div className="text-sm leading-6 text-[#5a6a74] sm:px-4 sm:py-4">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8291a0] sm:hidden">
                      {rivalLabel}
                    </span>
                    <CompareCellBody text={row[rival]} tone={t[rival]} />
                  </div>
                  <div className="text-sm leading-6 text-[#40515e] sm:border-l sm:border-[#e2e8eb] sm:bg-[#f6f9fa] sm:px-4 sm:py-4">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a8873a] sm:hidden">
                      {cols.hnc}
                    </span>
                    <CompareCellBody text={row.hnc} tone={t.hnc} highlight />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="mx-auto mt-6 flex max-w-4xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <p className="max-w-3xl text-[11px] leading-5 text-[#8a949b]">{c.compare.note}</p>
        <a
          href="#how"
          className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-md border border-[#cdd7dd] px-5 text-sm font-semibold text-[#0a2d46] transition-colors hover:bg-[#eef4f7]"
        >
          {c.compare.cta}
          <ArrowRight className="size-4" />
        </a>
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
/* Footer (one line; everything else folded into `Disclosures`)         */
/* ------------------------------------------------------------------ */

export function LandingFooter() {
  return (
    <footer className="bg-[#071c2c] px-4 py-6 sm:px-8">
      <DisclosureBar tone="dark" copyright className="mx-auto max-w-7xl" />
    </footer>
  );
}
