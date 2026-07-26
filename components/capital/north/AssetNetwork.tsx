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

import { useMemo, useState } from "react";
import type { OfferingBundle } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import type { AdminUserRow } from "@/lib/capital/admin-server";
import { primaryShareClass } from "@/lib/capital/present";
import { unitPriceOf, impliedShares } from "@/lib/capital/shares";
import { scoreOfferingCompleteness } from "@/lib/capital/field-catalogue";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import type { Lang } from "@/lib/capital/types";
import { PageHeader } from "./PortalUI";
import { NetworkGraph, type GraphNode } from "./AssetNetworkGraph";

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

/**
 * Vehicle identity hues, validated against the #07090c canvas ground for the
 * lightness band, chroma floor, adjacent-pair CVD separation and contrast.
 * Gold is excluded and reserved for the investor node, so a vehicle can never
 * be mistaken for the subject.
 */
const VEHICLE_COLORS = ["#6d86d6", "#22a892", "#9a7bd1", "#b8724f"];

const CADENCE_MONTHS: Record<string, number> = {
  quarterly: 3,
  "semi-annual": 6,
  annual: 12,
  "ad-hoc": 12,
};

export type Vehicle = {
  id: string;
  short: string;
  name: string;
  color: string;
  held: boolean;
  committed: number;
  /** Undefined when no unit price is published — never zero. */
  units?: number;
  unitPrice?: number;
  aum?: string;
  unitsTotal?: number;
  targetReturn?: string;
  targetDistribution?: string;
  minimum?: number;
  periodLabel?: string;
  dataAsOf?: string;
  cadenceMonths?: number;
  /** Discrete published figures. Never plotted as a series — see the header. */
  returns: { period: string; value: string }[];
  returnsBasis?: string;
  completeness: number;
  buildings: Building[];
};

export type Building = {
  id: string;
  name: string;
  city: string;
  province: string;
  assetClassId: string;
  condition: string;
  verification: string;
  units?: number;
  vehicleId: string;
};

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

