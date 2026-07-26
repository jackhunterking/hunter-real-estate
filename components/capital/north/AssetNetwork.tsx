"use client";

/**
 * Asset network — an admin-only picture of an investor's holdings as a connected
 * graph, and of every building behind them as clustered dots.
 *
 * The hard constraint this screen is built around: the platform has no record of
 * money an investor has actually received. There are no distribution payments,
 * no NAV series, no realised gain, no per-building income. So nothing here draws
 * a dollar arriving. What it draws is what we do hold —
 *
 *   from a position   committed amount, unit count, status
 *   from an offering  published targets, trailing returns, AUM, offering size,
 *                     funding percent, distribution frequency, and every
 *                     building's coordinates, asset class, condition and
 *                     verification status, each with its own as-of date
 *
 * The one animated element is a pulse along the fund-to-investor edge, timed to
 * the fund's *published distribution frequency*. It marks a date the fund says
 * it pays on. The canvas says so on its face, because an animation about money
 * that is not labelled will be read as money received.
 *
 * Colour means which fund. Every building is the same dot; asset class is
 * carried by position in the exposure view and by the tooltip everywhere else.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { OfferingBundle } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import type { AdminUserRow } from "@/lib/capital/admin-server";
import { primaryShareClass } from "@/lib/capital/present";
import { unitPriceOf, impliedShares } from "@/lib/capital/shares";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import type { Lang } from "@/lib/capital/types";
import { PageHeader, Panel } from "./PortalUI";

const COPY = {
  en: {
    title: "Asset network",
    description:
      "Every building behind an investor's positions, drawn as one connected picture. Committed amounts, unit counts and each fund's published figures — never income received, current value, or a payment.",
    viewing: "Viewing",
    myAccount: "My account",
    wholeShelf: "Whole shelf (all published investments)",
    noPositions:
      "This account holds no positions, so the network shows every published investment instead. Nothing here is owned.",
    constellation: "Constellation",
    terminal: "Terminal",
    structure: "Structure",
    capital: "Capital",
    provenance: "Provenance",
    geography: "Geography",
    exposure: "Exposure",
    condition: "Condition",
    rail: "Instrument rail",
    modeNote: {
      structure: "Holdings · buildings by fund",
      capital: "Committed dollars · published raise",
      provenance: "Verification · data freshness",
      geography: "Real coordinates",
      exposure: "Province × asset class",
      condition: "Published condition",
    },
    buildings: "buildings",
    building: "building",
    positions: "positions",
    position: "position",
    committed: "committed",
    committedTotal: (v: string) => `${v} committed`,
    unitsAcross: (units: string, n: number) =>
      `${units} units across ${n} ${n === 1 ? "position" : "positions"} · not current value`,
    acrossPositions: (n: number) => `across ${n} ${n === 1 ? "position" : "positions"}`,
    verifiedOf: (a: number, b: number) => `${a} of ${b} buildings verified`,
    allCurrent: "All fund figures are within their review cadence",
    pastReview: (names: string) => `${names} past review date`,
    pulseNote: "Gold pulse = published distribution schedule, not a payment",
    noBuildings: "No buildings are published for these investments yet.",
    empty: "No published investments to draw.",
    scheduled: "Scheduled distribution date",
    noPositionHeld: "No position held",
    sharingLocation: "Number = buildings sharing a location",
    verifiedBuilding: "Verified building",
    partialBuilding: "Partially verified",
    pendingBuilding: "Verification pending",
    figuresCurrent: "Fund figures current",
    figuresStale: "Fund past review date",
    residential: "Residential",
    commercial: "Commercial",
    noExposure: "no exposure",
    unitsLabel: "units",
    unitsUnpublished: "Unit count not published",
    yourUnits: "Your units",
    totalUnits: "Total units",
    unitPrice: "Unit price",
    aum: "AUM",
    distributions: "Distributions",
    publishedReturns: "Published returns",
    asOf: "As of",
    reviewOverdue: (d: number) => `Review overdue by ${d} days`,
    reviewDue: (d: number) => `Review due in ${d} days`,
    reviewCurrent: (d: number) => `Current — next review in ${d} days`,
    noSchedule: "No schedule published",
    everythingHere: "Everything terminates here.",
    noPaymentRecord: "Commitments and units only — we hold no record of payments received",
    via: "via",
    sharingBlock: "buildings sharing this block",
    footGeography: "Real coordinates · badge = buildings sharing a block",
    footExposure: "Every building placed by its published province and asset class",
    footCondition: "Condition as published by each fund · no independent assessment",
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
      "Bir yatırımcının pozisyonlarının arkasındaki her bina, tek bir bağlantılı görsel olarak. Taahhüt tutarları, birim sayıları ve her fonun yayımladığı rakamlar — elde edilen gelir, güncel değer veya bir ödeme değil.",
    viewing: "Görüntülenen",
    myAccount: "Hesabım",
    wholeShelf: "Tüm raf (yayımlanmış tüm yatırımlar)",
    noPositions:
      "Bu hesapta pozisyon yok; ağ bunun yerine yayımlanmış tüm yatırımları gösteriyor. Buradaki hiçbir varlık sahip olunan değildir.",
    constellation: "Takımyıldız",
    terminal: "Terminal",
    structure: "Yapı",
    capital: "Sermaye",
    provenance: "Kaynak",
    geography: "Coğrafya",
    exposure: "Dağılım",
    condition: "Durum",
    rail: "Gösterge paneli",
    modeNote: {
      structure: "Pozisyonlar · fona göre binalar",
      capital: "Taahhüt edilen tutar · yayımlanan toplama",
      provenance: "Doğrulama · veri güncelliği",
      geography: "Gerçek koordinatlar",
      exposure: "İl × varlık sınıfı",
      condition: "Yayımlanan durum",
    },
    buildings: "bina",
    building: "bina",
    positions: "pozisyon",
    position: "pozisyon",
    committed: "taahhüt",
    committedTotal: (v: string) => `${v} taahhüt edildi`,
    unitsAcross: (units: string, n: number) => `${n} pozisyonda ${units} birim · güncel değer değildir`,
    acrossPositions: (n: number) => `${n} pozisyonda`,
    verifiedOf: (a: number, b: number) => `${b} binanın ${a} tanesi doğrulandı`,
    allCurrent: "Tüm fon verileri inceleme sıklığı içinde",
    pastReview: (names: string) => `${names} inceleme tarihini geçti`,
    pulseNote: "Altın darbe = yayımlanan dağıtım takvimi, ödeme değil",
    noBuildings: "Bu yatırımlar için henüz bina yayımlanmadı.",
    empty: "Çizilecek yayımlanmış yatırım yok.",
    scheduled: "Planlanan dağıtım tarihi",
    noPositionHeld: "Pozisyon yok",
    sharingLocation: "Sayı = aynı konumu paylaşan binalar",
    verifiedBuilding: "Doğrulanmış bina",
    partialBuilding: "Kısmen doğrulanmış",
    pendingBuilding: "Doğrulama bekliyor",
    figuresCurrent: "Fon verileri güncel",
    figuresStale: "Fon inceleme tarihini geçti",
    residential: "Konut",
    commercial: "Ticari",
    noExposure: "dağılım yok",
    unitsLabel: "birim",
    unitsUnpublished: "Birim sayısı yayımlanmadı",
    yourUnits: "Birimleriniz",
    totalUnits: "Toplam birim",
    unitPrice: "Birim fiyatı",
    aum: "Yönetilen varlık",
    distributions: "Dağıtımlar",
    publishedReturns: "Yayımlanan getiriler",
    asOf: "Veri tarihi",
    reviewOverdue: (d: number) => `İnceleme ${d} gün gecikti`,
    reviewDue: (d: number) => `İncelemeye ${d} gün kaldı`,
    reviewCurrent: (d: number) => `Güncel — sonraki inceleme ${d} gün sonra`,
    noSchedule: "Takvim yayımlanmadı",
    everythingHere: "Her şey burada birleşir.",
    noPaymentRecord: "Yalnızca taahhütler ve birimler — elde edilen ödemelere dair kaydımız yok",
    via: "aracılığıyla",
    sharingBlock: "bina aynı adayı paylaşıyor",
    footGeography: "Gerçek koordinatlar · rozet = aynı adayı paylaşan binalar",
    footExposure: "Her bina yayımlanan iline ve varlık sınıfına göre yerleştirildi",
    footCondition: "Durum her fonun yayımladığı gibidir · bağımsız değerlendirme yoktur",
    conditions: {
      stabilized: "İstikrarlı",
      commercial: "Ticari",
      "new-construction": "Yeni inşaat",
      "value-add": "Değer artırıcı",
    },
  },
} as const;

/**
 * Fund identity hues, validated against the #101a33 canvas for the lightness
 * band, chroma floor, adjacent-pair CVD separation and contrast. Gold is NOT in
 * this list: it is reserved for the investor node and the schedule pulse, so a
 * fund can never be mistaken for money.
 */
