"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BanknoteArrowDown, Compass, MapPinned, Target, TrendingUp, WalletCards } from "lucide-react";
import type { Lang, OfferingBundle } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import { buildMapProperties, formatCurrencyCad, formatMoneyCompact, primaryShareClass } from "@/lib/capital/present";
import { latestPublished12mReturn, parseTargetMidpoint, portfolioMonthlyIncome, type MonthlyIncomeBreakdown } from "@/lib/capital/performance";
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
      "An overview of the investments you hold and the opportunities open to you. Figures are your committed amounts and each investment's published targets and returns—not income received or live market value.",
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
    committed: "committed",
    reviewBadge: "In review",
    fundedBadge: "Funded",
    viewFund: "View investment",
    startTitle: "Start your portfolio",
    startBody:
      "You don't hold any investments yet. Explore the opportunities below—review each investment's assets, locations, and terms—then request to invest.",
    moreTitle: "More opportunities",
    moreBody: "Available investments you can add to your portfolio.",
    viewOffering: "View details",
    buildings: "buildings",
    geographyTitle: "Geography",
    couldHoldNote: "Based on the opportunities below—shown for illustration, not owned.",
    mapHeld: "Where your assets are located",
    mapOpp: "Where these opportunities are located",
    mapHelp: "Select a marker or building card to see the property, its photo, and location.",
  },
  tr: {
    title: "Portföy",
    description:
      "Sahip olduğunuz yatırımların ve size açık fırsatların genel görünümü. Gösterilen rakamlar taahhüt ettiğiniz tutarlar ile her yatırımın yayımladığı hedef ve getirilerdir—elde edilen gelir veya canlı piyasa değeri değildir.",
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
    committed: "taahhüt",
    reviewBadge: "İncelemede",
    fundedBadge: "Fonlandı",
    viewFund: "Yatırımı gör",
    startTitle: "Portföyünüzü oluşturun",
    startBody:
      "Henüz bir yatırıma sahip değilsiniz. Aşağıdaki fırsatları inceleyin—her yatırımın varlıklarını, konumlarını ve koşullarını gözden geçirin—ardından yatırım talep edin.",
    moreTitle: "Diğer fırsatlar",
    moreBody: "Portföyünüze ekleyebileceğiniz mevcut yatırımlar.",
    viewOffering: "Detayları gör",
    buildings: "bina",
    geographyTitle: "Coğrafya",
    couldHoldNote: "Aşağıdaki fırsatlara dayanır—örnek amaçlıdır, sahip olunmaz.",
    mapHeld: "Varlıklarınızın konumları",
    mapOpp: "Bu fırsatların konumları",
    mapHelp: "Mülkü, fotoğrafını ve konumunu görmek için bir işaretçi veya bina kartı seçin.",
  },
} as const;

type Aggregated = { position: { id: string; amount: number; status: string }; fund: OfferingBundle };

/** Group a user's positions by offering, summing amounts. */
function aggregate(offerings: OfferingBundle[], positions: { id: string; offeringId: string; amount: number; status: string }[]): Aggregated[] {
  return offerings.flatMap((fund) => {
    const held = positions.filter((position) => position.offeringId === fund.id);
    if (!held.length) return [];
    return [{
      position: { id: held[0].id, amount: held.reduce((sum, p) => sum + p.amount, 0), status: held[0].status },
      fund,
    }];
  });
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
  return offerings.slice(0, 3).map((offering, index) => ({
    id: `preview-${offering.id}`,
    userId,
    offeringId: offering.id,
    amount: PREVIEW_AMOUNTS[index] ?? 100000,
    status: index === 2 ? "submitted" : "funded",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));
}

export function InvestorPortfolio({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, dataset, previewEnabled, backendConfigured } = usePortalAccess();
  const { assetClasses, strategies } = useTaxonomies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const c = pick(COPY, lang);

  const realMine = dataset.investments.filter((investment) => investment.userId === currentUser.id);
  // In dev-preview (no backend) with no real holdings, show seeded sample
  // positions so the funded experience is visible. Real data is never touched.
  const mine = previewEnabled && !backendConfigured && realMine.length === 0 && offerings.length > 0
    ? previewHoldings(offerings, currentUser.id)
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

  const positions = [
    ...heldFunds.map((f) => ({ ...f, review: false })),
    ...reviewFunds.map((f) => ({ ...f, review: true })),
  ];

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

      {/* Positions the investor already holds or has in review — same card as
          opportunities, but the footer shows status instead of an action. */}
      {positions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[#193143]">{c.positionsTitle}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {positions.map(({ position, fund, review }) =>
              renderFundCard(
                `${fund.id}-${review ? "review" : "held"}`,
                fund,
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-semibold",
                      review ? "border-[#eadcae] bg-[#f8f1dc] text-[#755718]" : "border-[#cfe5d8] bg-[#e6f2eb] text-[#2f6f4f]",
                    )}>
                      {review ? c.reviewBadge : c.fundedBadge}
                    </span>
                    <Link href={`${NORTH_BASE}/investments/${fund.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline">
                      {c.viewFund}<ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                  {!review && (
                    <p className="mt-2 text-sm font-semibold text-[#172d3d]">
                      {formatMoneyCompact(position.amount, lang)} <span className="font-normal text-[#7a8790]">{c.committed}</span>
                    </p>
                  )}
                </div>,
              ),
            )}
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
      {opportunities.length === 0 && positions.length === 0 && (
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
