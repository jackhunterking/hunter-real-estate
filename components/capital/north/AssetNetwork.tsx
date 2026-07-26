"use client";

/**
 * Asset network — an admin-only relationship view of an investor's holdings.
 *
 * Scoped deliberately narrow. Two constraints shape everything here:
 *
 * 1. The platform has no record of money an investor received. No distribution
 *    payments, no NAV series, no realised gain. So nothing draws a dollar
 *    arriving, and no figure is anything but a commitment or a published fact.
 *
 * 2. Nothing may assume Lankin and Epiphany. A future offering can carry no
 *    properties at all (a debt or blind-pool vehicle) and no unit price —
 *    `properties` can be empty and `shareClasses.unitPrice` is only
 *    `recommended` in OFFERING_FIELD_CATALOGUE. Every element below therefore
 *    declares the field it needs and renders nothing when that field is absent,
 *    rather than substituting a zero.
 *
 * What is deliberately NOT here, and why:
 *
 *   Look-through exposure in dollars — allocating a vehicle's committed amount
 *   across its buildings requires a per-asset value or NOI. Neither manager
 *   publishes one and neither field exists in the catalogue, so any split would
 *   be an even-division assumption dressed as a measurement. The same rollups
 *   in BUILDING COUNTS are exact, need no new data, and are what this renders.
 *
 *   Return charts — Lankin publishes cumulative year-to-date figures, so
 *   plotting 4.1 / 7.2 / 10.2 / 14.9 as a line asserts a rising trend that does
 *   not exist; it is one year counted further in. Until the basis is a
 *   structured field a renderer can read, published returns appear as discrete
 *   period figures with the manager's own basis note beside them, never a line.
 */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { OfferingBundle } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import type { AdminUserRow } from "@/lib/capital/admin-server";
import {
  buildVehicles,
  fundedInvestorOptions,
  type Building,
  type Focus,
  type Vehicle,
} from "./asset-graph";
export type { Building, Focus, Vehicle } from "./asset-graph";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import type { Lang } from "@/lib/capital/types";
import { PageHeader } from "./PortalUI";
import { NetworkGraph, type GraphNode } from "./AssetNetworkGraph";
import { AssetNetworkMobile, type MobileCopy } from "./AssetNetworkMobile";
import { TERMINAL_THEMES, themeVars, type TerminalMode } from "./asset-network-theme";