const FUND_COLORS = ["#5f78c4", "#1c9d8b", "#9a7bd1", "#b8724f"];

const GOLD = "#ebc76b";
const GREY = "#6c7590";
const INK = "#e9e3d5";
const DIM = "#8ea0c4";
const OK = "#4f9d78";
const WARN = "#c9973f";
const GROUND = "#101a33";

type NetBuilding = {
  id: string;
  name: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
  assetClassId: string;
  condition: string;
  verification: string;
  units?: number;
};

type NetFund = {
  id: string;
  short: string;
  name: string;
  color: string;
  held: boolean;
  committed: number;
  units: number;
  unitPrice?: number;
  aum?: string;
  offeringSize?: number;
  fundingPercent?: number;
  unitsTotal?: number;
  targetReturn?: string;
  targetDist?: string;
  distLabel?: string;
  distPerYear?: number;
  periodLabel?: string;
  dataAsOf?: string;
  cadenceMonths?: number;
  returns: { period: string; value: number }[];
  returnBasis?: string;
  buildings: NetBuilding[];
};

type Freshness = { state: "current" | "due-soon" | "overdue"; label: string; color: string };

const CADENCE_MONTHS: Record<string, number> = {
  quarterly: 3,
  "semi-annual": 6,
  annual: 12,
  "ad-hoc": 12,
};

/** Distributions a year, read from the fund's published frequency wording. */
function perYearFromFrequency(label: string | undefined): number | undefined {
  if (!label) return undefined;
  const value = label.toLowerCase();
  if (value.includes("month") || value.includes("ayl")) return 12;
  if (value.includes("quarter") || value.includes("üç ay") || value.includes("uc ay")) return 4;
  if (value.includes("semi") || value.includes("alti ay") || value.includes("altı ay")) return 2;
  if (value.includes("annual") || value.includes("year") || value.includes("yıll") || value.includes("yill")) return 1;
  return undefined;
}

