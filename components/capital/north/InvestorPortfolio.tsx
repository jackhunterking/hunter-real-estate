"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BanknoteArrowDown, Compass, MapPinned, Target, TrendingUp, WalletCards } from "lucide-react";
import type { Lang, OfferingBundle } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import { buildMapProperties, formatCurrencyCad, formatMoneyCompact, primaryShareClass } from "@/lib/capital/present";
import { PositionCard, type IncomePeriod } from "./PositionCard";
import { latestPublished12mReturn, parseTargetMidpoint, portfolioMonthlyIncome, type MonthlyIncomeBreakdown } from "@/lib/capital/performance";
import { unitPriceOf, impliedShares } from "@/lib/capital/shares";
import { taxonomyLabel } from "@/lib/capital/taxonomies";
import { requestStage } from "@/lib/capital/investment-requests";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";
import { FundMap } from "@/components/capital/map/FundMap";
import { OfferingSummaryCard, offeringBundleCardProps } from "@/components/capital/OfferingSummaryCard";
import { InfoPopover } from "@/components/capital/InfoPopover";
import { NORTH_BASE } from "./NorthBrand";
import { PageHeader, Panel } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";
import { useTaxonomies } from "./TaxonomyProvider";

const COPY = {
  en: {
    title: "Portfolio",
    description:
      "Your committed amounts and each investment's published figures—not income received or market value.",
    totalInvested: "Total invested",
    totalInvestedNote: "Amount you've committed across your investments—not current value or income received.",
    avgPastReturn: "Avg. past return (12 mo)",
    avgPastNote: "Your investments' published 12-month returns, weighted by your commitment—not income you received.",
    avgPastCoverage: (n: number, held: number) =>
      `Based on ${n} of ${held} ${held === 1 ? "investment" : "investments"} that published a 12-month figure.`,
    avgTargetReturn: "Avg. target return",
    avgTargetNote:
      "Blended midpoint of your investments' published target ranges, weighted by your commitment. Targets are not guaranteed.",
    infoLabel: "What this means",
    monthlyIncome: "Est. monthly income",
    monthlyIncomeNote:
      "Blended from your investments' published target distribution (cash) and target return, weighted by your commitment. Illustrative estimate—growth is unrealized and not guaranteed.",
    incomeCash: "Cash",
    incomeGrowth: "Growth",
    positionsTitle: "Your positions",
    units: "units",
    reviewBadge: "In review",
    periodLabel: "Show figures per",
    periodYear: "Year",
    periodMonth: "Month",
    approxNote: "* Approximate figures.",
    paysYou: "Pays you*",
    growth: "Growth*",
    growthNote: "unrealized, not paid out",
    targetTotal: "Target total*",
    perYear: "a year",
    perMonth: "a month",
    average: "average",
    invested: "invested",
    ofPortfolio: "of portfolio",
    viewPosition: "View",
    inProgressTitle: "In progress",
    inProgressBody: "Requests we're working through. Not yet holdings.",
    requested: "requested",
    startTitle: "Start your portfolio",
    startBody:
      "Explore the opportunities below, then request to invest.",
    moreTitle: "More opportunities",
    moreBody: "Available investments you can add to your portfolio.",
    viewOffering: "View details",
    buildings: "buildings",
    geographyTitle: "Geography",
    couldHoldNote: "Illustrative—not owned.",
    mapHeld: "Where your assets are located",
    mapOpp: "Your investment locations",
    mapHelp: "Select a marker or card to see the property.",
  },
  tr: {
    title: "Portföy",
    description:
      "Taahhüt ettiğiniz tutarlar ve her yatırımın yayımladığı rakamlar—elde edilen gelir veya piyasa değeri değildir.",
    totalInvested: "Toplam yatırılan",
    totalInvestedNote: "Yatırımlarınıza taahhüt ettiğiniz tutar—güncel değer veya elde edilen gelir değil.",
    avgPastReturn: "Ort. geçmiş getiri (12 ay)",
    avgPastNote:
      "Yatırımlarınızın yayımladığı 12 aylık getiriler, taahhüdünüze göre ağırlıklandırılmıştır—elde ettiğiniz gelir değildir.",
    avgPastCoverage: (n: number, held: number) => `12 aylık veri yayımlayan ${held} yatırımdan ${n} tanesine dayanır.`,
    avgTargetReturn: "Ort. hedef getiri",
    avgTargetNote:
      "Yatırımlarınızın yayımladığı hedef aralıklarının, taahhüdünüze göre ağırlıklı orta noktası. Hedefler garanti değildir.",
    infoLabel: "Ne anlama geliyor",
    monthlyIncome: "Tahmini aylık gelir",
    monthlyIncomeNote:
      "Yatırımlarınızın yayımladığı hedef dağıtım (nakit) ve hedef getirisinden, taahhüdünüze göre ağırlıklandırılarak hesaplanır. Örnek amaçlı tahmindir—büyüme gerçekleşmemiştir ve garanti değildir.",
    incomeCash: "Nakit",
    incomeGrowth: "Büyüme",
    positionsTitle: "Pozisyonlarınız",
    units: "birim",
    reviewBadge: "İncelemede",
    periodLabel: "Rakamları şu döneme göre göster",
    periodYear: "Yıl",
    periodMonth: "Ay",
    approxNote: "* Yaklaşık rakamlar.",
    paysYou: "Size ödenen*",
    growth: "Büyüme*",
    growthNote: "gerçekleşmemiş, ödenmez",
    targetTotal: "Hedef toplam*",
    perYear: "yılda",
    perMonth: "ayda",
    average: "ortalama",
    invested: "yatırıldı",
    ofPortfolio: "portföyün",
    viewPosition: "Gör",
    inProgressTitle: "Devam eden",
    inProgressBody: "Üzerinde çalıştığımız talepler. Henüz pozisyon değil.",
    requested: "talep edildi",
    startTitle: "Portföyünüzü oluşturun",
    startBody:
      "Aşağıdaki fırsatları inceleyin, ardından yatırım talep edin.",
    moreTitle: "Diğer fırsatlar",
    moreBody: "Portföyünüze ekleyebileceğiniz mevcut yatırımlar.",
    viewOffering: "Detayları gör",
    buildings: "bina",
    geographyTitle: "Coğrafya",
    couldHoldNote: "Örnek amaçlı—sahip olunmaz.",
    mapHeld: "Varlıklarınızın konumları",
    mapOpp: "Bu fırsatların konumları",
    mapHelp: "Mülkü görmek için bir işaretçi veya kart seçin.",
  },
} as const;