const COPY = {
  en: {
    title: "Asset network",
    description:
      "Committed capital, the vehicles it sits in, and the assets behind them. Figures below the vehicle are counts — the platform holds no per-asset value, so no dollar amount is split across buildings.",
    viewing: "Viewing",
    myAccount: "My account",
    noPositions:
      "This account holds no funded positions. Showing every published investment instead — nothing here is owned.",
    empty: "No published investments to draw.",
    // rail
    entity: "Entity",
    committed: "Committed",
    positions: "Positions",
    vehicles: "Vehicles",
    assets: "Assets",
    markets: "Markets",
    byVehicle: "By vehicle",
    ofTotal: "% of total",
    dataQuality: "Data quality",
    complete: "Complete",
    figuresAsOf: "As of",
    reviewOverdue: (d: number) => `Review overdue ${d}d`,
    reviewDue: (d: number) => `Review due ${d}d`,
    reviewCurrent: "Current",
    noSchedule: "No review schedule",
    // table
    tablePositions: "Positions",
    tableAssets: "Assets",
    colVehicle: "Vehicle",
    colCommitted: "Committed",
    colShare: "Share",
    colUnits: "Units",
    colAsset: "Asset",
    colMarket: "Market",
    colType: "Type",
    colCondition: "Condition",
    clearFilter: "Clear filter",
    notPublished: "Not published",
    // rollups
    rollups: "Rollups",
    rollupNote: "Building counts — not capital",
    byMarket: "By market",
    byProvince: "By province",
    byClass: "By asset class",
    byCondition: "By condition",
    buildings: "buildings",
    building: "building",
    // terms
    terms: "Published terms",
    unitPrice: "Unit price",
    targetReturn: "Target return",
    targetDistribution: "Target distribution",
    minimum: "Minimum",
    aum: "AUM",
    totalUnits: "Total units",
    yourUnits: "Your units",
    publishedReturns: "Published returns",
    returnsBasis: "Basis",
    noProperties: "This vehicle publishes no asset list, so it has no building layer.",
    // status
    statusTargets: "Target figures are published targets, not guarantees",
    statusNoIncome: "Not income received · not current value",
    statusCounts: "Counts are exact · no capital is allocated below the vehicle",
    lightMode: "Light",
    darkMode: "Dark",
    themeToggle: "Switch display mode",
    residential: "Residential",
    commercial: "Commercial",
    conditions: {
      stabilized: "Stabilised",
      commercial: "Commercial",
      "new-construction": "New construction",
      "value-add": "Value-add",
    },
  },
  tr: {
    title: "Varlık ağı",
    description:
      "Taahhüt edilen sermaye, bulunduğu araçlar ve arkasındaki varlıklar. Araç altındaki rakamlar adettir — platformda varlık bazlı değer bulunmadığından hiçbir tutar binalara bölünmez.",
    viewing: "Görüntülenen",
    myAccount: "Hesabım",
    noPositions:
      "Bu hesapta fonlanmış pozisyon yok. Bunun yerine yayımlanmış tüm yatırımlar gösteriliyor — buradaki hiçbir varlık sahip olunan değildir.",
    empty: "Çizilecek yayımlanmış yatırım yok.",
    entity: "Hesap",
    committed: "Taahhüt",
    positions: "Pozisyonlar",
    vehicles: "Araçlar",
    assets: "Varlıklar",
    markets: "Pazarlar",
    byVehicle: "Araca göre",
    ofTotal: "% toplam",
    dataQuality: "Veri kalitesi",
    complete: "Tamamlanma",
    figuresAsOf: "Veri tarihi",
    reviewOverdue: (d: number) => `İnceleme ${d}g gecikti`,
    reviewDue: (d: number) => `İncelemeye ${d}g`,
    reviewCurrent: "Güncel",
    noSchedule: "İnceleme takvimi yok",
    tablePositions: "Pozisyonlar",
    tableAssets: "Varlıklar",
    colVehicle: "Araç",
    colCommitted: "Taahhüt",
    colShare: "Pay",
    colUnits: "Birim",
    colAsset: "Varlık",
    colMarket: "Pazar",
    colType: "Tür",
    colCondition: "Durum",
    clearFilter: "Filtreyi temizle",
    notPublished: "Yayımlanmadı",
    rollups: "Dağılımlar",
    rollupNote: "Bina adedi — sermaye değil",
    byMarket: "Pazara göre",
    byProvince: "İle göre",
    byClass: "Varlık sınıfına göre",
    byCondition: "Duruma göre",
    buildings: "bina",
    building: "bina",
    terms: "Yayımlanan koşullar",
    unitPrice: "Birim fiyatı",
    targetReturn: "Hedef getiri",
    targetDistribution: "Hedef dağıtım",
    minimum: "Asgari",
    aum: "Yönetilen varlık",
    totalUnits: "Toplam birim",
    yourUnits: "Birimleriniz",
    publishedReturns: "Yayımlanan getiriler",
    returnsBasis: "Esas",
    noProperties: "Bu araç varlık listesi yayımlamıyor, bu nedenle bina katmanı yok.",
    statusTargets: "Hedef rakamlar yayımlanan hedeflerdir, garanti değildir",
    statusNoIncome: "Elde edilen gelir değil · güncel değer değil",
    statusCounts: "Adetler kesindir · araç altına sermaye dağıtılmaz",
    lightMode: "Açık",
    darkMode: "Koyu",
    themeToggle: "Görünüm modunu değiştir",
    residential: "Konut",
    commercial: "Ticari",
    conditions: {
      stabilized: "İstikrarlı",
      commercial: "Ticari",
      "new-construction": "Yeni inşaat",
      "value-add": "Değer artırıcı",
    },
  },
} as const;

type Freshness = { state: "current" | "due-soon" | "overdue"; label: string };

