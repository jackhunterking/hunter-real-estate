"use client";

/**
 * Asset views — three investor-facing readings of the same holdings.
 *
 * The relationship terminal puts the whole portfolio on one screen, which
 * serves an analyst and loses everybody else, most of all on a phone. These
 * three carry the identical rule about which figures may appear — money above
 * the vehicle line, counts below it — and drop the density.
 *
 *   Cloud — one dot per building, blobs per group, ordered west to east.
 *   Orbit — wedge width is share of buildings, band thickness is share of
 *           capital, so "most of the money, fewest of the buildings" is visible
 *           without arithmetic.
 *   Lens  — the same dots re-sorted by any field the catalogue holds for every
 *           building. The count is the dots themselves, so it cannot be a claim.
 *
 * Scales without edits: the lens offers a grouping only when every building
 * carries that field, so a future offering with a new complete field gains a
 * chip and nothing else changes. An offering that publishes no properties has
 * no building layer and is reported as such rather than drawn as zero.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { OfferingBundle, Lang } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import type { AdminUserRow } from "@/lib/capital/admin-server";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { buildVehicles, fundedInvestorOptions } from "./asset-graph";
import { ClusterCanvas, type ClusterView, type Dot, type Grouping } from "./ClusterCanvas";
import { TERMINAL_THEMES, themeVars, type TerminalMode } from "./asset-network-theme";
import { PageHeader } from "./PortalUI";

const COPY = {
  en: {
    title: "Asset views",
    description:
      "The same holdings drawn three ways. Money appears only at the vehicle — the platform holds no per-asset value, so nothing below a fund carries a dollar figure. One dot is one building.",
    viewing: "Viewing",
    myAccount: "My account",
    noPositions:
      "This account holds no funded positions. Showing every published investment instead — nothing here is owned.",
    empty: "No published investments to draw.",
    noBuildings:
      "None of these investments publishes an asset list, so there is no building layer to draw. The figures above are still exact.",
    views: { cloud: "Cloud", orbit: "Orbit", lens: "Lens" },
    blurbs: {
      cloud: "One dot per building, grouped into clusters and ordered west to east. Each chip counts the dots beneath it.",
      orbit: "Wedge width is share of buildings; band thickness is share of capital. The pulse is published distribution cadence, not an amount.",
      lens: "The same buildings re-sorted. The count is the dots themselves, and it never changes.",
    },
    groupBy: "Group by",
    committed: "Committed",
    units: "Units",
    buildings: "Buildings",
    markets: "Markets",
    hintCloud: "Hover or tap a cluster.",
    hintDot: "Hover or tap a dot.",
    suites: (n: number) => `${n} suites`,
    noSuites: "Suite count not published",
    heldThrough: "Held through",
    ofTotal: "of committed",
    cadence: "distributions",
    noDollar: "This building carries no separate dollar figure — the vehicle is the lowest level where one exists.",
    legendPartial: "verification partial",
    legendRule: "wedge width = buildings · band thickness = capital · pulse = cadence",
    legendSame: (n: number) => `${n} dots, always the same ${n}`,
    lightMode: "Light",
    darkMode: "Dark",
    themeToggle: "Switch display mode",
    groups: {
      vehicle: "Fund",
      province: "Province",
      market: "Market",
      assetClass: "Asset class",
      condition: "Condition",
      verification: "Data quality",
    },
    conditions: {
      stabilized: "Stabilised",
      commercial: "Commercial in-place",
      "new-construction": "New construction",
      "value-add": "Value-add",
    },
    verified: "Verified",
    partial: "Partial",
    pending: "Pending",
    residential: "Residential",
    commercialClass: "Commercial",
  },
  tr: {
    title: "Varlık görünümleri",
    description:
      "Aynı pozisyonlar üç ayrı biçimde. Tutarlar yalnızca araç düzeyinde görünür — platformda varlık bazlı değer bulunmadığından fon altındaki hiçbir öğe tutar taşımaz. Bir nokta bir binadır.",
    viewing: "Görüntülenen",
    myAccount: "Hesabım",
    noPositions:
      "Bu hesapta fonlanmış pozisyon yok. Bunun yerine yayımlanmış tüm yatırımlar gösteriliyor — buradaki hiçbir varlık sahip olunan değildir.",
    empty: "Çizilecek yayımlanmış yatırım yok.",
    noBuildings:
      "Bu yatırımların hiçbiri varlık listesi yayımlamıyor, bu nedenle çizilecek bina katmanı yok. Yukarıdaki rakamlar yine de kesindir.",
    views: { cloud: "Küme", orbit: "Yörünge", lens: "Mercek" },
    blurbs: {
      cloud: "Her bina bir nokta, kümelere ayrılmış ve batıdan doğuya sıralanmış. Her etiket altındaki noktaları sayar.",
      orbit: "Dilim genişliği bina payı, bant kalınlığı sermaye payıdır. Nabız yayımlanan dağıtım sıklığıdır, tutar değildir.",
      lens: "Aynı binalar yeniden sıralanır. Adet, noktaların kendisidir ve hiç değişmez.",
    },
    groupBy: "Gruplama",
    committed: "Taahhüt",
    units: "Birim",
    buildings: "Bina",
    markets: "Pazar",
    hintCloud: "Bir kümeye gelin veya dokunun.",
    hintDot: "Bir noktaya gelin veya dokunun.",
    suites: (n: number) => `${n} daire`,
    noSuites: "Daire adedi yayımlanmadı",
    heldThrough: "Şu araç üzerinden",
    ofTotal: "taahhüdün",
    cadence: "dağıtım",
    noDollar: "Bu bina ayrı bir tutar taşımaz — tutarın bulunduğu en alt düzey araçtır.",
    legendPartial: "doğrulama kısmi",
    legendRule: "dilim genişliği = bina · bant kalınlığı = sermaye · nabız = sıklık",
    legendSame: (n: number) => `${n} nokta, her zaman aynı ${n}`,
    lightMode: "Açık",
    darkMode: "Koyu",
    themeToggle: "Görünüm modunu değiştir",
    groups: {
      vehicle: "Fon",
      province: "İl",
      market: "Pazar",
      assetClass: "Varlık sınıfı",
      condition: "Durum",
      verification: "Veri kalitesi",
    },
    conditions: {
      stabilized: "Stabil",
      commercial: "Ticari — mevcut",
      "new-construction": "Yeni inşaat",
      "value-add": "Değer artırıcı",
    },
    verified: "Doğrulanmış",
    partial: "Kısmi",
    pending: "Beklemede",
    residential: "Konut",
    commercialClass: "Ticari",
  },
} as const;

/** useLayoutEffect on the client, useEffect on the server — avoids the SSR warning. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

export function AssetClusters({
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
  const [view, setView] = useState<ClusterView>("cloud");
  const [groupId, setGroupId] = useState("market");
  const [mode, setMode] = useState<TerminalMode>("dark");
  const [hoverDot, setHoverDot] = useState<Dot | null>(null);
  const [hoverCluster, setHoverCluster] = useState<{ key: string; items: Dot[] } | null>(null);

  // Layout effect, not effect: this runs before paint, so a stored "light"
  // preference does not flash the dark default first.
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
  const palette = theme.vehicles;

  const investorOptions = useMemo(
    () => fundedInvestorOptions(users, investments, currentUserId),
    [users, investments, currentUserId],
  );

  const { vehicles, usingHeld } = useMemo(
    () => buildVehicles({ offerings, investments, targetUserId, lang, palette }),
    [offerings, investments, targetUserId, lang, palette],
  );

  // Dots are mutable across renders on purpose: the lens tweens them from where
  // they currently sit, so their positions must survive a re-render.
  const dots = useMemo<Dot[]>(
    () =>
      vehicles.flatMap((v) =>
        v.buildings.map((b) => ({ ...b, vehicle: v, x: 0, y: 0, px: 0, py: 0, fx: 0, fy: 0 })),
      ),
    [vehicles],
  );

  const totalCommitted = vehicles.reduce((s, v) => s + v.committed, 0);
  const totalUnits = vehicles.reduce((s, v) => s + (v.units ?? 0), 0);
  const markets = useMemo(() => new Set(dots.map((d) => d.city)).size, [dots]);

  const conditionLabel = useCallback(
    (id: string) => (c.conditions as Record<string, string>)[id] ?? id,
    [c],
  );
  const classLabel = useCallback(
    (id: string) => (id.toLowerCase().includes("commercial") ? c.commercialClass : c.residential),
    [c],
  );
  const verificationLabel = useCallback(
    (v: string) => (v === "verified" ? c.verified : v === "partial" ? c.partial : c.pending),
    [c],
  );

  // A grouping is offered only when every building carries the field. That is
  // what makes this scale: a future offering with a new complete field adds a
  // chip, and an incomplete one simply does not appear.
  const groupings = useMemo<Grouping[]>(() => {
    const all: (Grouping & { complete: (d: Dot) => boolean })[] = [
      { id: "vehicle", label: c.groups.vehicle, key: (d) => d.vehicle.short, complete: (d) => !!d.vehicle.short },
      { id: "market", label: c.groups.market, key: (d) => d.city, complete: (d) => !!d.city },
      { id: "province", label: c.groups.province, key: (d) => d.province, complete: (d) => !!d.province },
      { id: "assetClass", label: c.groups.assetClass, key: (d) => classLabel(d.assetClassId), complete: (d) => !!d.assetClassId },
      { id: "condition", label: c.groups.condition, key: (d) => conditionLabel(d.condition), complete: (d) => !!d.condition },
      { id: "verification", label: c.groups.verification, key: (d) => verificationLabel(d.verification), complete: (d) => !!d.verification },
    ];
    return all
      .filter((g) => dots.length > 0 && dots.every(g.complete))
      .map((g): Grouping => ({ id: g.id, label: g.label, key: g.key }));
  }, [c, dots, classLabel, conditionLabel, verificationLabel]);

  const grouping = groupings.find((g) => g.id === groupId) ?? groupings[0];
  const groupOrder = grouping?.id === "vehicle" ? vehicles.map((v) => v.short) : null;

  useEffect(() => {
    if (grouping && grouping.id !== groupId) setGroupId(grouping.id);
  }, [grouping, groupId]);

  const onHoverDot = useCallback((d: Dot | null) => setHoverDot(d), []);
  const onHoverCluster = useCallback(
    (key: string | null, items: Dot[]) => setHoverCluster(key ? { key, items } : null),
    [],
  );

  const centreLines = useMemo(
    () => [
      money(totalCommitted, lang),
      totalUnits > 0 ? `${num(totalUnits, lang)} ${c.units.toLowerCase()}` : "",
      `${dots.length} ${c.buildings.toLowerCase()}`,
    ],
    [totalCommitted, totalUnits, dots.length, lang, c],
  );

  if (!vehicles.length) {
    return (
      <section>
        <PageHeader title={c.title} description={c.description} />
        <p className="rounded-md border border-[#dce3e7] bg-white px-4 py-6 text-sm text-[#657681]">{c.empty}</p>
      </section>
    );
  }

  const readout = (() => {
    if (view === "cloud" && hoverCluster) {
      const items = hoverCluster.items;
      const byVehicle = vehicles
        .map((v) => ({ v, n: items.filter((d) => d.vehicleId === v.id).length }))
        .filter((x) => x.n > 0);
      const disclosed = items.filter((d) => d.units != null);
      const suites = disclosed.reduce((s, d) => s + (d.units ?? 0), 0);
      return (
        <>
          <div className="text-[15px]">{hoverCluster.key}</div>
          <div className="mt-1 text-[color:var(--t-ink-2)]">
            {items.length} {items.length === 1 ? c.buildings.toLowerCase() : c.buildings.toLowerCase()}
            {" · "}
            {byVehicle.map((x) => `${x.n} ${x.v.short}`).join(" + ")}
            {disclosed.length > 0
              ? ` · ${c.suites(suites)} (${disclosed.length}/${items.length})`
              : ` · ${c.noSuites}`}
          </div>
          <ul className="mt-2 columns-1 gap-6 text-[color:var(--t-ink-2)] sm:columns-2">
            {items.map((d) => (
              <li key={d.id} className="break-inside-avoid py-px">
                {d.name} — {classLabel(d.assetClassId)}, {conditionLabel(d.condition)}
              </li>
            ))}
          </ul>
        </>
      );
    }
    if (view !== "cloud" && hoverDot) {
      const v = hoverDot.vehicle;
      const share = totalCommitted > 0 ? ((v.committed / totalCommitted) * 100).toFixed(1) : "—";
      return (
        <>
          <div className="text-[15px]">{hoverDot.name}</div>
          <div className="mt-1 text-[color:var(--t-ink-2)]">
            {hoverDot.city}, {hoverDot.province} · {classLabel(hoverDot.assetClassId)} ·{" "}
            {conditionLabel(hoverDot.condition)} ·{" "}
            {hoverDot.units != null ? c.suites(hoverDot.units) : c.noSuites} ·{" "}
            {verificationLabel(hoverDot.verification)}
          </div>
          <div className="mt-1 text-[color:var(--t-ink-2)]">
            {c.heldThrough} <b className="text-[color:var(--t-ink)]">{v.name}</b> — {money(v.committed, lang)} (
            {share}% {c.ofTotal}). {c.noDollar}
          </div>
        </>
      );
    }
    return <div className="text-[color:var(--t-ink-3)]">{view === "cloud" ? c.hintCloud : c.hintDot}</div>;
  })();

  return (
    <section>
      <PageHeader title={c.title} description={c.description} />

      {investorOptions.length > 0 && (
        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[#657681]">
          <span>{c.viewing}</span>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="rounded-md border border-[#dce3e7] bg-white px-3 py-1.5 text-sm text-[#18384e]"
          >
            <option value={currentUserId}>{currentUserName || c.myAccount}</option>
            {investorOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {!usingHeld && (
        <p className="mb-4 rounded-md border border-[#eadcae] bg-[#fdf8ec] px-4 py-3 text-sm text-[#755718]">
          {c.noPositions}
        </p>
      )}

      <div
        style={themeVars(theme)}
        className="overflow-hidden border-[color:var(--t-rule)] bg-[color:var(--t-ground)] text-[13px] tabular-nums text-[color:var(--t-ink)] max-sm:-mx-4 max-sm:border-y sm:rounded-md sm:border"
      >
        {/* Which view */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--t-rule)] bg-[color:var(--t-head)] px-3 py-2.5">
          <div className="flex gap-2">
            {(["cloud", "orbit", "lens"] as ClusterView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] ${
                  view === v
                    ? "border-[color:var(--t-ink)] bg-[color:var(--t-ink)] text-[color:var(--t-ground)]"
                    : "border-[color:var(--t-rule)] text-[color:var(--t-ink-2)] hover:text-[color:var(--t-ink)]"
                }`}
              >
                {c.views[v]}
              </button>
            ))}
          </div>
          <span className="ml-auto" />
          <button
            type="button"
            onClick={toggleMode}
            title={c.themeToggle}
            className="rounded-full border border-[color:var(--t-rule)] px-3 py-1.5 text-[11px] uppercase tracking-[0.09em] text-[color:var(--t-ink-2)] hover:text-[color:var(--t-ink)]"
          >
            {mode === "dark" ? c.lightMode : c.darkMode}
          </button>
        </div>

        {/* Headline figures — the only place a dollar amount appears. */}
        <div className="grid grid-cols-2 border-b border-[color:var(--t-rule)] sm:grid-cols-4">
          {[
            { k: c.committed, v: money(totalCommitted, lang) },
            { k: c.units, v: totalUnits > 0 ? num(totalUnits, lang) : "—" },
            { k: c.buildings, v: String(dots.length) },
            { k: c.markets, v: String(markets) },
          ].map((cell) => (
            <div key={cell.k} className="border-b border-r border-[color:var(--t-rule-soft)] px-3 py-2.5 last:border-r-0">
              <div className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)]">{cell.k}</div>
              <div className="mt-0.5 text-[17px]">{cell.v}</div>
            </div>
          ))}
        </div>

        <p className="border-b border-[color:var(--t-rule)] px-3 py-2 text-[12px] text-[color:var(--t-ink-3)]">
          {c.blurbs[view]}
        </p>

        {dots.length === 0 ? (
          <p className="px-3 py-8 text-center text-[color:var(--t-ink-3)]">{c.noBuildings}</p>
        ) : (
          <>
            {/* Grouping chips + legend. On a narrow screen the chips scroll on
                their own line and the legend drops below, rather than the
                legend being squeezed into a tall column beside them. */}
            {view !== "orbit" && groupings.length > 1 && (
              <div className="flex flex-col gap-2 border-b border-[color:var(--t-rule)] bg-[color:var(--t-head)] px-3 py-2 sm:flex-row sm:items-center">
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {groupings.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGroupId(g.id)}
                      aria-pressed={g.id === grouping?.id}
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11.5px] ${
                        g.id === grouping?.id
                          ? "border-[color:var(--t-ink)] bg-[color:var(--t-ink)] text-[color:var(--t-ground)]"
                          : "border-[color:var(--t-rule)] text-[color:var(--t-ink-2)] hover:text-[color:var(--t-ink)]"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-[color:var(--t-ink-3)] sm:ml-auto">
                  {vehicles.map((v) => (
                    <span key={v.id} className="inline-flex items-center gap-1.5">
                      <i className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                      {v.short}
                    </span>
                  ))}
                  {view === "lens" && <span>{c.legendSame(dots.length)}</span>}
                </div>
              </div>
            )}
            {view === "orbit" && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-[color:var(--t-rule)] bg-[color:var(--t-head)] px-3 py-2 text-[11px] text-[color:var(--t-ink-3)]">
                {vehicles.map((v) => (
                  <span key={v.id} className="inline-flex items-center gap-1.5">
                    <i className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                    {v.short} — {money(v.committed, lang)}, {v.buildings.length} {c.buildings.toLowerCase()}
                  </span>
                ))}
                <span className="basis-full sm:basis-auto">{c.legendRule}</span>
              </div>
            )}

            {/* The orbit's radius is bounded by the shorter side, so a full-bleed
                canvas would leave half a wide panel empty. Cap it near square. */}
            <div className={view === "orbit" ? "mx-auto max-w-[720px]" : undefined}>
              {grouping && (
                <ClusterCanvas
                  view={view}
                  dots={dots}
                  vehicles={vehicles}
                  grouping={grouping}
                  groupOrder={groupOrder}
                  theme={theme}
                  height={view === "orbit" ? 560 : 520}
                  onHoverDot={onHoverDot}
                  onHoverCluster={onHoverCluster}
                  centreTitle={c.committed.toUpperCase()}
                  centreLines={centreLines}
                />
              )}
            </div>

            <div className="min-h-[76px] border-t border-[color:var(--t-rule)] bg-[color:var(--t-head)] px-3 py-2.5 text-[12.5px]">
              {readout}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