type RequestStatus = InvestmentApplication["status"];
type Aggregated = { position: { id: string; amount: number; shareQuantity: number; status: RequestStatus }; fund: OfferingBundle };

/** Group a user's positions by offering, summing committed amounts and whole units. */
function aggregate(offerings: OfferingBundle[], positions: { id: string; offeringId: string; amount: number; shareQuantity?: number; status: RequestStatus }[]): Aggregated[] {
  return offerings.flatMap((fund) => {
    const held = positions.filter((position) => position.offeringId === fund.id);
    if (!held.length) return [];
    return [{
      position: {
        id: held[0].id,
        amount: held.reduce((sum, p) => sum + p.amount, 0),
        shareQuantity: held.reduce((sum, p) => sum + (p.shareQuantity ?? 0), 0),
        status: held[0].status,
      },
      fund,
    }];
  });
}

/** Whole units for a position — real subscribed units, else implied from a legacy amount. */
function positionShares(position: { amount: number; shareQuantity: number }, fund: OfferingBundle): number {
  if (position.shareQuantity > 0) return position.shareQuantity;
  const implied = impliedShares(position.amount, unitPriceOf(fund));
  return implied != null ? Math.round(implied) : 0;
}

/** "≈ 12.7%" / "≈ %12,7". Trailing ".0" trimmed. */
function fmtPct(value: number, lang: Lang): string {
  const n = value.toFixed(1).replace(/\.0$/, "");
  return lang === "tr" ? `≈ %${n.replace(".", ",")}` : `≈ ${n}%`;
}

/** Amount-weighted average of published fund figures; null when nothing qualifies. */
function weightedAverage(rows: { amount: number; r: number }[]): number | null {
  const weight = rows.reduce((sum, x) => sum + x.amount, 0);
  if (weight <= 0) return null;
  return rows.reduce((sum, x) => sum + x.amount * x.r, 0) / weight;
}