/** "4.1%" / "%4,1" → 4.1. Returns null when the published value is not a number. */
function parsePercent(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function freshnessOf(fund: NetFund, c: (typeof COPY)["en"]): Freshness | null {
  if (!fund.dataAsOf || !fund.cadenceMonths) return null;
  const due = new Date(`${fund.dataAsOf}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return null;
  due.setUTCMonth(due.getUTCMonth() + fund.cadenceMonths);
  const days = Math.round((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return { state: "overdue", label: c.reviewOverdue(Math.abs(days)), color: WARN };
  if (days < 30) return { state: "due-soon", label: c.reviewDue(days), color: WARN };
  return { state: "current", label: c.reviewCurrent(days), color: OK };
}

function isCommercial(assetClassId: string) {
  return assetClassId.toLowerCase().includes("commercial");
}

function fmtMoney(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtNumber(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA").format(value);
}

/** Whole units for a position: subscribed units when recorded, else implied. */
function positionUnits(amount: number, shareQuantity: number | undefined, fund: OfferingBundle) {
  if (shareQuantity && shareQuantity > 0) return shareQuantity;
  const implied = impliedShares(amount, unitPriceOf(fund));
  return implied != null ? Math.round(implied) : 0;
}

type View = "constellation" | "terminal";
type Mode = "structure" | "capital" | "provenance" | "geography" | "exposure" | "condition";

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
  const [view, setView] = useState<View>("constellation");
  const [constellationMode, setConstellationMode] = useState<Mode>("structure");
  const [terminalMode, setTerminalMode] = useState<Mode>("geography");
  const [targetUserId, setTargetUserId] = useState(currentUserId);
  const [railOn, setRailOn] = useState(true);

  const mode = view === "constellation" ? constellationMode : terminalMode;

  /** Investors with at least one funded position — the only ones worth mirroring. */
  const investorOptions = useMemo(() => {
    const funded = new Set(
      investments.filter((i) => i.status === "funded").map((i) => i.userId),
    );
    return users
      .filter((u) => funded.has(u.userId) && u.userId !== currentUserId)
      .map((u) => ({ id: u.userId, label: u.displayName || u.email }));
  }, [users, investments, currentUserId]);

  const { funds, usingHeld } = useMemo(() => {
    const mine = investments.filter(
      (i) => i.userId === targetUserId && i.status === "funded",
    );

    const held = offerings
      .map((offering) => {
        const rows = mine.filter((i) => i.offeringId === offering.id);
        if (!rows.length) return null;
        return {
          offering,
          committed: rows.reduce((sum, r) => sum + r.amount, 0),
          units: rows.reduce(
            (sum, r) => sum + positionUnits(r.amount, r.shareQuantity, offering),
            0,
          ),
        };
      })
      .filter((x): x is { offering: OfferingBundle; committed: number; units: number } => x != null);

    // No positions: draw the published shelf instead, captioned as not owned.
    // Same fallback the portfolio page uses, for the same reason.
    const source = held.length
      ? held
      : offerings
          .filter((o) => o.status === "available")
          .map((offering) => ({ offering, committed: 0, units: 0 }));

    const list: NetFund[] = source.map(({ offering, committed, units }, index) => {
      const shareClass = primaryShareClass(offering);
      const distLabel = offering.distributionFrequency ? tx(offering.distributionFrequency, lang) : undefined;
      return {
        id: offering.id,
        short: tx(offering.shortName, lang),
        name: tx(offering.name, lang),
        color: FUND_COLORS[index % FUND_COLORS.length],
        held: held.length > 0,
        committed,
        units,
        unitPrice: unitPriceOf(offering) ?? undefined,
        aum: offering.aum?.value,
        offeringSize: offering.offeringSize?.value,
        fundingPercent: offering.fundingPercent,
        unitsTotal: offering.unitsTotal?.value,
        targetReturn: shareClass?.targetReturn?.value,
        targetDist: shareClass?.targetDistribution?.value,
        distLabel,
        distPerYear: perYearFromFrequency(
          offering.distributionFrequency ? tx(offering.distributionFrequency, "en") : undefined,
        ),
        periodLabel: offering.dataPeriodLabel,
        dataAsOf: offering.dataAsOf,
        cadenceMonths: offering.updateCadence ? CADENCE_MONTHS[offering.updateCadence] : undefined,
        returns: (offering.trailingReturns ?? [])
          .map((r) => ({ period: tx(r.period, lang), value: parsePercent(r.value) }))
          .filter((r): r is { period: string; value: number } => r.value != null),
        returnBasis: offering.trailingReturnsNote ? tx(offering.trailingReturnsNote, lang) : undefined,
        buildings: offering.properties.map((p) => ({
          id: p.id,
          name: tx(p.name, lang),
          city: p.city,
          province: p.province,
          lat: p.latitude,
          lng: p.longitude,
          assetClassId: p.assetClassId,
          condition: p.status,
          verification: p.verificationStatus,
          units: p.unitCount,
        })),
      };
    });

    return { funds: list, usingHeld: held.length > 0 };
  }, [offerings, investments, targetUserId, lang]);

  const buildings = useMemo(() => funds.flatMap((f) => f.buildings), [funds]);
  const hasGeography = buildings.some((b) => b.lat && b.lng);

  const modes: Mode[] =
    view === "constellation"
      ? ["structure", "capital", "provenance"]
      : ["geography", "exposure", "condition"];

  return (
    <section>
      <PageHeader title={c.title} />
      <p className="-mt-3 mb-5 max-w-3xl text-sm leading-6 text-[#657681]">{c.description}</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f6e78]">
          {c.viewing}
          <select
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
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

        <div className="flex overflow-hidden rounded-md border border-[#d5dde2]">
          {(["constellation", "terminal"] as View[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              aria-pressed={view === item}
              className={`px-3 py-2 text-xs font-semibold ${
                view === item ? "bg-[#102638] text-white" : "bg-white text-[#5f6e78] hover:bg-[#f2f5f7]"
              }`}
            >
              {item === "constellation" ? c.constellation : c.terminal}
            </button>
          ))}
        </div>
      </div>

      {!usingHeld && (
        <p className="mb-4 rounded-md border border-[#eadcae] bg-[#fdf8ec] px-4 py-3 text-sm text-[#755718]">
          {c.noPositions}
        </p>
      )}

      <Panel className="overflow-hidden">
        {funds.length === 0 || !buildings.length ? (
          <p className="px-5 py-10 text-center text-sm text-[#657681]">
            {funds.length === 0 ? c.empty : c.noBuildings}
          </p>
        ) : (
          <NetworkCanvas
            funds={funds}
            view={view}
            mode={mode}
            modes={modes}
            railOn={railOn}
            hasGeography={hasGeography}
            onMode={(next) =>
              view === "constellation" ? setConstellationMode(next) : setTerminalMode(next)
            }
            onRail={() => setRailOn((value) => !value)}
            c={c}
            lang={lang}
          />
        )}
      </Panel>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

type Tip = { x: number; y: number; title: string; lines: string[]; note?: string };

function NetworkCanvas({
  funds,
  view,
  mode,
  modes,
  modeless,
  railOn,
  hasGeography,
  onMode,
  onRail,
  c,
  lang,
}: {
  funds: NetFund[];
  view: View;
  mode: Mode;
  modes: Mode[];
  modeless?: boolean;
  railOn: boolean;
  hasGeography: boolean;
  onMode: (mode: Mode) => void;
  onRail: () => void;
  c: (typeof COPY)["en"];
  lang: Lang;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const stateRef = useRef<{
    nodes: ConstellationNode[];
    dots: TerminalDot[];
    rail: { id: string; y0: number; y1: number }[];
    plot: PlotBox;
    w: number;
    h: number;
  }>({ nodes: [], dots: [], rail: [], plot: emptyPlot(), w: 0, h: 0 });

  const buildings = useMemo(() => funds.flatMap((f) => f.buildings), [funds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let start = 0;
    let visible = true;

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = stateRef.current;
      s.w = rect.width;
      s.h = rect.height;
      if (view === "constellation") {
        s.nodes = layoutConstellation(funds, rect.width, rect.height);
      } else {
        const railWidth = railOn && rect.width > 700 ? RAIL_W : 0;
        s.plot = {
          x: railWidth + 18,
          y: 16,
          w: rect.width - railWidth - 36,
          h: rect.height - 52,
          cols: [],
          rows: [],
          padL: 0,
          padT: 0,
          cw: 0,
          ch: 0,
          cells: {},
        };
        s.dots =
          mode === "geography"
            ? layoutGeography(funds, s.plot)
            : layoutCluster(funds, s.plot, mode, lang, c);
      }
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const t = reduce ? 3 : (now - start) / 1000;
      const s = stateRef.current;
      ctx.clearRect(0, 0, s.w, s.h);
      if (view === "constellation") {
        drawConstellation(ctx, s.nodes, s.w, s.h, t, mode, funds, c, lang);
      } else {
        s.rail = drawTerminal(ctx, s, funds, mode, railOn, c, lang);
      }
      raf = visible && !reduce ? requestAnimationFrame(frame) : 0;
    };

    const observer = new ResizeObserver(() => {
      layout();
      frame(performance.now());
    });
    observer.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !raf && !reduce) {
          start = 0;
          raf = requestAnimationFrame(frame);
        } else if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    layout();
    frame(performance.now());

    return () => {
      observer.disconnect();
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [funds, view, mode, railOn, c, lang]);

  const onMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const s = stateRef.current;
    setTip(
      view === "constellation"
        ? hitConstellation(s.nodes, x, y, c, lang)
        : hitTerminal(s, funds, x, y, railOn, c, lang),
    );
  };

  const verified = buildings.filter((b) => b.verification === "verified").length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[#22304f] bg-[#0c1529] px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8ea0c4]">
          {view === "constellation" ? c.constellation : c.terminal}
        </span>
        {!modeless && (
          <div className="flex overflow-hidden rounded border border-[#2c3b5d]">
            {modes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onMode(item)}
                aria-pressed={mode === item}
                disabled={item === "geography" && !hasGeography}
                className={`border-r border-[#2c3b5d] px-3 py-1.5 text-[11px] font-semibold last:border-r-0 disabled:opacity-40 ${
                  mode === item
                    ? "bg-[#ebc76b] text-[#1a1508]"
                    : "bg-[#18243f] text-[#b9c6e0] hover:bg-[#22304f]"
                }`}
              >
                {c[item as keyof typeof c] as string}
              </button>
            ))}
          </div>
        )}
        {view === "terminal" && (
          <button
            type="button"
            onClick={onRail}
            aria-pressed={railOn}
            className={`rounded border px-3 py-1.5 text-[11px] font-semibold ${
              railOn
                ? "border-[#ebc76b] bg-[#ebc76b] text-[#1a1508]"
                : "border-[#2c3b5d] bg-[#18243f] text-[#b9c6e0] hover:bg-[#22304f]"
            }`}
          >
            {c.rail}
          </button>
        )}
        <span className="ml-auto text-[11.5px] text-[#6d7d9f]">
          {c.modeNote[mode as keyof typeof c.modeNote]}
        </span>
      </div>

      <div className="relative h-[560px] max-sm:h-[420px]" style={{ background: GROUND }}>
        <canvas
          ref={canvasRef}
          className="block size-full"
          onPointerMove={onMove}
          onPointerLeave={() => setTip(null)}
        />
        {tip && (
          <div
            className="pointer-events-none absolute z-10 max-w-[260px] min-w-[160px] -translate-x-1/2 rounded bg-[#f7f5ef] px-3 py-2 text-xs leading-relaxed text-[#16150f] shadow-lg"
            style={{
              left: Math.max(90, Math.min(stateRef.current.w - 90, tip.x)),
              top: Math.max(56, tip.y),
              transform: "translate(-50%, calc(-100% - 14px))",
            }}
          >
            <b className="mb-0.5 block font-serif text-[13.5px] font-semibold">{tip.title}</b>
            {tip.lines.map((line) => (
              <span key={line} className="block tabular-nums text-[#5c5849]">
                {line}
              </span>
            ))}
            {tip.note && (
              <em className="mt-1.5 block border-t border-[#e2ddce] pt-1.5 not-italic text-[11px] text-[#7b5c19]">
                {tip.note}
              </em>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-[#22304f] bg-[#0c1529] px-4 py-3 text-[11.5px] text-[#8ea0c4]">
        {mode === "provenance" ? (
          <>
            <LegendDot color={OK} label={`${c.verifiedBuilding} (${verified})`} />
            <LegendDot
              color={WARN}
              label={`${c.partialBuilding} (${buildings.length - verified})`}
            />
            <LegendDot color={OK} ring label={c.figuresCurrent} />
            <LegendDot color={WARN} ring label={c.figuresStale} />
          </>
        ) : (
          <>
            {funds.map((fund) => (
              <LegendDot
                key={fund.id}
                color={fund.color}
                label={`${fund.short} (${fund.buildings.length})`}
              />
            ))}
            {view === "constellation" && <LegendDot color={GOLD} dash label={c.scheduled} />}
            {view === "terminal" && mode === "geography" && (
              <LegendDot color={DIM} label={c.sharingLocation} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  ring,
  dash,
}: {
  color: string;
  label: string;
  ring?: boolean;
  dash?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className={dash ? "inline-block h-0.5 w-4 rounded-sm" : "inline-block size-2.5 rounded-full"}
        style={
          ring
            ? { boxShadow: `inset 0 0 0 2px ${color}` }
            : { background: color }
        }
      />
      {label}
    </span>
  );
}

/* ---------------------------------------------------------------- geometry */

const RAIL_W = 258;

type ConstellationNode =
  | { kind: "you"; x: number; y: number; r: number }
  | {
      kind: "fund";
      x: number;
      y: number;
      r: number;
      rDrawn?: number;
      fund: NetFund;
      angle: number;
    }
  | { kind: "building"; x: number; y: number; fund: NetFund; data: NetBuilding };

type TerminalDot = {
  x: number;
  y: number;
  r: number;
  fund: NetFund;
  members: NetBuilding[];
};

type PlotBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  cols: string[];
  rows: string[];
  padL: number;
  padT: number;
  cw: number;
  ch: number;
  cells: Record<string, NetBuilding[]>;
};

function emptyPlot(): PlotBox {
  return { x: 0, y: 0, w: 0, h: 0, cols: [], rows: [], padL: 0, padT: 0, cw: 0, ch: 0, cells: {} };
}

function layoutConstellation(funds: NetFund[], w: number, h: number): ConstellationNode[] {
  const nodes: ConstellationNode[] = [];
  const cx = w / 2;
  const cy = h / 2 - 8;
  const R = Math.min(w, h) * 0.5;
  nodes.push({ kind: "you", x: cx, y: cy, r: 23 });

  const total = funds.reduce((sum, f) => sum + Math.max(1, f.buildings.length), 0);
  const gap = 0.17;
  let cursor = -Math.PI / 2 - 0.45;

  funds.forEach((fund) => {
    const share = Math.max(1, fund.buildings.length) / total;
    const span = share * (Math.PI * 2 - gap * funds.length);
    const mid = cursor + span / 2;
    const fundNode: ConstellationNode = {
      kind: "fund",
      fund,
      x: cx + Math.cos(mid) * R * 0.4,
      y: cy + Math.sin(mid) * R * 0.4,
      r: 13,
      angle: mid,
    };
    nodes.push(fundNode);

    fund.buildings.forEach((building, index) => {
      const frac = fund.buildings.length === 1 ? 0.5 : index / (fund.buildings.length - 1);
      const angle = cursor + 0.06 * span + frac * span * 0.88;
      const ring = R * (index % 2 === 0 ? 0.79 : 0.92);
      nodes.push({
        kind: "building",
        fund,
        data: building,
        x: cx + Math.cos(angle) * ring,
        y: cy + Math.sin(angle) * ring,
      });
    });

    cursor += span + gap;
  });

  return nodes;
}

function fundRadius(fund: NetFund, mode: Mode, maxCommitted: number) {
  if (mode !== "capital" || !maxCommitted) return 13;
  return 9 + Math.sqrt(fund.committed / Math.max(1, maxCommitted)) * 14;
}

function drawConstellation(
  ctx: CanvasRenderingContext2D,
  nodes: ConstellationNode[],
  w: number,
  h: number,
  t: number,
  mode: Mode,
  funds: NetFund[],
  c: (typeof COPY)["en"],
  lang: Lang,
) {
  if (!nodes.length) return;
  const you = nodes[0] as Extract<ConstellationNode, { kind: "you" }>;
  const maxCommitted = Math.max(...funds.map((f) => f.committed), 0);

  const glow = ctx.createRadialGradient(you.x, you.y, 0, you.x, you.y, Math.min(w, h) * 0.42);
  glow.addColorStop(0, "rgba(235,199,107,.09)");
  glow.addColorStop(1, "rgba(235,199,107,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const fundNodes = nodes.filter(
    (n): n is Extract<ConstellationNode, { kind: "fund" }> => n.kind === "fund",
  );
  const fundNodeFor = new Map(fundNodes.map((n) => [n.fund.id, n]));

  ctx.lineWidth = 1;
  nodes.forEach((n) => {
    if (n.kind !== "building") return;
    const target = fundNodeFor.get(n.fund.id);
    if (!target) return;
    ctx.strokeStyle = n.fund.held ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.06)";
    ctx.beginPath();
    ctx.moveTo(n.x, n.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  });

  fundNodes.forEach((n) => {
    ctx.strokeStyle = n.fund.held ? "rgba(235,199,107,.30)" : "rgba(255,255,255,.08)";
    ctx.lineWidth = n.fund.held ? 2 : 1;
    ctx.setLineDash(n.fund.held ? [] : [3, 5]);
    ctx.beginPath();
    ctx.moveTo(n.x, n.y);
    ctx.lineTo(you.x, you.y);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // One pulse per published distribution period, on a compressed clock
  // (a year of the fund's schedule plays out in twelve seconds). This marks a
  // DATE the fund publishes, never a payment we have observed.
  fundNodes.forEach((n) => {
    if (!n.fund.held || !n.fund.distPerYear) return;
    const period = 12 / n.fund.distPerYear;
    const phase = (t % period) / period;
    if (phase > 0.55) return;
    const u = phase / 0.55;
    ctx.fillStyle = `rgba(235,199,107,${0.9 * (1 - u * 0.35)})`;
    ctx.beginPath();
    ctx.arc(n.x + (you.x - n.x) * u, n.y + (you.y - n.y) * u, 3.4, 0, Math.PI * 2);
    ctx.fill();
  });

  nodes.forEach((n) => {
    if (n.kind !== "building") return;
    ctx.globalAlpha = n.fund.held ? 1 : 0.45;
    ctx.fillStyle =
      mode === "provenance"
        ? n.data.verification === "verified"
          ? OK
          : n.data.verification === "partial"
            ? WARN
            : GREY
        : n.fund.color;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  fundNodes.forEach((n) => {
    const r = fundRadius(n.fund, mode, maxCommitted);
    n.rDrawn = r;

    if (mode === "capital" && n.fund.fundingPercent) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (n.fund.fundingPercent / 100));
      ctx.strokeStyle = "rgba(235,199,107,.75)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(235,199,107,.16)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const fresh = mode === "provenance" ? freshnessOf(n.fund, c) : null;
    if (fresh) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
      ctx.strokeStyle = fresh.color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(fresh.state === "current" ? [] : [4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = GROUND;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = n.fund.held ? n.fund.color : GREY;
    ctx.globalAlpha = n.fund.held ? 1 : 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1;

    let ux = n.x - you.x;
    let uy = n.y - you.y;
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul;
    uy /= ul;
    const lx = n.x + ux * (r + 22);
    const ly = n.y + uy * (r + 22);
    ctx.textAlign = ux > 0.3 ? "left" : ux < -0.3 ? "right" : "center";

    // The two-line block always grows away from the node, so on a node whose
    // outward direction is up the second line does not fall back inside the ring.
    const up = uy < -0.3;
    ctx.fillStyle = n.fund.held ? INK : "rgba(233,227,213,.45)";
    ctx.font = '600 12px "Manrope", system-ui, sans-serif';
    ctx.fillText(n.fund.short, lx, up ? ly - 15 : ly);

    let sub: string;
    if (!n.fund.held) sub = c.noPositionHeld;
    else if (mode === "structure") sub = `${n.fund.buildings.length} ${c.buildings}`;
    else if (mode === "capital") sub = `${fmtMoney(n.fund.committed, lang)} ${c.committed}`;
    else sub = `${n.fund.periodLabel ?? ""}${fresh && fresh.state !== "current" ? " · !" : ""}`.trim();

    ctx.font = '10.5px "Manrope", system-ui, sans-serif';
    ctx.fillStyle = fresh
      ? fresh.color
      : n.fund.held
        ? "rgba(235,199,107,.9)"
        : "rgba(142,160,196,.7)";
    ctx.fillText(sub, lx, up ? ly : ly + 15);
  });

  const pulse = 1 + Math.sin(t * 1.5) * 0.03;
  ctx.beginPath();
  ctx.arc(you.x, you.y, you.r * pulse, 0, Math.PI * 2);
  ctx.fillStyle = GROUND;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = GOLD;
  ctx.stroke();

  const buildings = funds.flatMap((f) => f.buildings);
  const held = funds.filter((f) => f.held);
  let head: string;
  let sub: string;
  if (mode === "capital") {
    head = c.committedTotal(fmtMoney(held.reduce((s, f) => s + f.committed, 0), lang));
    sub = c.unitsAcross(fmtNumber(held.reduce((s, f) => s + f.units, 0), lang), held.length);
  } else if (mode === "provenance") {
    const verified = buildings.filter((b) => b.verification === "verified").length;
    head = c.verifiedOf(verified, buildings.length);
    const stale = held.filter((f) => {
      const fresh = freshnessOf(f, c);
      return fresh && fresh.state !== "current";
    });
    sub = stale.length ? c.pastReview(stale.map((f) => f.short).join(", ")) : c.allCurrent;
  } else {
    head = `${buildings.length} ${c.buildings}`;
    sub = c.acrossPositions(held.length || funds.length);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = mode === "provenance" ? INK : GOLD;
  ctx.font = '600 23px "Noto Serif", Georgia, serif';
  ctx.fillText(head, 22, h - 44);
  ctx.fillStyle = DIM;
  ctx.font = '11px "Manrope", system-ui, sans-serif';
  ctx.fillText(sub, 22, h - 25);

  if (funds.some((f) => f.held && f.distPerYear)) {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(142,160,196,.65)";
    ctx.font = '10px "Manrope", system-ui, sans-serif';
    ctx.fillText(c.pulseNote, w - 20, h - 25);
  }
}

function hitConstellation(
  nodes: ConstellationNode[],
  x: number,
  y: number,
  c: (typeof COPY)["en"],
  lang: Lang,
): Tip | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const r = n.kind === "fund" ? (n.rDrawn ?? 13) : n.kind === "you" ? n.r : 5;
    if (Math.hypot(n.x - x, n.y - y) > r + 7) continue;

    if (n.kind === "building") {
      return {
        x: n.x,
        y: n.y,
        title: n.data.name,
        lines: [
          `${n.data.city}, ${n.data.province}`,
          n.data.units ? `${fmtNumber(n.data.units, lang)} ${c.unitsLabel}` : c.unitsUnpublished,
        ],
        note: `${
          n.data.verification === "verified"
            ? c.verifiedBuilding
            : n.data.verification === "partial"
              ? c.partialBuilding
              : c.pendingBuilding
        } · ${c.via} ${n.fund.short}`,
      };
    }

    if (n.kind === "fund") {
      const fresh = freshnessOf(n.fund, c);
      const lines = [
        n.fund.held
          ? `${fmtMoney(n.fund.committed, lang)} ${c.committed} · ${fmtNumber(n.fund.units, lang)} ${c.unitsLabel}`
          : c.noPositionHeld,
      ];
      if (n.fund.unitPrice) lines.push(`${c.unitPrice} ${n.fund.unitPrice.toFixed(2)}`);
      if (n.fund.distLabel) lines.push(`${c.distributions}: ${n.fund.distLabel}`);
      if (n.fund.targetReturn) lines.push(n.fund.targetReturn);
      if (n.fund.fundingPercent && n.fund.offeringSize) {
        lines.push(`${n.fund.fundingPercent}% · ${fmtMoney(n.fund.offeringSize, lang)}`);
      }
      return {
        x: n.x,
        y: n.y,
        title: n.fund.name,
        lines,
        note: [n.fund.periodLabel && `${c.asOf} ${n.fund.periodLabel}`, fresh?.label]
          .filter(Boolean)
          .join(" · "),
      };
    }

    return {
      x: n.x,
      y: n.y,
      title: c.myAccount,
      lines: [c.everythingHere],
      note: c.noPaymentRecord,
    };
  }
  return null;
}

/* ---------------------------------------------------------------- terminal */

/** Mercator y in DEGREES so it shares units with longitude. */
function mercator(lat: number) {
  return (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
}

function layoutGeography(funds: NetFund[], plot: PlotBox): TerminalDot[] {
  const all = funds.flatMap((f) => f.buildings.map((b) => ({ fund: f, b })));
  const withCoords = all.filter((x) => x.b.lat && x.b.lng);
  if (!withCoords.length) return [];

  const lngs = withCoords.map((x) => x.b.lng);
  const ys = withCoords.map((x) => mercator(x.b.lat));
  const minL = Math.min(...lngs);
  const maxL = Math.max(...lngs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 46;
  const scale = Math.min(
    (plot.w - pad * 2) / Math.max(0.001, maxL - minL),
    (plot.h - pad * 2) / Math.max(0.001, maxY - minY),
  );
  const ox = plot.x + (plot.w - (maxL - minL) * scale) / 2;
  const oy = plot.y + (plot.h - (maxY - minY) * scale) / 2;

  const dots: TerminalDot[] = [];
  withCoords.forEach(({ fund, b }) => {
    const x = ox + (b.lng - minL) * scale;
    const y = oy + (maxY - mercator(b.lat)) * scale;
    // Cluster by fund and proximity. Every mark is the same dot, so splitting a
    // shared block by asset class would just be two identical dots side by side;
    // the mix goes in the tooltip instead.
    const near = dots.find(
      (d) => d.fund.id === fund.id && Math.hypot(d.x - x, d.y - y) < 14,
    );
    if (near) {
      near.members.push(b);
      near.x = (near.x * (near.members.length - 1) + x) / near.members.length;
      near.y = (near.y * (near.members.length - 1) + y) / near.members.length;
    } else {
      dots.push({ x, y, r: 4.8, fund, members: [b] });
    }
  });

  dots.forEach((d) => {
    d.r = 4.8 + Math.min(9, Math.sqrt(d.members.length - 1) * 4);
  });

  // A few relaxation passes so a dense metro does not stack into one blob.
  for (let pass = 0; pass < 70; pass++) {
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i];
        const b2 = dots[j];
        const dx = b2.x - a.x;
        const dy = b2.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const min = a.r + b2.r + 2.5;
        if (dist < min) {
          const push = (min - dist) / 4;
          a.x -= (dx / dist) * push;
          a.y -= (dy / dist) * push;
          b2.x += (dx / dist) * push;
          b2.y += (dy / dist) * push;
        }
      }
    }
  }

  return dots;
}

function layoutCluster(
  funds: NetFund[],
  plot: PlotBox,
  mode: Mode,
  lang: Lang,
  c: (typeof COPY)["en"],
): TerminalDot[] {
  const all = funds.flatMap((f) => f.buildings.map((b) => ({ fund: f, b })));

  let cols: string[];
  let rows: string[];
  let colOf: (b: NetBuilding) => string;
  let rowOf: (b: NetBuilding) => string;

  if (mode === "exposure") {
    cols = Array.from(new Set(all.map((x) => x.b.province))).sort();
    rows = ["residential", "commercial"];
    colOf = (b) => b.province;
    rowOf = (b) => (isCommercial(b.assetClassId) ? "commercial" : "residential");
  } else {
    cols = Array.from(new Set(all.map((x) => x.b.condition)));
    rows = ["all"];
    colOf = (b) => b.condition;
    rowOf = () => "all";
  }

  plot.cols = cols;
  plot.rows = rows;
  plot.padL = mode === "exposure" ? 108 : 24;
  plot.padT = 46;
  plot.cw = (plot.w - plot.padL - 16) / Math.max(1, cols.length);
  plot.ch = (plot.h - plot.padT - 40) / Math.max(1, rows.length);
  plot.cells = {};

  all.forEach(({ b }) => {
    const ci = cols.indexOf(colOf(b));
    const ri = rows.indexOf(rowOf(b));
    if (ci < 0 || ri < 0) return;
    const key = `${ci}:${ri}`;
    (plot.cells[key] = plot.cells[key] ?? []).push(b);
  });

  const dots: TerminalDot[] = [];
  Object.keys(plot.cells).forEach((key) => {
    const [ciRaw, riRaw] = key.split(":");
    const ci = Number(ciRaw);
    const ri = Number(riRaw);
    const list = plot.cells[key];
    const ccx = plot.x + plot.padL + plot.cw * ci + plot.cw / 2;
    const ccy = plot.y + plot.padT + plot.ch * ri + plot.ch / 2;
    const per = Math.max(1, Math.floor(Math.min(plot.cw - 26, 190) / 17));
    const rowCount = Math.ceil(list.length / per);
    list.forEach((b, index) => {
      const row = Math.floor(index / per);
      const col = index % per;
      const inRow = Math.min(per, list.length - row * per);
      const fund = funds.find((f) => f.buildings.includes(b))!;
      dots.push({
        x: ccx + (col - (inRow - 1) / 2) * 17,
        y: ccy + (row - (rowCount - 1) / 2) * 17,
        r: 5.6,
        fund,
        members: [b],
      });
    });
  });

  void lang;
  void c;
  return dots;
}

function drawTerminal(
  ctx: CanvasRenderingContext2D,
  s: { dots: TerminalDot[]; plot: PlotBox; w: number; h: number },
  funds: NetFund[],
  mode: Mode,
  railOn: boolean,
  c: (typeof COPY)["en"],
  lang: Lang,
) {
  const rail = railOn && s.w > 700;
  const plot = s.plot;

  if (mode === "geography") {
    ctx.strokeStyle = "rgba(142,160,196,.07)";
    ctx.lineWidth = 1;
    for (let gx = plot.x; gx < plot.x + plot.w; gx += 74) {
      ctx.beginPath();
      ctx.moveTo(gx, plot.y);
      ctx.lineTo(gx, plot.y + plot.h);
      ctx.stroke();
    }
    for (let gy = plot.y; gy < plot.y + plot.h; gy += 74) {
      ctx.beginPath();
      ctx.moveTo(plot.x, gy);
      ctx.lineTo(plot.x + plot.w, gy);
      ctx.stroke();
    }

    const byProvince: Record<string, { x: number; y: number }> = {};
    s.dots.forEach((d) => {
      const key = d.members[0].province;
      const g = byProvince[key] ?? (byProvince[key] = { x: Infinity, y: Infinity });
      g.x = Math.min(g.x, d.x - d.r);
      g.y = Math.min(g.y, d.y - d.r);
    });
    ctx.textAlign = "left";
    ctx.font = '600 10px "Manrope", system-ui, sans-serif';
    ctx.fillStyle = "rgba(142,160,196,.34)";
    Object.entries(byProvince).forEach(([name, g]) => {
      ctx.save();
      ctx.letterSpacing = "2px";
      ctx.fillText(name.toUpperCase(), g.x, Math.max(plot.y + 12, g.y - 14));
      ctx.restore();
    });
  } else {
    const all = funds.flatMap((f) => f.buildings);
    plot.cols.forEach((col, ci) => {
      const cx = plot.x + plot.padL + plot.cw * ci + plot.cw / 2;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(233,227,213,.8)";
      ctx.font = '600 10px "Manrope", system-ui, sans-serif';
      ctx.save();
      ctx.letterSpacing = "1.5px";
      const label =
        mode === "exposure"
          ? col.toUpperCase()
          : (c.conditions[col as keyof typeof c.conditions] ?? col).toUpperCase();
      ctx.fillText(label, cx, plot.y + 24);
      ctx.restore();

      const count = all.filter((b) =>
        mode === "exposure" ? b.province === col : b.condition === col,
      ).length;
      ctx.fillStyle = "rgba(142,160,196,.7)";
      ctx.font = '10px "Manrope", system-ui, sans-serif';
      ctx.fillText(`${count} ${count === 1 ? c.building : c.buildings}`, cx, plot.y + 39);

      if (ci > 0) {
        ctx.strokeStyle = "rgba(142,160,196,.10)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plot.x + plot.padL + plot.cw * ci, plot.y + 46);
        ctx.lineTo(plot.x + plot.padL + plot.cw * ci, plot.y + plot.h - 26);
        ctx.stroke();
      }
    });

    if (mode === "exposure") {
      // An empty cell is a finding, not a rendering slip — label it.
      ctx.textAlign = "center";
      plot.cols.forEach((_, ci) => {
        plot.rows.forEach((_row, ri) => {
          if (plot.cells[`${ci}:${ri}`]) return;
          ctx.fillStyle = "rgba(142,160,196,.30)";
          ctx.font = '11px "Manrope", system-ui, sans-serif';
          ctx.fillText(
            c.noExposure,
            plot.x + plot.padL + plot.cw * ci + plot.cw / 2,
            plot.y + plot.padT + plot.ch * ri + plot.ch / 2 + 4,
          );
        });
      });

      ctx.textAlign = "right";
      plot.rows.forEach((row, ri) => {
        const cy = plot.y + plot.padT + plot.ch * ri + plot.ch / 2;
        ctx.fillStyle = "rgba(233,227,213,.8)";
        ctx.font = '600 11px "Manrope", system-ui, sans-serif';
        ctx.fillText(row === "commercial" ? c.commercial : c.residential, plot.x + plot.padL - 18, cy);
        const count = all.filter((b) =>
          row === "commercial" ? isCommercial(b.assetClassId) : !isCommercial(b.assetClassId),
        ).length;
        ctx.fillStyle = "rgba(142,160,196,.7)";
        ctx.font = '10px "Manrope", system-ui, sans-serif';
        ctx.fillText(String(count), plot.x + plot.padL - 18, cy + 15);
      });
    }
  }

  s.dots.forEach((d) => {
    ctx.fillStyle = d.fund.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GROUND;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    if (d.members.length > 1) {
      ctx.fillStyle = GROUND;
      ctx.font = `700 ${d.members.length > 9 ? 9 : 10}px "Manrope", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(d.members.length), d.x, d.y);
      ctx.textBaseline = "alphabetic";
    }
  });

  const boxes = rail ? drawRail(ctx, funds, s.h, c, lang) : [];

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(142,160,196,.65)";
  ctx.font = '10px "Manrope", system-ui, sans-serif';
  ctx.fillText(
    mode === "geography" ? c.footGeography : mode === "exposure" ? c.footExposure : c.footCondition,
    (rail ? RAIL_W : 0) + 18,
    s.h - 14,
  );

  return boxes;
}