function isCommercial(assetClassId: string) {
  return assetClassId.toLowerCase().includes("commercial");
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

export type Focus = { type: "vehicle" | "market"; key: string } | null;

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

  const investorOptions = useMemo(() => {
    const funded = new Set(investments.filter((i) => i.status === "funded").map((i) => i.userId));
    return users
      .filter((u) => funded.has(u.userId) && u.userId !== currentUserId)
      .map((u) => ({ id: u.userId, label: u.displayName || u.email }));
  }, [users, investments, currentUserId]);

  const { vehicles, usingHeld } = useMemo(() => {
    const mine = investments.filter((i) => i.userId === targetUserId && i.status === "funded");

    type Held = { offering: OfferingBundle; committed: number; units?: number };
    const held: Held[] = offerings
      .map((offering): Held | null => {
        const rows = mine.filter((i) => i.offeringId === offering.id);
        if (!rows.length) return null;
        const price = unitPriceOf(offering);
        const committed = rows.reduce((sum, r) => sum + r.amount, 0);
        // Units only exist when a price is published (`unitPrice` is merely
        // `recommended` in the catalogue) or the subscription recorded them.
        const recorded = rows.reduce((sum, r) => sum + (r.shareQuantity ?? 0), 0);
        const implied = price ? impliedShares(committed, price) : null;
        const units = recorded > 0 ? recorded : implied != null ? Math.round(implied) : undefined;
        return { offering, committed, units };
      })
      .filter((x): x is Held => x != null);

    const source: Held[] = held.length
      ? held
      : offerings
          .filter((o) => o.status === "available")
          .map((offering) => ({ offering, committed: 0, units: undefined }));

    const list: Vehicle[] = source.map(({ offering, committed, units }, index) => {
      const shareClass = primaryShareClass(offering);
      return {
        id: offering.id,
        short: tx(offering.shortName, lang),
        name: tx(offering.name, lang),
        color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
        held: held.length > 0,
        committed,
        units,
        unitPrice: unitPriceOf(offering) ?? undefined,
        aum: offering.aum?.value,
        unitsTotal: offering.unitsTotal?.value,
        targetReturn: shareClass?.targetReturn?.value,
        targetDistribution: shareClass?.targetDistribution?.value,
        minimum: shareClass?.minimumInvestment?.value,
        periodLabel: offering.dataPeriodLabel,
        dataAsOf: offering.dataAsOf,
        cadenceMonths: offering.updateCadence ? CADENCE_MONTHS[offering.updateCadence] : undefined,
        returns: (offering.trailingReturns ?? []).map((r) => ({
          period: tx(r.period, lang),
          value: r.value,
        })),
        returnsBasis: offering.trailingReturnsNote ? tx(offering.trailingReturnsNote, lang) : undefined,
        completeness: scoreOfferingCompleteness(offering).percent,
        buildings: offering.properties.map((p) => ({
          id: `${offering.id}:${p.id}`,
          name: tx(p.name, lang),
          city: p.city,
          province: p.province,
          assetClassId: p.assetClassId,
          condition: p.status,
          verification: p.verificationStatus,
          units: p.unitCount,
          vehicleId: offering.id,
        })),
      };
    });

    return { vehicles: list, usingHeld: held.length > 0 };
  }, [offerings, investments, targetUserId, lang]);

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

      <div className="overflow-hidden rounded-md border border-[#dfe4e9] bg-[#07090c] font-mono text-[12px] tabular-nums text-[#d7dee6]">
        <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[236px_minmax(0,1fr)_320px]">
          {/* ---------------- entity rail ---------------- */}
          <div className="border-b border-[#1b242e] lg:border-b-0 lg:border-r">
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
                    className="mb-2.5 block w-full text-left last:mb-0"
                  >
                    <span className="mb-1 flex justify-between gap-2 text-[10.5px] text-[#8794a3]">
                      <b className="font-normal text-[#d7dee6]">{v.short}</b>
                      <span>
                        {v.held ? `${money(v.committed, lang)} · ${share.toFixed(1)}%` : "—"}
                      </span>
                    </span>
                    <span className="block h-1.5 w-full bg-[#131b23]">
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
                    <div className="mb-1 flex justify-between gap-2 text-[10.5px]">
                      <span className="text-[#d7dee6]">{v.short}</span>
                      <span className="text-[#8794a3]">
                        {v.completeness}% {c.complete.toLowerCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#5d6874]">
                      {v.periodLabel ? `${c.figuresAsOf} ${v.periodLabel}` : c.notPublished}
                      {fresh && (
                        <span className={fresh.state === "current" ? " text-[#4f9d78]" : " text-[#c9973f]"}>
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
          <div className="flex min-w-0 flex-col border-b border-[#1b242e] lg:border-b-0 lg:border-r">
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
            />
          </div>

          {/* ---------------- table + rollups ---------------- */}
          <div className="min-w-0">
            <RailHead
              left={focus ? c.tableAssets : c.tablePositions}
              right={focus ? `${filtered.length}/${buildings.length}` : undefined}
            />

            {!focus ? (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[9.5px] uppercase tracking-[0.1em] text-[#5d6874]">
                    <th className="border-b border-[#1b242e] px-3 py-2 text-left font-normal">{c.colVehicle}</th>
                    <th className="border-b border-[#1b242e] px-3 py-2 text-right font-normal">{c.colCommitted}</th>
                    <th className="border-b border-[#1b242e] px-3 py-2 text-right font-normal">{c.colShare}</th>
                    <th className="border-b border-[#1b242e] px-3 py-2 text-right font-normal">{c.colUnits}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-[#10171e]">
                      <td className="border-b border-[#141c24] px-3 py-2">
                        <span
                          aria-hidden
                          className="mr-2 inline-block size-1.5"
                          style={{ background: v.color }}
                        />
                        {v.short}
                      </td>
                      <td className="border-b border-[#141c24] px-3 py-2 text-right text-[#d7dee6]">
                        {v.held ? money(v.committed, lang) : "—"}
                      </td>
                      <td className="border-b border-[#141c24] px-3 py-2 text-right text-[#d7dee6]">
                        {v.held && totalCommitted > 0
                          ? `${((v.committed / totalCommitted) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                      {/* No unit price published means no unit count. Never a zero. */}
                      <td className="border-b border-[#141c24] px-3 py-2 text-right text-[#d7dee6]">
                        {v.units != null ? num(v.units, lang) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-[9.5px] uppercase tracking-[0.1em] text-[#5d6874]">
                      <th className="sticky top-0 border-b border-[#1b242e] bg-[#0c1014] px-3 py-2 text-left font-normal">
                        {c.colAsset}
                      </th>
                      <th className="sticky top-0 border-b border-[#1b242e] bg-[#0c1014] px-3 py-2 text-left font-normal">
                        {c.colMarket}
                      </th>
                      <th className="sticky top-0 border-b border-[#1b242e] bg-[#0c1014] px-3 py-2 text-right font-normal">
                        {c.colUnits}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="hover:bg-[#10171e]">
                        <td className="max-w-0 truncate border-b border-[#141c24] px-3 py-2">{b.name}</td>
                        <td className="border-b border-[#141c24] px-3 py-2 text-[#8794a3]">{b.city}</td>
                        <td className="whitespace-nowrap border-b border-[#141c24] px-3 py-2 text-right text-[#d7dee6]">
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
                <div className="px-3 py-3">
                  <Rollup title={c.byMarket} rows={rollup((b) => b.city, (b) => b.city)} c={c} />
                  <Rollup title={c.byProvince} rows={rollup((b) => b.province, (b) => b.province)} c={c} />
                  <Rollup
                    title={c.byClass}
                    rows={rollup(
                      (b) => (isCommercial(b.assetClassId) ? "commercial" : "residential"),
                      (b) => (isCommercial(b.assetClassId) ? c.commercial : c.residential),
                    )}
                    c={c}
                  />
                  <Rollup
                    title={c.byCondition}
                    rows={rollup(
                      (b) => b.condition,
                      (b) => c.conditions[b.condition as keyof typeof c.conditions] ?? b.condition,
                    )}
                    c={c}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------------- published terms ---------------- */}
        <div className="border-t border-[#1b242e]">
          <RailHead left={c.terms} />
          <div className="grid grid-cols-1 gap-px bg-[#1b242e] md:grid-cols-2">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-[#07090c] px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <span aria-hidden className="inline-block size-2" style={{ background: v.color }} />
                  <span className="text-[12px] text-[#d7dee6]">{v.name}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px]">
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
                  <div className="mt-2 border-t border-[#141c24] pt-2 text-[10.5px] text-[#8794a3]">
                    {v.targetReturn && (
                      <div>
                        <span className="text-[#5d6874]">{c.targetReturn}: </span>
                        {v.targetReturn}
                      </div>
                    )}
                    {v.targetDistribution && (
                      <div>
                        <span className="text-[#5d6874]">{c.targetDistribution}: </span>
                        {v.targetDistribution}
                      </div>
                    )}
                  </div>
                )}
                {/* Discrete period figures, never a plotted series — the basis
                    differs by manager and is prose a chart cannot read. */}
                {v.returns.length > 0 && (
                  <div className="mt-2 border-t border-[#141c24] pt-2">
                    <div className="mb-1 text-[9.5px] uppercase tracking-[0.1em] text-[#5d6874]">
                      {c.publishedReturns}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px]">
                      {v.returns.map((r) => (
                        <span key={r.period} className="text-[#8794a3]">
                          {r.period} <b className="font-normal text-[#d7dee6]">{r.value}</b>
                        </span>
                      ))}
                    </div>
                    {v.returnsBasis && (
                      <p className="mt-1.5 text-[10px] leading-relaxed text-[#5d6874]">
                        {c.returnsBasis}: {v.returnsBasis}
                      </p>
                    )}
                  </div>
                )}
                {v.buildings.length === 0 && (
                  <p className="mt-2 border-t border-[#141c24] pt-2 text-[10px] text-[#5d6874]">
                    {c.noProperties}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- status strip ---------------- */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[#1b242e] bg-[#10161c] px-4 py-2 text-[10px] uppercase tracking-[0.04em] text-[#5d6874]">
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
      className={`flex justify-between gap-2 bg-[#0c1014] px-3 py-2 text-[9.5px] uppercase tracking-[0.12em] text-[#5d6874] ${
        bordered ? "border-t border-[#1b242e]" : ""
      } border-b border-[#1b242e]`}
    >
      <span>{left}</span>
      {right && <span className="text-[#8a7434]">{right}</span>}
    </div>
  );
}

function Stat({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#141c24] px-3 py-1.5">
      <span className="text-[10.5px] text-[#5d6874]">{label}</span>
      <span className={hero ? "text-[15px] text-[#ebc76b]" : "text-[12.5px] text-[#d7dee6]"}>{value}</span>
    </div>
  );
}

function Term({ label, value, c }: { label: string; value: string | null; c: (typeof COPY)["en"] }) {
  return (
    <>
      <dt className="text-[#5d6874]">{label}</dt>
      <dd className={value ? "text-[#d7dee6]" : "text-[#3f4854]"}>{value ?? c.notPublished}</dd>
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
      <div className="mb-1.5 text-[9.5px] uppercase tracking-[0.1em] text-[#5d6874]">{title}</div>
      {rows.slice(0, 6).map((r) => (
        <div key={r.label} className="mb-1 last:mb-0">
          <div className="flex justify-between gap-2 text-[10.5px]">
            <span className="truncate text-[#d7dee6]">{r.label}</span>
            <span className="shrink-0 text-[#8794a3]">
              {r.count} {r.count === 1 ? c.building : c.buildings}
            </span>
          </div>
          <div className="h-[3px] w-full bg-[#131b23]">
            <div className="h-full bg-[#3d5a7a]" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export type { GraphNode };