// Dev-preview only: no Supabase session means no real holdings, so the funded
// experience is never visible. Seed a couple of funded positions (and, when
// enough offerings exist, one in-review) so the portfolio can be previewed.
// Fixed id/date keep SSR and client render identical (no hydration mismatch).
const PREVIEW_AMOUNTS = [145000, 90000, 210000, 60000];
function previewHoldings(offerings: OfferingBundle[], userId: string): InvestmentApplication[] {
  return offerings.slice(0, 3).map((offering, index) => {
    const budget = PREVIEW_AMOUNTS[index] ?? 100000;
    const price = unitPriceOf(offering);
    const shareQuantity = price ? Math.floor(budget / price) : undefined;
    return {
      id: `preview-${offering.id}`,
      userId,
      offeringId: offering.id,
      // Invested amount follows the whole-share rule, matching the real flow.
      amount: price && shareQuantity ? Math.round(shareQuantity * price * 100) / 100 : budget,
      shareQuantity,
      status: index === 2 ? "submitted" : "funded",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
  });
}

/** useLayoutEffect on the client, useEffect on the server — avoids the SSR warning. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const PERIOD_KEY = "hnc-position-period";

export function InvestorPortfolio({ offerings, viewAsUserId, investments }: { offerings: OfferingBundle[]; viewAsUserId?: string; investments?: InvestmentApplication[] }) {
  const { lang } = useLang();
  const { currentUser, dataset, previewEnabled, backendConfigured } = usePortalAccess();
  const { assetClasses, strategies } = useTaxonomies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Monthly by default so the cards agree with the "Est. monthly income" tile
  // above them on first paint rather than contradicting it.
  const [period, setPeriod] = useState<IncomePeriod>("month");
  const c = pick(COPY, lang);

  // Layout effect, not effect: a stored "year" preference applies before paint,
  // so the cards never flash the monthly figures first.
  useIsomorphicLayoutEffect(() => {
    try {
      const saved = window.localStorage.getItem(PERIOD_KEY);
      if (saved === "year" || saved === "month") setPeriod(saved);
    } catch {
      // Storage unavailable — the monthly default stands for this visit.
    }
  }, []);

  function choosePeriod(next: IncomePeriod) {
    setPeriod(next);
    try {
      window.localStorage.setItem(PERIOD_KEY, next);
    } catch {
      // Setting still applies for this visit.
    }
  }

  // `viewAsUserId` renders another investor's portfolio verbatim for the admin
  // mirror; without it this is the signed-in investor's own portfolio.
  const targetUserId = viewAsUserId ?? currentUser.id;
  const source = investments ?? dataset.investments;
  const realMine = source.filter((investment) => investment.userId === targetUserId);
  // In dev-preview (no backend) with no real holdings, show seeded sample
  // positions so the funded experience is visible. Never seed the admin mirror.
  const mine = !viewAsUserId && previewEnabled && !backendConfigured && realMine.length === 0 && offerings.length > 0
    ? previewHoldings(offerings, targetUserId)
    : realMine;
  const heldFunds = aggregate(offerings, mine.filter((i) => i.status === "funded"));
  const reviewFunds = aggregate(offerings, mine.filter((i) => requestStage(i.status) === "in-review"));

  const engagedIds = new Set([...heldFunds, ...reviewFunds].map(({ fund }) => fund.id));
  const opportunities = offerings.filter((offering) => offering.status === "available" && !engagedIds.has(offering.id));

  // Buildings drive the map + geography: real holdings when present, else the
  // opportunities shown below (clearly captioned as illustrative).
  const usingHeld = heldFunds.length > 0;
  const visualFunds = usingHeld ? heldFunds.map(({ fund }) => fund) : opportunities;

  const properties = useMemo(
    () => visualFunds.flatMap((fund) => buildMapProperties(fund, lang, assetClasses).map((property) => ({
      ...property,
      id: `${fund.id}:${property.id}`,
      offeringName: tx(fund.shortName, lang),
    }))),
    [visualFunds, lang, assetClasses],
  );

  const buildings = visualFunds.flatMap((fund) => fund.properties);
  const geography = groupCount(buildings.map((b) => b.province)).map(({ key, count }) => ({ label: key, count }));

  // KPIs — qualitative, derived only from committed amounts + each fund's
  // published figures. We never claim to track income received.
  const totalInvested = heldFunds.reduce((sum, item) => sum + item.position.amount, 0);
  const pastRows = heldFunds
    .map((h) => ({ amount: h.position.amount, r: latestPublished12mReturn(h.fund.trailingReturns) }))
    .filter((x): x is { amount: number; r: number } => x.r != null && x.amount > 0);
  const targetRows = heldFunds
    .map((h) => ({ amount: h.position.amount, r: parseTargetMidpoint(primaryShareClass(h.fund)?.targetReturn?.value ?? "") }))
    .filter((x): x is { amount: number; r: number } => x.r != null && x.amount > 0);
  const avgPast = weightedAverage(pastRows);
  const avgTarget = weightedAverage(targetRows);

  // Estimated monthly income, split into cash distribution + unrealized growth.
  // Derived from each held fund's published target distribution and target
  // return; frequency is irrelevant to a monthly average (see the helper).
  const income = portfolioMonthlyIncome(
    heldFunds.map((h) => ({
      amount: h.position.amount,
      targetDistribution: primaryShareClass(h.fund)?.targetDistribution?.value,
      targetReturn: primaryShareClass(h.fund)?.targetReturn?.value,
    })),
  );

  const hasHoldings = heldFunds.length > 0;
  const money = (n: number) => formatCurrencyCad(Math.round(n), lang);
  const incomeBody = hasHoldings && income ? <IncomeSplit income={income} money={money} c={c} /> : undefined;
  const tiles: { key: string; label: string; value: string; note: string; icon: typeof WalletCards; body?: ReactNode }[] = [
    { key: "invested", label: c.totalInvested, value: hasHoldings ? formatMoneyCompact(totalInvested, lang) : "—", note: c.totalInvestedNote, icon: WalletCards },
    // The star metric — how much the portfolio throws off per month.
    {
      key: "income",
      label: c.monthlyIncome,
      value: hasHoldings && income ? `≈ ${money(income.monthlyTotal)}` : "—",
      note: c.monthlyIncomeNote,
      icon: BanknoteArrowDown,
      body: incomeBody,
    },
    // Only shown when at least one held fund actually publishes a 12-month figure.
    ...(avgPast != null
      ? [{ key: "past", label: c.avgPastReturn, value: fmtPct(avgPast, lang), note: `${c.avgPastNote} ${c.avgPastCoverage(pastRows.length, heldFunds.length)}`, icon: TrendingUp }]
      : []),
    { key: "target", label: c.avgTargetReturn, value: avgTarget != null ? fmtPct(avgTarget, lang) : "—", note: c.avgTargetNote, icon: Target },
  ];
  const lgCols = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[tiles.length] ?? "lg:grid-cols-3";

  const renderFundCard = (keyId: string, fund: OfferingBundle, ctaSlot: ReactNode) => (
    <OfferingSummaryCard
      key={keyId}
      lang={lang}
      {...offeringBundleCardProps(fund, lang, strategies)}
      ctaSlot={ctaSlot}
    />
  );

  const strategyOf = (fund: OfferingBundle) =>
    fund.strategyIds[0] ? taxonomyLabel(strategies, fund.strategyIds[0], lang) : undefined;

  return (
    <div>
      <PageHeader title={c.title} description={c.description} />

      {/* KPI row — always visible so the portfolio overview reads as an empty
          state (— placeholders) before any holdings, then fills in once funded. */}
      {offerings.length > 0 && (
        <div className={cn("grid gap-3 sm:grid-cols-2", lgCols)}>
          {tiles.map(({ key, label, value, note, icon: Icon, body }) => (
            <Panel key={key} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <MetricLabel label={label} note={note} infoLabel={c.infoLabel} />
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf3f6] text-[#0a4b72]"><Icon className="size-5" /></span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[#102638]">{value}</p>
              {body}
            </Panel>
          ))}
        </div>
      )}

      {/* Funded holdings, each stated as cash + growth = target total. The
          period control drives every card at once: one unit across the section
          keeps any two positions comparable at a glance. */}
      {heldFunds.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#193143]">{c.positionsTitle}</h2>
            <PeriodToggle period={period} onChange={choosePeriod} c={c} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {heldFunds.map(({ position, fund }) => (
              <PositionCard
                key={fund.id}
                fund={fund}
                lang={lang}
                period={period}
                amount={position.amount}
                shares={positionShares(position, fund)}
                portfolioShare={totalInvested > 0 ? position.amount / totalInvested : 0}
                strategyLabel={strategyOf(fund)}
                c={{
                  paysYou: c.paysYou,
                  growth: c.growth,
                  growthNote: c.growthNote,
                  targetTotal: c.targetTotal,
                  perYear: c.perYear,
                  perMonth: c.perMonth,
                  average: c.average,
                  invested: c.invested,
                  units: c.units,
                  ofPortfolio: c.ofPortfolio,
                  view: c.viewPosition,
                }}
              />
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-[#8a949b]">{c.approxNote}</p>
        </section>
      )}

      {/* Requests still moving through review. Kept out of the positions grid:
          an application has no units and no income, so presenting it as a
          holding overstates what the investor actually owns. */}
      {reviewFunds.length > 0 && (
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#193143]">{c.inProgressTitle}</h2>
            <p className="mt-1 text-sm text-[#697681]">{c.inProgressBody}</p>
          </div>
          <div className="grid gap-2.5 md:grid-cols-2">
            {reviewFunds.map(({ position, fund }) => (
              <div key={fund.id} className="flex items-center gap-3 rounded-xl border border-[#e2e7ea] bg-white p-3">
                <span className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight text-[#102638]">{tx(fund.shortName, lang)}</p>
                  <span className="text-[11.5px] text-[#7a8790]">
                    {formatMoneyCompact(position.amount, lang)} {c.requested}
                  </span>
                  <RequestStageDots status={position.status} />
                </span>
                <span className="whitespace-nowrap rounded-md border border-[#eadcae] bg-[#f8f1dc] px-2 py-1 text-[11px] font-semibold text-[#755718]">
                  {c.reviewBadge}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Opportunities — the primary content for a new (empty) portfolio. */}
      {opportunities.length > 0 && (
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#193143]">{usingHeld ? c.moreTitle : c.startTitle}</h2>
            <p className="mt-1 text-sm text-[#697681]">{usingHeld ? c.moreBody : c.startBody}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {opportunities.map((fund) =>
              renderFundCard(
                fund.id,
                fund,
                <Link
                  href={`${NORTH_BASE}/investments/${fund.slug}`}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e]"
                >
                  {c.viewOffering}
                  <ArrowRight className="size-4" />
                </Link>,
              ),
            )}
          </div>
        </section>
      )}

      {/* Geography — where the investor's assets (or the opportunities) sit. */}
      {geography.length > 0 && (
        <section className="mt-8">
          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPinned className="size-4 text-[#0a4b72]" />
              <h2 className="text-sm font-semibold text-[#193143]">{c.geographyTitle}</h2>
            </div>
            <AllocationBars items={geography} total={buildings.length} unit={c.buildings} />
            {!usingHeld && <p className="mt-3 text-xs text-[#8a949b]">{c.couldHoldNote}</p>}
          </Panel>
        </section>
      )}

      {/* Map of asset locations (held, else opportunities). */}
      {properties.length > 0 && (
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#193143]">{usingHeld ? c.mapHeld : c.mapOpp}</h2>
            <p className="mt-1 text-sm text-[#697681]">{c.mapHelp}</p>
          </div>
          <FundMap properties={properties} selectedId={selectedId} onSelect={setSelectedId} variant="full" />
        </section>
      )}

      {/* Empty final fallback: no offerings at all. */}
      {opportunities.length === 0 && heldFunds.length === 0 && reviewFunds.length === 0 && (
        <Panel className="mt-8 grid min-h-[280px] place-items-center p-8 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf3f6] text-[#0a4b72]"><Compass className="size-7" /></span>
            <h2 className="mt-5 text-xl font-semibold text-[#193143]">{c.startTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[#65737e]">{c.startBody}</p>
            <Link href={`${NORTH_BASE}/investments`} className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.viewOffering}</Link>
          </div>
        </Panel>
      )}
    </div>
  );
}

/**
 * Year / month for every figure in the positions grid.
 *
 * A radiogroup rather than two buttons: the two options are one setting with
 * one answer, so arrow keys move between them and only the active option is
 * announced as checked.
 */
function PeriodToggle({
  period,
  onChange,
  c,
}: {
  period: IncomePeriod;
  onChange: (next: IncomePeriod) => void;
  c: { periodLabel: string; periodYear: string; periodMonth: string };
}) {
  const options: { key: IncomePeriod; label: string }[] = [
    { key: "year", label: c.periodYear },
    { key: "month", label: c.periodMonth },
  ];
  return (
    <div role="radiogroup" aria-label={c.periodLabel} className="flex shrink-0 gap-0.5 rounded-lg border border-[#e2e7ea] bg-[#f4f7f9] p-0.5">
      {options.map(({ key, label }, index) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={period === key}
          onClick={() => onChange(key)}
          onKeyDown={(event) => {
            if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            onChange(options[(index + 1) % options.length].key);
          }}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] transition-colors",
            period === key ? "bg-white text-[#0a2d46] shadow-sm" : "text-[#5c6b76] hover:text-[#102638]",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// The application statuses that precede funding, in the order they happen.
const REQUEST_STEPS: InvestmentApplication["status"][] = [
  "submitted",
  "compliance_review",
  "approved_for_subscription",
  "accepted",
];

/** Where a request has reached, as filled dots. Unknown statuses render nothing. */
function RequestStageDots({ status }: { status: InvestmentApplication["status"] }) {
  const current = REQUEST_STEPS.indexOf(status);
  if (current < 0) return null;
  return (
    <span className="mt-1.5 flex items-center" role="img" aria-label={`${current + 1}/${REQUEST_STEPS.length}`}>
      {REQUEST_STEPS.map((step, index) => (
        <span key={step} className="flex items-center">
          <span
            className={cn(
              "block size-[7px] rounded-full border",
              index < current && "border-[#0a2d46] bg-[#0a2d46]",
              index === current && "border-[#996c26] bg-[#996c26]",
              index > current && "border-[#cbd4da] bg-white",
            )}
          />
          {index < REQUEST_STEPS.length - 1 && (
            <span className={cn("mx-0.5 h-px w-2", index < current ? "bg-[#0a2d46]" : "bg-[#d8dfe4]")} />
          )}
        </span>
      ))}
    </span>
  );
}

function groupCount(keys: string[]): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const key of keys) map.set(key, (map.get(key) ?? 0) + 1);
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/**
 * A KPI tile's label with the shared info dot that reveals the (otherwise
 * hidden) explanation on click — the fine print only surfaces when the investor
 * asks for it.
 */
function MetricLabel({ label, note, infoLabel }: { label: string; note: string; infoLabel: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <p className="text-xs font-semibold text-[#6d7983]">{label}</p>
      <InfoPopover label={`${infoLabel}: ${label}`} content={note} />
    </div>
  );
}

/** Two-segment bar splitting the monthly total into cash distribution + growth. */
function IncomeSplit({
  income,
  money,
  c,
}: {
  income: MonthlyIncomeBreakdown;
  money: (n: number) => string;
  c: { incomeCash: string; incomeGrowth: string };
}) {
  const total = income.monthlyTotal || 1;
  const cashPct = Math.round((income.monthlyCash / total) * 100);
  return (
    <div className="mt-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-[#eef2f4]">
        <div className="h-full bg-[#0a4b72]" style={{ width: `${cashPct}%` }} />
        <div className="h-full bg-[#996c26]" style={{ width: `${100 - cashPct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6d7983]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#0a4b72]" aria-hidden />
          {c.incomeCash} <span className="font-semibold tabular-nums text-[#2c3e4c]">{money(income.monthlyCash)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#996c26]" aria-hidden />
          {c.incomeGrowth} <span className="font-semibold tabular-nums text-[#2c3e4c]">{money(income.monthlyGrowth)}</span>
        </span>
      </div>
    </div>
  );
}

function AllocationBars({ items, total, unit }: { items: { label: string; count: number }[]; total: number; unit: string }) {
  if (!items.length) return <p className="text-sm text-[#8a949b]">—</p>;
  return (
    <div className="space-y-3">
      {items.map(({ label, count }) => (
        <div key={label}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#2c3e4c]">{label}</span>
            <span className="tabular-nums text-[#6d7983]">{count} {unit}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef2f4]">
            <div className="h-full rounded-full bg-[#0a4b72]" style={{ width: `${Math.round((count / total) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
