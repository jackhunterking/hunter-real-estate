"use client";

/**
 * The asset network on a phone: the graph is the swipe.
 *
 * The desktop terminal puts three columns on screen at once, which on a narrow
 * screen collapses into one very long scroll — every stat, the graph, the tables
 * and the rollups stacked. Here the relationship graph keeps the left-to-right
 * order it already has (you → vehicle → market → asset) and each swipe frames
 * the next tier of it. The tier you came from bleeds in at the left margin and
 * the next bleeds out at the right, so the thread is never cut, and only that
 * tier's figures sit underneath.
 *
 * Encoding rules are the desktop's, unchanged: above the vehicle line edge
 * thickness is money (our own exact transaction record); below it thickness is a
 * COUNT of buildings, because allocating a vehicle's capital across its assets
 * would need a per-asset value the platform does not hold.
 *
 * Tiers with no members are dropped rather than drawn empty — an offering that
 * publishes no property list is a two-step swipe, not a four-step one with two
 * blank screens.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Lang } from "@/lib/equity-market/types";
import { provinceCode, type Building, type Vehicle } from "./asset-graph";
import type { TerminalTheme } from "./asset-network-theme";

export type MobileCopy = {
  you: string;
  vehicles: string;
  markets: string;
  buildings: string;
  committed: string;
  unitsHeld: string;
  positions: string;
  assetsBehind: string;
  marketCount: string;
  splitOfCapital: string;
  costBasisNote: string;
  units: string;
  shareOfCapital: string;
  buildingsLabel: string;
  targetReturn: string;
  targetDistribution: string;
  dataUpdates: string;
  aum: string;
  completeness: string;
  targetsNote: string;
  byMarket: string;
  byProvince: string;
  countsNote: string;
  all: string;
  showing: (n: number, total: number) => string;
  clear: string;
  none: string;
  scrollAll: (n: number) => string;
  scrolls: string;
  everyMonths: (n: number) => string;
  notPublished: string;
  unitsSuffix: string;
  verifyNote: string;
  residential: string;
  commercial: string;
};

type Tier = "you" | "vehicles" | "markets" | "buildings";
type Market = { city: string; province: string; vehicleId: string; items: Building[] };
type Node = {
  tier: number;
  x: number;
  y: number;
  yBand: number;
  yTall: number;
  r: number;
  kind: Tier;
  vehicle?: Vehicle;
  market?: Market;
  building?: Building;
};
type Edge = { a: Node; b: Node; w: number; colour: string };

const VIEW = 230;
const TALL = 400;
const ROW = 20;
/** Above this many members a tier cannot label everyone inside the shared band,
 *  so it gets a row each and its own scroll on its own screen. */
const CROWDED = 7;

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function money(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    style: "currency", currency: "CAD", maximumFractionDigits: 0,
  }).format(value);
}
function num(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA").format(value);
}
const isCommercial = (id: string) => id.toLowerCase().includes("commercial");

/** The manager's own mark. Both published wordmarks are dark-inked, so on the
 *  terminal ground they sit on a light plate — a partner's mark is not ours to
 *  recolour, and inverting it would misrepresent their brand. */
function Mark({ src, alt, h = 13 }: { src?: string; alt: string; h?: number }) {
  if (!src) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[3px] bg-[color:var(--t-plate)] px-[5px] py-[3px]"
      style={{ height: h + 6 }}
    >
      <Image src={src} alt={alt} width={120} height={h} className="w-auto" style={{ height: h }} unoptimized />
    </span>
  );
}