function drawRail(
  ctx: CanvasRenderingContext2D,
  funds: NetFund[],
  h: number,
  c: (typeof COPY)["en"],
  lang: Lang,
) {
  const boxes: { id: string; y0: number; y1: number }[] = [];
  ctx.fillStyle = "#0c1529";
  ctx.fillRect(0, 0, RAIL_W, h);
  ctx.strokeStyle = "#22304f";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RAIL_W + 0.5, 0);
  ctx.lineTo(RAIL_W + 0.5, h);
  ctx.stroke();

  let y = 18;
  funds.forEach((fund) => {
    if (y > h - 90) return;
    const top = y;
    ctx.textAlign = "left";

    ctx.fillStyle = fund.color;
    ctx.fillRect(16, y, 3, 13);
    ctx.fillStyle = INK;
    ctx.font = '700 12.5px "Manrope", system-ui, sans-serif';
    ctx.fillText(fund.short.toUpperCase(), 26, y + 11);
    y += 26;

    const pairs: [string, string][] = [];
    if (fund.aum) pairs.push([c.aum, fund.aum]);
    if (fund.unitPrice) pairs.push([c.unitPrice, `$${fund.unitPrice.toFixed(2)}`]);
    if (fund.unitsTotal) pairs.push([c.totalUnits, fmtNumber(fund.unitsTotal, lang)]);
    if (fund.distLabel) pairs.push([c.distributions, fund.distLabel]);
    if (fund.held) {
      pairs.push([c.yourUnits, fmtNumber(fund.units, lang)]);
      pairs.push([c.committed, fmtMoney(fund.committed, lang)]);
    }

    pairs.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const px = 16 + col * 116;
      const py = y + row * 30;
      ctx.fillStyle = "rgba(142,160,196,.65)";
      ctx.font = '9px "Manrope", system-ui, sans-serif';
      ctx.fillText(label.toUpperCase(), px, py);
      ctx.fillStyle = INK;
      ctx.font = '600 12px "Manrope", system-ui, sans-serif';
      ctx.fillText(value, px, py + 14);
    });
    y += Math.ceil(pairs.length / 2) * 30 + 6;

    // Each fund's series on its OWN scale. Managers publish on different period
    // bases (one quarterly, one annual); a shared axis would invent a
    // comparison neither of them made.
    if (fund.returns.length > 1) {
      const values = fund.returns.map((r) => r.value);
      const lo = Math.min(...values);
      const hi = Math.max(...values);
      const sx = 16;
      const sw = RAIL_W - 32;
      const sy = y;
      const sh = 32;

      ctx.fillStyle = "rgba(142,160,196,.65)";
      ctx.font = '9px "Manrope", system-ui, sans-serif';
      ctx.fillText(c.publishedReturns.toUpperCase(), sx, sy - 4);

      ctx.strokeStyle = "rgba(142,160,196,.16)";
      ctx.beginPath();
      ctx.moveTo(sx, sy + sh + 0.5);
      ctx.lineTo(sx + sw, sy + sh + 0.5);
      ctx.stroke();

      const points = fund.returns.map((r, index) => ({
        x: sx + (sw * index) / (fund.returns.length - 1),
        y: sy + sh - ((r.value - lo) / Math.max(0.001, hi - lo)) * (sh - 6) - 3,
      }));

      ctx.strokeStyle = fund.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach((p, index) => (index ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();

      points.forEach((p, index) => {
        const edge = index === 0 || index === points.length - 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, edge ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = edge ? fund.color : "rgba(233,227,213,.5)";
        ctx.fill();
      });

      const first = fund.returns[0];
      const last = fund.returns[fund.returns.length - 1];
      ctx.fillStyle = "rgba(142,160,196,.8)";
      ctx.font = '9.5px "Manrope", system-ui, sans-serif';
      ctx.fillText(`${first.period} ${first.value.toFixed(2)}%`, sx, sy + sh + 14);
      ctx.textAlign = "right";
      ctx.fillText(`${last.period} ${last.value.toFixed(2)}%`, sx + sw, sy + sh + 14);
      ctx.textAlign = "left";
      y += sh + 26;
    }

    const fresh = freshnessOf(fund, c);
    if (fresh && fund.periodLabel) {
      ctx.fillStyle = fresh.color;
      ctx.beginPath();
      ctx.arc(20, y + 4, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fresh.state === "current" ? "rgba(142,160,196,.85)" : fresh.color;
      ctx.font = '10px "Manrope", system-ui, sans-serif';
      ctx.fillText(`${c.asOf} ${fund.periodLabel} · ${fresh.label}`, 30, y + 8);
      y += 24;
    }

    ctx.strokeStyle = "#22304f";
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(RAIL_W - 16, y);
    ctx.stroke();
    y += 20;

    boxes.push({ id: fund.id, y0: top, y1: y - 20 });
  });

  return boxes;
}