function freshnessOf(v: Vehicle, c: (typeof COPY)["en"]): Freshness | null {
  if (!v.dataAsOf || !v.cadenceMonths) return null;
  const due = new Date(`${v.dataAsOf}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return null;
  due.setUTCMonth(due.getUTCMonth() + v.cadenceMonths);
  const days = Math.round((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return { state: "overdue", label: c.reviewOverdue(Math.abs(days)) };
  if (days < 30) return { state: "due-soon", label: c.reviewDue(days) };
  return { state: "current", label: c.reviewCurrent };
}

function money(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function num(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA").format(value);
}

/** useLayoutEffect on the client, useEffect on the server — avoids the SSR warning. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function AssetNetwork({
  offerings,
  investments,
  users = [],
  currentUserId,
  currentUserName,
}: {
  offerings: OfferingBundle[];
  investments: InvestmentApplication[];
  users?: AdminUserRow[];
  currentUserId: string;
  currentUserName?: string;
}) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const [targetUserId, setTargetUserId] = useState(currentUserId);
  const [focus, setFocus] = useState<Focus>(null);
  const [mode, setMode] = useState<TerminalMode>("dark");

  // Remember the choice per browser; the console itself has no theme to inherit.
  // Layout effect, not effect: this runs before paint, so a stored "light"
  // preference does not flash the dark default first. Falls back to useEffect
  // on the server, where neither runs and the dark default is what renders.
  useIsomorphicLayoutEffect(() => {
    try {
      const saved = window.localStorage.getItem("hnc-network-mode");
      if (saved === "light" || saved === "dark") setMode(saved);
    } catch {
      // Storage unavailable — the dark default stands for this visit.
    }
  }, []);

  function toggleMode() {
    const next: TerminalMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    try {
      window.localStorage.setItem("hnc-network-mode", next);
    } catch {
      // Setting still applies for this visit.
    }
  }

  const theme = TERMINAL_THEMES[mode];

  // The swipe needs shorter labels than the desktop rail: a phone header has no
  // room for "Buildings behind them" spelled out twice.
  const mobileCopy: MobileCopy = useMemo(() => ({
    you: lang === "tr" ? "Siz" : "You",
    vehicles: c.vehicles,
    markets: c.markets,
    buildings: c.assets,
    committed: c.committed,
    unitsHeld: c.yourUnits,
    positions: c.positions,
    assetsBehind: c.assets,
    marketCount: c.markets,
    splitOfCapital: c.byVehicle,
    costBasisNote: c.statusNoIncome,
    units: c.colUnits,
    shareOfCapital: c.colShare,
    buildingsLabel: c.assets,
    targetReturn: c.targetReturn,
    targetDistribution: c.targetDistribution,
    dataUpdates: lang === "tr" ? "Veri güncellemesi" : "Data updates",
    aum: c.aum,
    completeness: c.complete,
    targetsNote: c.statusTargets,
    byMarket: c.byMarket,
    byProvince: c.byProvince,
    countsNote: c.statusCounts,
    all: lang === "tr" ? "Tümü" : "All",
    showing: (n, total) =>
      lang === "tr" ? `${total} kayıttan ${n} gösteriliyor` : `Showing ${n} of ${total}`,
    clear: lang === "tr" ? "Temizle" : "Clear",
    none: lang === "tr" ? "Eşleşen bina yok." : "No buildings match.",
    scrollAll: (n) => (lang === "tr" ? `↕ ${n} kaydın tümü için kaydırın` : `↕ scroll for all ${n}`),
    scrolls: lang === "tr" ? "kaydırılır" : "scrolls",
    everyMonths: (n) =>
      lang === "tr" ? `${n} ayda bir` : n === 3 ? "Quarterly" : n === 6 ? "Semi-annual" : n === 12 ? "Annual" : `Every ${n} mo`,
    notPublished: c.notPublished,
    unitsSuffix: lang === "tr" ? "daire" : "units",
    verifyNote:
      lang === "tr"
        ? "İçi boş nokta doğrulamanın kısmi olduğunu gösterir. Tire, adedin yayımlanmadığı anlamına gelir — sıfır değil."
        : "A hollow dot means verification is still partial. A dash means the count is not published, never zero.",
    residential: c.residential,
    commercial: c.commercial,
  }), [c, lang]);

  const investorOptions = useMemo(
    () => fundedInvestorOptions(users, investments, currentUserId),
    [users, investments, currentUserId],
  );

  const palette = theme.vehicles;
  const { vehicles, usingHeld } = useMemo(
    () => buildVehicles({ offerings, investments, targetUserId, lang, palette }),
    [offerings, investments, targetUserId, lang, palette],
  );

  const buildings = useMemo(() => vehicles.flatMap((v) => v.buildings), [vehicles]);
  const totalCommitted = vehicles.reduce((sum, v) => sum + v.committed, 0);
  const markets = useMemo(
    () => Array.from(new Set(buildings.map((b) => b.city))),
    [buildings],
  );

  const filtered = useMemo(() => {
    if (!focus) return buildings;
    if (focus.type === "vehicle") return buildings.filter((b) => b.vehicleId === focus.key);
    return buildings.filter((b) => b.city === focus.key);
  }, [buildings, focus]);

  function rollup(keyOf: (b: Building) => string, labelOf: (b: Building) => string) {
    const map = new Map<string, { label: string; count: number }>();
    filtered.forEach((b) => {
      const key = keyOf(b);
      const row = map.get(key) ?? { label: labelOf(b), count: 0 };
      row.count += 1;
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  if (!vehicles.length) {
    return (
      <section>
        <PageHeader title={c.title} />
        <p className="text-sm text-[#657681]">{c.empty}</p>
      </section>
    );
  }

  return (
    <section>
      <PageHeader title={c.title} />
      <p className="-mt-3 mb-5 max-w-3xl text-sm leading-6 text-[#657681]">{c.description}</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f6e78]">
          {c.viewing}
          <select
            value={targetUserId}
            onChange={(event) => {
              setTargetUserId(event.target.value);
              setFocus(null);
            }}
            className="h-9 rounded-md border border-[#d5dde2] bg-white px-2 text-sm font-normal normal-case tracking-normal text-[#1c3546]"
          >
            <option value={currentUserId}>{currentUserName || c.myAccount}</option>
            {investorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {focus && (
          <button
            type="button"
            onClick={() => setFocus(null)}
            className="rounded-md border border-[#d5dde2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f6e78] hover:bg-[#f2f5f7]"
          >
            {c.clearFilter}
          </button>
        )}
      </div>

      {!usingHeld && (
        <p className="mb-4 rounded-md border border-[#eadcae] bg-[#fdf8ec] px-4 py-3 text-sm text-[#755718]">
          {c.noPositions}
        </p>
      )}

      <div
        style={themeVars(theme)}
        className="overflow-hidden border-[color:var(--t-rule)] bg-[color:var(--t-ground)] font-mono text-[13px] tabular-nums text-[color:var(--t-ink)] max-sm:-mx-4 max-sm:border-y sm:rounded-md sm:border sm:text-[12px]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--t-rule)] bg-[color:var(--t-head)] px-4 py-2.5">
          <span className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--t-ink-3)] sm:text-[9.5px]">
            {c.title}
          </span>
          <button
            type="button"
            onClick={toggleMode}
            title={c.themeToggle}
            className="border border-[color:var(--t-rule)] px-3 py-1.5 text-[11px] uppercase tracking-[0.09em] text-[color:var(--t-ink-2)] hover:text-[color:var(--t-ink)] sm:py-1 sm:text-[10px]"
          >
            {mode === "dark" ? c.lightMode : c.darkMode}
          </button>
        </div>
        {/* Below `lg` the three columns collapse into one very long scroll, which
            is what the swipe replaces. Both are mounted; the hidden one has zero
            width so its canvas never paints. */}
        <div className="lg:hidden">
          <AssetNetworkMobile
            vehicles={vehicles}
            buildings={buildings}
            theme={theme}
            lang={lang}
            c={mobileCopy}
            totalCommitted={totalCommitted}
            totalUnits={vehicles.reduce((sum, v) => sum + (v.units ?? 0), 0)}
          />
        </div>

        <div className="hidden lg:grid lg:min-h-[560px] lg:grid-cols-[240px_minmax(0,1fr)_322px]">
          {/* ---------------- entity rail ---------------- */}
          <div className="border-b border-[color:var(--t-rule)] lg:border-b-0 lg:border-r">
            <RailHead left={c.entity} />
            <Stat label={c.committed} value={money(totalCommitted, lang)} hero />
            <Stat label={c.positions} value={String(vehicles.filter((v) => v.held).length)} />
            <Stat label={c.vehicles} value={String(vehicles.length)} />
            {/* Building layer only exists when an offering publishes properties. */}
            {buildings.length > 0 && <Stat label={c.assets} value={String(buildings.length)} />}
            {markets.length > 0 && <Stat label={c.markets} value={String(markets.length)} />}

            <RailHead left={c.byVehicle} right={c.ofTotal} bordered />
            <div className="px-3 py-3">
              {vehicles.map((v) => {
                const share = totalCommitted > 0 ? (v.committed / totalCommitted) * 100 : 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setFocus(focus?.type === "vehicle" && focus.key === v.id ? null : { type: "vehicle", key: v.id })
                    }
                    className="mb-3 block w-full py-1 text-left last:mb-0"
                  >
                    <span className="mb-1.5 flex justify-between gap-2 text-[12px] text-[color:var(--t-ink-2)] sm:text-[10.5px]">
                      <b className="font-normal text-[color:var(--t-ink)]">{v.short}</b>
                      <span>
                        {v.held ? `${money(v.committed, lang)} · ${share.toFixed(1)}%` : "—"}
                      </span>
                    </span>
                    <span className="block h-2 w-full bg-[color:var(--t-track)] sm:h-1.5">
                      <span
                        className="block h-full"
                        style={{ width: `${Math.max(share, v.held ? 1 : 0)}%`, background: v.color }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <RailHead left={c.dataQuality} bordered />
            <div className="px-3 py-3">
              {vehicles.map((v) => {
                const fresh = freshnessOf(v, c);
                return (
                  <div key={v.id} className="mb-3 last:mb-0">
                    <div className="mb-1 flex justify-between gap-2 text-[12px] sm:text-[10.5px]">
                      <span className="text-[color:var(--t-ink)]">{v.short}</span>
                      <span className="text-[color:var(--t-ink-2)]">
                        {v.completeness}% {c.complete.toLowerCase()}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-[color:var(--t-ink-3)] sm:text-[10px]">
                      {v.periodLabel ? `${c.figuresAsOf} ${v.periodLabel}` : c.notPublished}
                      {fresh && (
                        <span className={fresh.state === "current" ? "text-[color:var(--t-ok)]" : "text-[color:var(--t-warn)]"}>
                          {" · "}
                          {fresh.label}
                        </span>
                      )}
                      {!fresh && ` · ${c.noSchedule}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- graph ---------------- */}
          <div className="flex min-w-0 flex-col border-b border-[color:var(--t-rule)] lg:border-b-0 lg:border-r">
            <RailHead
              left={c.title.toUpperCase()}
              right={buildings.length > 0 ? c.statusCounts : undefined}
            />
            <NetworkGraph
              vehicles={vehicles}
              buildings={buildings}
              focus={focus}
              onFocus={setFocus}
              subject={currentUserName || c.myAccount}
              lang={lang}
              theme={theme}
            />
          </div>

          {/* ---------------- table + rollups ---------------- */}
          <div className="min-w-0">
            <RailHead
              left={focus ? c.tableAssets : c.tablePositions}
              right={focus ? `${filtered.length}/${buildings.length}` : undefined}
            />

            {!focus ? (
              <table className="w-full text-[13px] sm:text-[11px]">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)] sm:text-[9.5px]">
                    <th className="border-b border-[color:var(--t-rule)] px-3 py-2.5 text-left font-normal sm:py-2">{c.colVehicle}</th>
                    <th className="border-b border-[color:var(--t-rule)] px-3 py-2.5 text-right font-normal sm:py-2">{c.colCommitted}</th>
                    <th className="border-b border-[color:var(--t-rule)] px-3 py-2.5 text-right font-normal sm:py-2">{c.colShare}</th>
                    <th className="border-b border-[color:var(--t-rule)] px-3 py-2.5 text-right font-normal sm:py-2">{c.colUnits}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-[color:var(--t-hover)]">
                      <td className="border-b border-[color:var(--t-rule-soft)] px-3 py-2.5 sm:py-2">
                        <span
                          aria-hidden
                          className="mr-2 inline-block size-1.5"
                          style={{ background: v.color }}
                        />
                        {v.short}
                      </td>
                      <td className="border-b border-[color:var(--t-rule-soft)] px-3 py-2.5 text-right text-[color:var(--t-ink)] sm:py-2">
                        {v.held ? money(v.committed, lang) : "—"}
                      </td>
                      <td className="border-b border-[color:var(--t-rule-soft)] px-3 py-2.5 text-right text-[color:var(--t-ink)] sm:py-2">
                        {v.held && totalCommitted > 0
                          ? `${((v.committed / totalCommitted) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                      {/* No unit price published means no unit count. Never a zero. */}
                      <td className="border-b border-[color:var(--t-rule-soft)] px-3 py-2.5 text-right text-[color:var(--t-ink)] sm:py-2">
                        {v.units != null ? num(v.units, lang) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="max-h-[340px] overflow-y-auto sm:max-h-[300px]">
                <table className="w-full text-[13px] sm:text-[11px]">
                  <thead>
                    <tr className="text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)] sm:text-[9.5px]">
                      <th className="sticky top-0 border-b border-[color:var(--t-rule)] bg-[color:var(--t-panel)] px-3 py-2.5 text-left font-normal sm:py-2">
                        {c.colAsset}
                      </th>
                      <th className="sticky top-0 border-b border-[color:var(--t-rule)] bg-[color:var(--t-panel)] px-3 py-2.5 text-left font-normal sm:py-2">
                        {c.colMarket}
                      </th>
                      <th className="sticky top-0 border-b border-[color:var(--t-rule)] bg-[color:var(--t-panel)] px-3 py-2.5 text-right font-normal sm:py-2">
                        {c.colUnits}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="hover:bg-[color:var(--t-hover)]">
                        <td className="max-w-0 truncate border-b border-[color:var(--t-rule-soft)] px-3 py-2.5 sm:py-2">{b.name}</td>
                        <td className="border-b border-[color:var(--t-rule-soft)] px-3 py-2.5 text-[color:var(--t-ink-2)] sm:py-2">{b.city}</td>
                        <td className="whitespace-nowrap border-b border-[color:var(--t-rule-soft)] px-3 py-2.5 text-right text-[color:var(--t-ink)] sm:py-2">
                          {b.units != null ? num(b.units, lang) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rollups are counts. Exact, and available with no data we lack. */}
            {buildings.length > 0 && (
              <>
                <RailHead left={c.rollups} right={c.rollupNote} bordered />
                {/* Market and province only. Asset class and condition were cut:
                    they are the two an investor rarely acts on, and every row
                    here competes with the ones that answer where the money is
                    concentrated. */}
                <div className="grid grid-cols-2 gap-x-4 px-3 py-3 sm:grid-cols-1">
                  <Rollup
                    title={c.byMarket}
                    rows={rollup((b) => b.city, (b) => `${b.city}, ${b.province}`)}
                    c={c}
                  />
                  <Rollup title={c.byProvince} rows={rollup((b) => b.province, (b) => b.province)} c={c} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------------- published terms ---------------- */}
        {/* The swipe carries these on its Vehicles screen, so this block is the
            wide-screen presentation only and must not repeat underneath it. */}
        <div className="hidden border-t border-[color:var(--t-rule)] lg:block">
          <RailHead left={c.terms} />
          <div className="grid grid-cols-1 gap-px bg-[color:var(--t-rule)] md:grid-cols-2">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-[color:var(--t-ground)] px-4 py-3.5 sm:py-3">
                <div className="mb-2 flex items-center gap-2">
                  <span aria-hidden className="inline-block size-2" style={{ background: v.color }} />
                  <span className="text-[13.5px] text-[color:var(--t-ink)] sm:text-[12px]">{v.name}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:gap-y-1.5 sm:text-[10.5px]">
                  <Term label={c.unitPrice} value={v.unitPrice ? `$${v.unitPrice.toFixed(2)}` : null} c={c} />
                  <Term label={c.aum} value={v.aum ?? null} c={c} />
                  <Term label={c.totalUnits} value={v.unitsTotal != null ? num(v.unitsTotal, lang) : null} c={c} />
                  <Term label={c.yourUnits} value={v.units != null ? num(v.units, lang) : null} c={c} />
                  <Term label={c.minimum} value={v.minimum != null ? money(v.minimum, lang) : null} c={c} />
                  <Term
                    label={c.assets}
                    value={v.buildings.length ? `${v.buildings.length} ${c.buildings}` : null}
                    c={c}
                  />
                </dl>
                {(v.targetReturn || v.targetDistribution) && (
                  <div className="mt-2.5 border-t border-[color:var(--t-rule-soft)] pt-2.5 text-[12px] text-[color:var(--t-ink-2)] sm:text-[10.5px]">
                    {v.targetReturn && (
                      <div>
                        <span className="text-[color:var(--t-ink-3)]">{c.targetReturn}: </span>
                        {v.targetReturn}
                      </div>
                    )}
                    {v.targetDistribution && (
                      <div>
                        <span className="text-[color:var(--t-ink-3)]">{c.targetDistribution}: </span>
                        {v.targetDistribution}
                      </div>
                    )}
                  </div>
                )}
                {/* Discrete period figures, never a plotted series — the basis
                    differs by manager and is prose a chart cannot read. */}
                {v.returns.length > 0 && (
                  <div className="mt-2.5 border-t border-[color:var(--t-rule-soft)] pt-2.5">
                    <div className="mb-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)] sm:text-[9.5px]">
                      {c.publishedReturns}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] sm:text-[10.5px]">
                      {v.returns.map((r) => (
                        <span key={r.period} className="text-[color:var(--t-ink-2)]">
                          {r.period} <b className="font-normal text-[color:var(--t-ink)]">{r.value}</b>
                        </span>
                      ))}
                    </div>
                    {v.returnsBasis && (
                      <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--t-ink-3)] sm:text-[10px]">
                        {c.returnsBasis}: {v.returnsBasis}
                      </p>
                    )}
                  </div>
                )}
                {v.buildings.length === 0 && (
                  <p className="mt-2.5 border-t border-[color:var(--t-rule-soft)] pt-2.5 text-[11.5px] text-[color:var(--t-ink-3)] sm:text-[10px]">
                    {c.noProperties}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- status strip ---------------- */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-[color:var(--t-rule)] bg-[color:var(--t-head)] px-4 py-2.5 text-[11px] uppercase tracking-[0.04em] text-[color:var(--t-ink-3)] sm:py-2 sm:text-[10px]">
          <span>{c.statusTargets}</span>
          <span>{c.statusCounts}</span>
          <span>{c.statusNoIncome}</span>
        </div>
      </div>
    </section>
  );
}

function RailHead({ left, right, bordered }: { left: string; right?: string; bordered?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-2 bg-[color:var(--t-panel)] px-3 py-2.5 text-[10.5px] uppercase tracking-[0.12em] text-[color:var(--t-ink-3)] sm:py-2 sm:text-[9.5px] ${
        bordered ? "border-t border-[color:var(--t-rule)]" : ""
      } border-b border-[color:var(--t-rule)]`}
    >
      <span>{left}</span>
      {right && <span className="text-right text-[color:var(--t-accent)]">{right}</span>}
    </div>
  );
}