export function AssetNetworkMobile({
  vehicles, buildings, theme, lang, c, totalCommitted, totalUnits,
}: {
  vehicles: Vehicle[];
  buildings: Building[];
  theme: TerminalTheme;
  lang: Lang;
  c: MobileCopy;
  totalCommitted: number;
  totalUnits: number;
}) {
  const markets = useMemo<Market[]>(() => {
    const map = new Map<string, Market>();
    buildings.forEach((b) => {
      if (!map.has(b.city)) map.set(b.city, { city: b.city, province: b.province, vehicleId: b.vehicleId, items: [] });
      map.get(b.city)!.items.push(b);
    });
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [buildings]);

  const provinces = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => map.set(b.province, (map.get(b.province) ?? 0) + 1));
    return [...map.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
  }, [buildings]);

  // Drop tiers that have no members rather than drawing an empty screen.
  const steps = useMemo<{ id: Tier; label: string }[]>(() => {
    const list: { id: Tier; label: string }[] = [
      { id: "you", label: c.you },
      { id: "vehicles", label: c.vehicles },
    ];
    if (markets.length) list.push({ id: "markets", label: c.markets });
    if (buildings.length) list.push({ id: "buildings", label: c.buildings });
    return list;
  }, [c, markets.length, buildings.length]);

  // Every tier that cannot fit its labels in the band opens out on its own
  // screen — markets as well as buildings. Seven of thirteen markets were
  // rendering as unlabelled dots because only the assets tier could expand.
  const tallSteps = useMemo(() => {
    const set = new Set<number>();
    steps.forEach((s, i) => {
      if (s.id === "markets" && markets.length > CROWDED) set.add(i);
      if (s.id === "buildings" && buildings.length > CROWDED) set.add(i);
    });
    return set;
  }, [steps, markets.length, buildings.length]);

  const H = Math.max(VIEW, Math.max(markets.length, buildings.length) * ROW + 26);
  const BAND = (H - VIEW) / 2;

  const [step, setStep] = useState(0);
  // One filter, by vehicle — the tier above every screen that carries a list.
  // Province chips came out: province is an attribute of a market, not a level
  // of the graph, so filtering by it answered a different question than the
  // screen was asking.
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [openVehicles, setOpenVehicles] = useState<Set<string>>(new Set());

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<Record<string, HTMLImageElement>>({});

  const stateRef = useRef({ w: 0, offset: 0, target: 0, expand: 0, expandTo: 0, raf: 0, step: 0 });
  const dragRef = useRef<{ x: number; y: number; o: number; axis: null | "x" | "y" } | null>(null);
  const graphRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  const colourOf = useCallback(
    (id: string) => vehicles.find((v) => v.id === id)?.color ?? theme.ink2,
    [vehicles, theme.ink2],
  );

  /* ------------------------------------------------------------- geometry */
  const layout = useCallback(
    (w: number) => {
      const cx = (i: number) => i * w + w / 2;
      // Tiers other than the assets share one centred band. Letting the asset
      // column span the full height on every screen made the market tier fan out
      // to something four times its own height, and the edges crossed into a
      // tangle; inside the band they stay parallel.
      const band = (n: number, i: number, pad: number) =>
        BAND + VIEW * pad + VIEW * (1 - pad * 2) * (n === 1 ? 0.5 : i / (n - 1));
      const tall = (n: number, i: number) => 16 + (H - 32) * (n === 1 ? 0.5 : i / (n - 1));

      const nodes: Node[] = [];
      const edges: Edge[] = [];
      const at = (id: Tier) => steps.findIndex((s) => s.id === id);

      const you: Node = { tier: at("you"), x: cx(at("you")), y: H / 2, yBand: H / 2, yTall: H / 2, r: 9, kind: "you" };
      nodes.push(you);

      const vs = vehicles.map((v, i) => {
        const y = band(vehicles.length, i, 0.3);
        return { tier: at("vehicles"), x: cx(at("vehicles")), y, yBand: y, yTall: y, r: 8, kind: "vehicles" as const, vehicle: v };
      });
      nodes.push(...vs);
      // Above the vehicle line, thickness is money.
      vs.forEach((v) =>
        edges.push({
          a: you, b: v,
          w: 1.5 + (totalCommitted > 0 ? v.vehicle.committed / totalCommitted : 0) * 7,
          colour: v.vehicle.color,
        }),
      );

      let ms: Node[] = [];
      if (markets.length) {
        ms = markets.map((m, i) => {
          const y = band(markets.length, i, 0.08);
          return {
            tier: at("markets"), x: cx(at("markets")), y,
            yBand: y, yTall: tall(markets.length, i),
            r: 3.4, kind: "markets" as const, market: m,
          };
        });
        nodes.push(...ms);
        // Below the vehicle line, thickness is a count of buildings.
        ms.forEach((m) => {
          const parent = vs.find((v) => v.vehicle.id === m.market!.vehicleId);
          if (parent) edges.push({ a: parent, b: m, w: 0.6 + m.market!.items.length * 0.28, colour: colourOf(m.market!.vehicleId) });
        });
      }

      if (buildings.length) {
        let i = 0;
        const bs: Node[] = [];
        markets.forEach((m) =>
          m.items.forEach((b) => {
            const k = i++;
            bs.push({
              tier: at("buildings"), x: cx(at("buildings")),
              yBand: band(buildings.length, k, 0.05), yTall: tall(buildings.length, k),
              y: band(buildings.length, k, 0.05), r: 3, kind: "buildings", building: b,
            });
          }),
        );
        nodes.push(...bs);
        bs.forEach((b) => {
          const parent = ms.find((m) => m.market!.city === b.building!.city);
          if (parent) edges.push({ a: parent, b, w: 0.5, colour: colourOf(b.building!.vehicleId) });
        });
      }

      graphRef.current = { nodes, edges };
    },
    [BAND, H, buildings.length, colourOf, markets, steps, totalCommitted, vehicles],
  );

  /* ---------------------------------------------------------------- paint */
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const raw = canvas?.getContext("2d");
    const st = stateRef.current;
    if (!canvas || !raw || st.w < 2) return;
    const ctx: CanvasRenderingContext2D = raw;
    const w = st.w;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, 0, w, H);

    const { nodes, edges } = graphRef.current;
    // Only the tier in frame opens out; its neighbours stay in the band so the
    // edges between them keep running parallel instead of crossing.
    nodes.forEach((n) => {
      n.y = n.tier === st.step ? n.yBand + (n.yTall - n.yBand) * st.expand : n.yBand;
    });

    ctx.save();
    ctx.translate(-st.offset, 0);

    ctx.strokeStyle = theme.ruleSoft;
    ctx.lineWidth = 1;
    steps.forEach((_s, i) => {
      const x = Math.round(i * w + w / 2) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x, H - 8);
      ctx.stroke();
    });

    // A vehicle filter dims the rest of the graph too, so the picture and the
    // list underneath never disagree about what is being looked at.
    const muted = (n: Node) =>
      !!vehicleFilter &&
      (n.kind === "vehicles" ? n.vehicle!.id !== vehicleFilter
        : n.kind === "markets" ? n.market!.vehicleId !== vehicleFilter
        : n.kind === "buildings" ? n.building!.vehicleId !== vehicleFilter
        : false);

    edges.forEach((e) => {
      const dim = (e.a.tier !== st.step && e.b.tier !== st.step) || muted(e.a) || muted(e.b);
      ctx.strokeStyle = rgba(e.colour, dim ? 0.16 : 0.5);
      ctx.lineWidth = e.w;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      const mx = (e.a.x + e.b.x) / 2;
      ctx.bezierCurveTo(mx, e.a.y, mx, e.b.y, e.b.x, e.b.y);
      ctx.stroke();
    });

    nodes.forEach((n) => {
      const on = n.tier === st.step && !muted(n);
      const colour =
        n.kind === "you" ? theme.accent
        : n.kind === "vehicles" ? n.vehicle!.color
        : n.kind === "markets" ? colourOf(n.market!.vehicleId)
        : colourOf(n.building!.vehicleId);
      if (n.kind === "buildings" && n.building!.verification !== "verified") {
        ctx.strokeStyle = rgba(colour, on ? 1 : 0.3);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = rgba(colour, on ? 1 : 0.3);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    });

    ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = "middle";
    const plate = (text: string, x: number, y: number) => {
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = rgba(theme.ground, 0.82);
      ctx.fillRect(x - 3, y - 6.5, tw + 6, 13);
      ctx.fillStyle = theme.ink2;
      ctx.textAlign = "left";
      ctx.fillText(text, x, y);
    };
    const room = w / 2 - 26;
    nodes
      .filter((n) => n.tier === st.step)
      .forEach((n) => {
        if (n.kind === "you") plate(c.you.toUpperCase(), n.x - 11, n.y - 20);
        else if (n.kind === "vehicles") {
          // The fund tier carries the manager's mark rather than an abbreviation.
          const img = n.vehicle!.logo ? logoRef.current[n.vehicle!.id] : undefined;
          if (img?.complete && img.naturalWidth) {
            const h = 11;
            const iw = h * (img.naturalWidth / img.naturalHeight);
            ctx.fillStyle = theme.plate;
            ctx.beginPath(); ctx.roundRect(n.x + 13, n.y - h / 2 - 3, iw + 8, h + 6, 2.5); ctx.fill();
            ctx.drawImage(img, n.x + 17, n.y - h / 2, iw, h);
          } else {
            plate(n.vehicle!.short, n.x + 13, n.y);
          }
        } else if (n.kind === "markets" && !muted(n)) {
          // Once opened out every market is named; inside the band only the
          // largest fit, which is what left the rest as anonymous dots.
          if (st.expand > 0.55 || n.market!.items.length >= 3) {
            // "North Battleford, Saskatchewan" cannot fit beside a node, so the
            // canvas carries the code and the list underneath spells it out.
            const place = `${n.market!.city}, ${provinceCode(n.market!.province)}`;
            let t = `${place} ${n.market!.items.length}`;
            while (t.length > 4 && ctx.measureText(t).width > room) t = t.slice(0, -1);
            plate(t, n.x + 8, n.y);
          }
        } else if (n.kind === "buildings" && st.expand > 0.55 && !muted(n)) {
          // Every building gets its address here — the reason this tier is
          // allowed to be taller than the others.
          let t = n.building!.name;
          while (t.length > 4 && ctx.measureText(t).width > room) t = t.slice(0, -1);
          if (t !== n.building!.name) t = `${t.slice(0, -1)}…`;
          plate(t, n.x + 9, n.y);
        }
      });
    ctx.textAlign = "left";
    ctx.restore();
  }, [H, c.you, colourOf, steps, theme, vehicleFilter]);

  const tick = useCallback(() => {
    const st = stateRef.current;
    st.raf = 0;
    st.offset += (st.target - st.offset) * 0.22;
    if (Math.abs(st.target - st.offset) < 0.4) st.offset = st.target;
    st.expand += (st.expandTo - st.expand) * 0.16;
    if (Math.abs(st.expandTo - st.expand) < 0.004) st.expand = st.expandTo;
    if (stripRef.current) stripRef.current.style.transform = `translateX(${-st.offset}px)`;
    paint();
    if (st.offset !== st.target || st.expand !== st.expandTo) st.raf = requestAnimationFrame(tick);
  }, [paint]);

  const kick = useCallback(() => {
    const st = stateRef.current;
    if (!st.raf) st.raf = requestAnimationFrame(tick);
  }, [tick]);

  const goTo = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(steps.length - 1, i));
      const st = stateRef.current;
      st.step = next;
      st.target = next * st.w;
      st.expandTo = tallSteps.has(next) ? 1 : 0;
      setStep(next);
      kick();
    },
    [kick, steps.length, tallSteps],
  );

  /* Preload the marks so the first paint of the vehicle tier has them. */
  useEffect(() => {
    vehicles.forEach((v) => {
      if (!v.logo || logoRef.current[v.id]) return;
      const img = new window.Image();
      img.onload = () => paint();
      img.src = v.logo;
      logoRef.current[v.id] = img;
    });
  }, [vehicles, paint]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      const st = stateRef.current;
      if (w < 2) return;
      // Re-laying out only on a width change meant a re-observed element never
      // painted, and the canvas fell back to its intrinsic 2:1 ratio — 1612px
      // wide inside a 374px phone.
      if (w === st.w) { paint(); return; }
      st.w = w;
      layout(w);
      st.target = st.step * w;
      st.offset = st.target;
      st.expand = st.expandTo = tallSteps.has(st.step) ? 1 : 0;
      if (stripRef.current) {
        stripRef.current.style.width = `${steps.length * w}px`;
        stripRef.current.style.transform = `translateX(${-st.offset}px)`;
      }
      if (scrollRef.current) scrollRef.current.scrollTop = tallSteps.has(st.step) ? 0 : BAND;
      paint();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [BAND, layout, paint, steps.length, tallSteps]);

  // The scroller's height and position follow the step: only the asset tier
  // needs the extra room, and the others sit centred on the shared band.
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const tall = tallSteps.has(step);
    sc.style.height = `${tall ? TALL : VIEW}px`;
    sc.style.overflowY = tall ? "auto" : "hidden";
    sc.scrollTop = tall ? 0 : BAND;
  }, [step, tallSteps, BAND]);

  useEffect(() => () => { if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf); }, []);

  /* ------------------------------------------------------------ gestures */
  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY, o: stateRef.current.offset, axis: null };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    const st = stateRef.current;
    if (!d) return;
    const dx = d.x - e.clientX;
    const dy = d.y - e.clientY;
    // Lock the gesture to one axis on the first few pixels. Without it, reading
    // down the asset list dragged the pager sideways at the same time.
    if (!d.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (d.axis === "y") return;
    st.offset = Math.max(-40, Math.min((steps.length - 1) * st.w + 40, d.o + dx));
    if (stripRef.current) stripRef.current.style.transform = `translateX(${-st.offset}px)`;
    paint();
  }
  function onPointerUp() {
    const d = dragRef.current;
    const st = stateRef.current;
    dragRef.current = null;
    if (!d || d.axis !== "x") return;
    const moved = st.offset - d.o;
    if (Math.abs(moved) > st.w * 0.18) goTo(st.step + (moved > 0 ? 1 : -1));
    else goTo(st.step);
  }

  /* -------------------------------------------------------------- filters */
  const rule = "border-b border-[color:var(--t-rule-soft)]";
  const headBg = "bg-[color:var(--t-head)]";

  const shownVehicles = useMemo(
    () => (vehicleFilter ? vehicles.filter((v) => v.id === vehicleFilter) : vehicles),
    [vehicles, vehicleFilter],
  );
  const shownMarkets = useMemo(
    () => (vehicleFilter ? markets.filter((m) => m.vehicleId === vehicleFilter) : markets),
    [markets, vehicleFilter],
  );
  const shown = useMemo(
    () => (vehicleFilter ? buildings.filter((b) => b.vehicleId === vehicleFilter) : buildings),
    [buildings, vehicleFilter],
  );

  /** The filter row, repeated on every screen that lists something. */
  const FilterRow = ({ total, count }: { total: number; count: number }) => (
    <>
      <div className={`flex gap-1.5 overflow-x-auto bg-[color:var(--t-panel)] px-[13px] py-2.5 [scrollbar-width:none] ${rule} [&::-webkit-scrollbar]:hidden`}>
        {[{ id: "", label: c.all, logo: undefined as string | undefined }, ...vehicles.map((v) => ({ id: v.id, label: v.short, logo: v.logo }))].map((f) => {
          const on = f.id === vehicleFilter;
          return (
            <button
              key={f.id || "all"}
              type="button"
              onClick={() => setVehicleFilter(f.id)}
              aria-pressed={on}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border px-2.5 py-1 text-[10px] ${
                on
                  ? "border-[color:var(--t-ink)] bg-[color:var(--t-ink)] text-[color:var(--t-ground)]"
                  : "border-[color:var(--t-rule)] text-[color:var(--t-ink-2)]"
              }`}
            >
              {f.logo && !on && <Mark src={f.logo} alt="" h={10} />}
              {f.label}
            </button>
          );
        })}
      </div>
      <div className={`flex items-center gap-2 px-[13px] py-[7px] text-[9.5px] uppercase tracking-[0.09em] text-[color:var(--t-ink-3)] ${rule}`}>
        {c.showing(count, total)}
        {vehicleFilter && (
          <button type="button" onClick={() => setVehicleFilter("")} className="ml-auto text-[color:var(--t-accent)]">
            {c.clear}
          </button>
        )}
      </div>
    </>
  );

  const Stat = ({ k, v, hero }: { k: string; v: string; hero?: boolean }) => (
    <div className={`flex items-baseline justify-between gap-3 px-[13px] py-2.5 ${rule}`}>
      <span className="text-[9.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)]">{k}</span>
      <span className={hero ? "text-[22px]" : "text-[15px]"}>{v}</span>
    </div>
  );
  const Group = ({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) => (
    <div className={`flex items-center gap-2 border-t border-[color:var(--t-rule)] px-[13px] py-2 text-[9.5px] uppercase tracking-[0.11em] text-[color:var(--t-ink-3)] ${headBg} ${rule}`}>
      <span className="flex min-w-0 items-center gap-2">{left}</span>
      <span className="ml-auto shrink-0">{right}</span>
    </div>
  );
  const Bar = ({ label, right, frac, colour }: { label: React.ReactNode; right: string; frac: number; colour: string }) => (
    <div className={`px-[13px] py-2.5 ${rule}`}>
      <div className="flex items-center gap-2">
        <span className="flex min-w-0 items-center gap-2">{label}</span>
        <span className="ml-auto shrink-0 text-[color:var(--t-ink-2)]">{right}</span>
      </div>
      <div className="mt-1.5 h-[3px] bg-[color:var(--t-track)]">
        <i className="block h-[3px]" style={{ width: `${(frac * 100).toFixed(1)}%`, background: colour }} />
      </div>
    </div>
  );
  // The value wraps rather than running off the edge: a published target is a
  // sentence ("Up to 8.2% preferential return a year, paid quarterly"), not a
  // figure, and it was overflowing the panel on a phone.
  const Row = ({ a, b }: { a: string; b: string }) => (
    <div className={`flex justify-between gap-3 px-[13px] py-[7px] ${rule}`}>
      <span className="shrink-0 text-[color:var(--t-ink-2)]">{a}</span>
      <span className="min-w-0 text-right">{b}</span>
    </div>
  );

  /** Two lines: the address owns the first, its metadata the second. On one line
   *  every name past ~18 characters was truncated with an ellipsis. */
  const AssetRow = ({ b }: { b: Building }) => (
    <div className={`px-[13px] py-2 ${rule}`}>
      <div className="flex items-start gap-[7px] leading-[1.35]">
        <i
          className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
          style={
            b.verification === "verified"
              ? { background: colourOf(b.vehicleId) }
              : { boxShadow: `inset 0 0 0 1.5px ${colourOf(b.vehicleId)}` }
          }
        />
        <span className="min-w-0 flex-1">{b.name}</span>
        <span className="shrink-0 pt-0.5 text-[10.5px] text-[color:var(--t-ink-3)]">
          {b.units != null ? `${num(b.units, lang)} ${c.unitsSuffix}` : "—"}
        </span>
      </div>
      <div className="ml-[13px] mt-0.5 text-[10.5px] text-[color:var(--t-ink-3)]">
        {b.city}, {b.province} · {isCommercial(b.assetClassId) ? c.commercial : c.residential}
      </div>
    </div>
  );

  const cards: React.ReactNode[] = steps.map((s) => {
    if (s.id === "you") {
      return (
        <>
          <Stat k={c.committed} v={money(totalCommitted, lang)} hero />
          <Stat k={c.unitsHeld} v={totalUnits > 0 ? num(totalUnits, lang) : "—"} />
          <Stat k={c.positions} v={String(vehicles.filter((v) => v.held).length)} />
          {buildings.length > 0 && <Stat k={c.assetsBehind} v={String(buildings.length)} />}
          {markets.length > 0 && <Stat k={c.marketCount} v={String(markets.length)} />}
          <Group left={c.splitOfCapital} />
          {vehicles.map((v) => (
            <Bar
              key={v.id}
              label={<><Mark src={v.logo} alt={v.short} /><span className="truncate">{v.short}</span></>}
              right={`${money(v.committed, lang)}  ${totalCommitted > 0 ? ((v.committed / totalCommitted) * 100).toFixed(1) : "0.0"}%`}
              frac={totalCommitted > 0 ? v.committed / totalCommitted : 0}
              colour={v.color}
            />
          ))}
          <p className="px-[13px] py-2.5 text-[9.5px] leading-[1.6] text-[color:var(--t-ink-faint)]">{c.costBasisNote}</p>
        </>
      );
    }
    if (s.id === "vehicles") {
      return (
        <>
          <FilterRow total={vehicles.length} count={shownVehicles.length} />
          {shownVehicles.map((v) => {
            const open = openVehicles.has(v.id);
            return (
            <div key={v.id}>
              {/* Collapsible: two funds at nine rows each is a long scroll, and
                  the header alone answers "how much and what share". */}
              <button
                type="button"
                onClick={() =>
                  setOpenVehicles((prev) => {
                    const next = new Set(prev);
                    if (next.has(v.id)) next.delete(v.id);
                    else next.add(v.id);
                    return next;
                  })
                }
                aria-expanded={open}
                className={`flex w-full items-center gap-2 border-t border-[color:var(--t-rule)] px-[13px] py-2.5 text-left ${headBg} ${rule}`}
              >
                <Mark src={v.logo} alt={v.short} h={17} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] text-[color:var(--t-ink)]">{v.short}</span>
                  <span className="block truncate text-[9.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)]">
                    {money(v.committed, lang)}
                    {totalCommitted > 0 ? ` · ${((v.committed / totalCommitted) * 100).toFixed(1)}%` : ""}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-[color:var(--t-ink-3)]">{open ? "−" : "+"}</span>
              </button>
              {open && (
              <>
              <Row a={c.committed} b={money(v.committed, lang)} />
              {v.units != null && (
                <Row a={c.units} b={v.unitPrice ? `${num(v.units, lang)} @ $${v.unitPrice.toFixed(2)}` : num(v.units, lang)} />
              )}
              <Row a={c.shareOfCapital} b={totalCommitted > 0 ? `${((v.committed / totalCommitted) * 100).toFixed(1)}%` : "—"} />
              <Row a={c.buildingsLabel} b={String(v.buildings.length)} />
              {v.targetReturn && <Row a={c.targetReturn} b={v.targetReturn} />}
              {v.targetDistribution && <Row a={c.targetDistribution} b={v.targetDistribution} />}
              {v.aum && <Row a={c.aum} b={v.aum} />}
              {/* `cadenceMonths` comes from `updateCadence`, which is how often the
                  manager republishes FIGURES — not how often distributions are
                  paid. It belongs beside the as-of date, never under a heading
                  that would read as an income schedule. */}
              <Row
                a={c.completeness}
                b={`${v.completeness}%${v.dataAsOf ? ` · ${v.dataAsOf}` : ""}`}
              />
              {v.cadenceMonths != null && (
                <Row a={c.dataUpdates} b={c.everyMonths(v.cadenceMonths)} />
              )}
              </>
              )}
            </div>
            );
          })}
          <p className="px-[13px] py-2.5 text-[9.5px] leading-[1.6] text-[color:var(--t-ink-faint)]">{c.targetsNote}</p>
        </>
      );
    }
    if (s.id === "markets") {
      const top = shownMarkets[0]?.items.length ?? 1;
      const shownProvinces = vehicleFilter
        ? (() => {
            const map = new Map<string, number>();
            shown.forEach((b) => map.set(b.province, (map.get(b.province) ?? 0) + 1));
            return [...map.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
          })()
        : provinces;
      const topProv = shownProvinces[0]?.n ?? 1;
      return (
        <>
          <FilterRow total={markets.length} count={shownMarkets.length} />
          <Group left={c.byMarket} right={`${shownMarkets.length} · ${c.scrolls}`} />
          <div className="max-h-[430px] overflow-y-auto">
            {shownMarkets.map((m) => (
              <Bar
                key={m.city}
                label={
                  <>
                    <Mark src={vehicles.find((v) => v.id === m.vehicleId)?.logo} alt="" />
                    <span className="truncate">
                      {m.city}
                      <span className="text-[color:var(--t-ink-3)]">, {m.province}</span>
                    </span>
                  </>
                }
                right={String(m.items.length)}
                frac={m.items.length / top}
                colour={colourOf(m.vehicleId)}
              />
            ))}
          </div>
          <Group left={c.byProvince} right={String(shownProvinces.length)} />
          {shownProvinces.map((p) => (
            <Bar key={p.k} label={<span className="truncate">{p.k}</span>} right={String(p.n)} frac={p.n / topProv} colour={theme.accent} />
          ))}
          <p className="px-[13px] py-2.5 text-[9.5px] leading-[1.6] text-[color:var(--t-ink-faint)]">{c.countsNote}</p>
        </>
      );
    }
    // buildings
    const groups = vehicles
      .map((v) => ({ v, items: shown.filter((b) => b.vehicleId === v.id) }))
      .filter((g) => g.items.length > 0);
    return (
      <>
        <FilterRow total={buildings.length} count={shown.length} />
        {shown.length === 0 ? (
          <p className="px-[13px] py-6 text-center text-[11px] text-[color:var(--t-ink-3)]">{c.none}</p>
        ) : (
          <div className="max-h-[430px] overflow-y-auto">
            {groups.map((g) => (
              <div key={g.v.id}>
                {/* Sticky, so scrolling never loses whose building you are on. */}
                <div className={`sticky top-0 z-[2] flex items-center gap-2 px-[13px] py-1.5 text-[9px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)] ${headBg} ${rule}`}>
                  <Mark src={g.v.logo} alt={g.v.short} />
                  <span className="truncate">{g.v.short}</span>
                  <span className="ml-auto shrink-0">{g.items.length}</span>
                </div>
                {g.items.map((b) => <AssetRow key={b.id} b={b} />)}
              </div>
            ))}
          </div>
        )}
        <p className="px-[13px] py-2.5 text-[9.5px] leading-[1.6] text-[color:var(--t-ink-faint)]">{c.verifyNote}</p>
      </>
    );
  });

  return (
    <div className="font-mono text-[12px] tabular-nums">
      {/* step bar — where you are, and how far through */}
      <div className={`flex items-center gap-2 border-b border-[color:var(--t-rule)] bg-[color:var(--t-panel)] px-[13px] py-2.5`}>
        <span className="text-[10px] uppercase tracking-[0.13em]">{steps[step]?.label}</span>
        <span className="text-[9.5px] text-[color:var(--t-ink-faint)]">
          {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
        <span className="ml-auto flex gap-[5px]">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              title={s.label}
              className="h-[3px] w-4"
              style={{ background: i === step ? theme.accent : theme.track }}
            />
          ))}
        </span>
      </div>

      <div ref={wrapRef} className="relative border-b border-[color:var(--t-rule)]">
        <div
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onScroll={() => { if (tallSteps.has(step)) paint(); }}
          className="touch-pan-y overflow-x-hidden"
          style={{ height: VIEW }}
        >
          {/* width and display are set inline, not by class: a canvas with no
              CSS width falls back to the aspect ratio of its backing store, so
              a missed paint would blow the element out to 1612px. */}
          <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: H }} />
        </div>
        {/* Edge hints sit outside the scroller: absolute children of a scroller
            travel with it, and these must stay put. */}
        {step > 0 && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-[74px] items-center pl-2 text-[8.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)]"
            style={{ background: `linear-gradient(90deg, ${theme.ground} 22%, transparent)` }}>
            ◂ {steps[step - 1].label}
          </div>
        )}
        {step < steps.length - 1 && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[74px] items-center justify-end pr-2 text-right text-[8.5px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)]"
            style={{ background: `linear-gradient(270deg, ${theme.ground} 22%, transparent)` }}>
            {steps[step + 1].label} ▸
          </div>
        )}
        {tallSteps.has(step) && (
          <div className="pointer-events-none absolute bottom-1.5 left-2 bg-[color:var(--t-ground)] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] text-[color:var(--t-ink-3)] opacity-90">
            {c.scrollAll(steps[step].id === "markets" ? markets.length : buildings.length)}
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div ref={stripRef} className="flex">
          {cards.map((card, i) => (
            <div key={steps[i].id} className="min-w-0 shrink-0 grow-0 overflow-hidden" style={{ flexBasis: stateRef.current.w || "100%" }}>
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