function hitTerminal(
  s: {
    dots: TerminalDot[];
    rail: { id: string; y0: number; y1: number }[];
    w: number;
  },
  funds: NetFund[],
  x: number,
  y: number,
  railOn: boolean,
  c: (typeof COPY)["en"],
  lang: Lang,
): Tip | null {
  if (railOn && s.w > 700 && x < RAIL_W) {
    const box = s.rail.find((b) => y >= b.y0 && y <= b.y1);
    if (!box) return null;
    const fund = funds.find((f) => f.id === box.id);
    if (!fund) return null;
    const fresh = freshnessOf(fund, c);
    return {
      x: RAIL_W - 40,
      y: (box.y0 + box.y1) / 2,
      title: fund.name,
      lines: [fund.targetReturn, fund.targetDist].filter((v): v is string => Boolean(v)),
      note: [fund.periodLabel && `${c.asOf} ${fund.periodLabel}`, fresh?.label]
        .filter(Boolean)
        .join(" · "),
    };
  }

  let best: TerminalDot | null = null;
  let bestDistance = Infinity;
  s.dots.forEach((d) => {
    const distance = Math.hypot(d.x - x, d.y - y);
    if (distance < d.r + 6 && distance < bestDistance) {
      bestDistance = distance;
      best = d;
    }
  });
  if (!best) return null;

  const dot: TerminalDot = best;
  if (dot.members.length > 1) {
    const commercial = dot.members.filter((m) => isCommercial(m.assetClassId)).length;
    const mix = [
      commercial && `${commercial} ${c.commercial.toLowerCase()}`,
      dot.members.length - commercial &&
        `${dot.members.length - commercial} ${c.residential.toLowerCase()}`,
    ].filter(Boolean) as string[];
    return {
      x: dot.x,
      y: dot.y,
      title: dot.members[0].city,
      lines: [`${dot.members.length} ${c.sharingBlock}`, mix.join(" · ")],
      note: `${c.via} ${dot.fund.short}`,
    };
  }

  const building = dot.members[0];
  return {
    x: dot.x,
    y: dot.y,
    title: building.name,
    lines: [
      `${building.city}, ${building.province}`,
      `${isCommercial(building.assetClassId) ? c.commercial : c.residential} · ${
        c.conditions[building.condition as keyof typeof c.conditions] ?? building.condition
      }`,
      building.units ? `${fmtNumber(building.units, lang)} ${c.unitsLabel}` : c.unitsUnpublished,
    ],
    note: `${c.via} ${dot.fund.short}`,
  };
}