function Stat({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[color:var(--t-rule-soft)] px-3 py-2 sm:py-1.5">
      <span className="text-[12px] text-[color:var(--t-ink-3)] sm:text-[10.5px]">{label}</span>
      <span
        className={
          hero
            ? "text-[17px] text-[color:var(--t-accent)] sm:text-[15px]"
            : "text-[14px] text-[color:var(--t-ink)] sm:text-[12.5px]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Term({ label, value, c }: { label: string; value: string | null; c: (typeof COPY)["en"] }) {
  return (
    <>
      <dt className="text-[color:var(--t-ink-3)]">{label}</dt>
      <dd className={value ? "text-[color:var(--t-ink)]" : "text-[color:var(--t-ink-faint)]"}>
        {value ?? c.notPublished}
      </dd>
    </>
  );
}

function Rollup({
  title,
  rows,
  c,
}: {
  title: string;
  rows: { label: string; count: number }[];
  c: (typeof COPY)["en"];
}) {
  if (!rows.length) return null;
  const max = rows[0].count;
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)] sm:text-[9.5px]">
        {title}
      </div>
      {rows.slice(0, 6).map((r) => (
        <div key={r.label} className="mb-1 last:mb-0">
          <div className="flex justify-between gap-2 text-[12px] sm:text-[10.5px]">
            <span className="truncate text-[color:var(--t-ink)]">{r.label}</span>
            <span className="shrink-0 text-[color:var(--t-ink-2)]">
              {r.count} {r.count === 1 ? c.building : c.buildings}
            </span>
          </div>
          <div className="h-[4px] w-full bg-[color:var(--t-track)] sm:h-[3px]">
            <div
              className="h-full bg-[color:var(--t-bar)]"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export type { GraphNode };
