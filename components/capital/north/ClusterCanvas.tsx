"use client";

/**
 * The three cluster renderers, drawn on one canvas each.
 *
 * They share the rule the terminal was scoped to: above the vehicle line a
 * figure may be money, below it a figure is a COUNT. The platform holds no
 * per-asset value, so nothing here allocates capital across buildings.
 *
 * Every dot is the same size on purpose. Only a minority of buildings publish a
 * suite count and none publish a value, so a varying radius would encode a
 * field we mostly do not have — decoration wearing the costume of data. One
 * dot, one building.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Building, Vehicle } from "./asset-graph";
import type { TerminalTheme } from "./asset-network-theme";

export type ClusterView = "cloud" | "orbit" | "lens";

export type Dot = Building & {
  vehicle: Vehicle;
  /** Live position, tweened by the lens between groupings. */
  x: number;
  y: number;
  px: number;
  py: number;
  fx: number;
  fy: number;
};

export type Grouping = { id: string; label: string; key: (d: Dot) => string };

/* ------------------------------------------------------------------ helpers */

function alpha(color: string, a: number) {
  const h = color.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return color;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Deterministic jitter — a redraw must never reshuffle the field. */
function rnd(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, step: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = step; x < w; x += step) {
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, h);
  }
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(w, Math.round(y) + 0.5);
  }
  ctx.stroke();
}

/** One dot, one building. Hollow when verification is anything but verified. */
function drawDot(ctx: CanvasRenderingContext2D, d: Dot, r: number, color: string, dim: boolean, ring: boolean, ink: string) {
  if (d.verification !== "verified") {
    ctx.strokeStyle = alpha(color, dim ? 0.32 : 1);
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = alpha(color, dim ? 0.26 : 0.95);
    ctx.beginPath();
    ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (ring) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

type Blob = { key: string; items: Dot[]; x: number; y: number; r: number; lng: number };

/* -------------------------------------------------------------------- cloud */

/**
 * Blobs per group, ordered west to east.
 *
 * True coordinates were the first attempt and left most of the frame empty —
 * every prairie market lands in one corner and the Ontario ones in the other.
 * Geography therefore survives as reading ORDER, and the blobs are packed to
 * fill the canvas. Order is true; distance across the frame is not, which is
 * why this is never labelled a map.
 */
function layoutCloud(dots: Dot[], group: Grouping, w: number, h: number) {
  const map = new Map<string, Dot[]>();
  dots.forEach((d) => {
    const k = group.key(d);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(d);
  });

  const blobs: Blob[] = [...map.entries()].map(([key, items]) => ({
    key,
    items,
    x: 0,
    y: 0,
    r: 16 + 11 * Math.sqrt(items.length),
    lng: items.reduce((s, d) => s + d.longitude, 0) / items.length,
  }));
  blobs.sort((a, b) => a.lng - b.lng);

  // Shrink the field to the frame it actually has. Sized for a desktop canvas,
  // the largest blob is wider than a phone's grid cell and the relaxation pass
  // ends up shoving every cluster into one corner.
  const area = blobs.reduce((s, g) => s + Math.PI * g.r * g.r, 0);
  const shrink = Math.min(1, Math.sqrt((0.2 * w * h) / Math.max(1, area)));
  blobs.forEach((g) => {
    g.r *= shrink;
  });
  const dotR = Math.max(2.8, 5 * shrink);

  const n = blobs.length;
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * (w / Math.max(1, h))))));
  // Spread the remainder across the leading columns rather than dumping what is
  // left into the last one, which leaves that side of the frame empty.
  const base = Math.floor(n / cols);
  const extra = n % cols;
  const counts = Array.from({ length: cols }, (_, i) => base + (i < extra ? 1 : 0));
  const cellW = w / cols;
  let gi = 0;
  counts.forEach((cnt, col) => {
    for (let row = 0; row < cnt; row++, gi++) {
      const g = blobs[gi];
      const r = rnd(gi * 13 + 7);
      g.x = (col + 0.5) * cellW + (r() - 0.5) * cellW * 0.2;
      g.y = ((row + 0.5) / cnt) * h + (col % 2 ? 1 : -1) * (h / cnt) * 0.1 + (r() - 0.5) * 14;
    }
  });

  for (let pass = 0; pass < 320; pass++) {
    for (let a = 0; a < blobs.length; a++) {
      for (let b = a + 1; b < blobs.length; b++) {
        const A = blobs[a];
        const B = blobs[b];
        let dx = B.x - A.x;
        let dy = B.y - A.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const want = A.r + B.r + 30;
        if (dist < want) {
          const push = ((want - dist) / dist) * 0.5;
          dx *= push;
          dy *= push;
          A.x -= dx;
          A.y -= dy;
          B.x += dx;
          B.y += dy;
        }
      }
    }
    blobs.forEach((g) => {
      g.x = Math.max(g.r + 10, Math.min(w - g.r - 10, g.x));
      g.y = Math.max(g.r + 26, Math.min(h - g.r - 14, g.y));
    });
  }

  blobs.forEach((g, i) => {
    const cnt = g.items.length;
    const r = rnd(i * 31 + 3);
    g.items.forEach((d, k) => {
      const a = k * 2.39996;
      const rad = cnt === 1 ? 0 : (g.r - dotR - 2) * Math.sqrt((k + 0.55) / cnt);
      d.x = g.x + Math.cos(a) * rad + (r() - 0.5) * dotR;
      d.y = g.y + Math.sin(a) * rad + (r() - 0.5) * dotR;
    });
  });

  return { blobs, dotR };
}

function paintCloud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  blobs: Blob[],
  dotR: number,
  theme: TerminalTheme,
  colorOf: (d: Dot) => string,
  hot: Blob | null,
  lineBoost: number,
) {
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h, theme.ruleSoft, w < 620 ? 46 : 62);

  // Bridges: each cluster to its two nearest clusters held through the same
  // vehicle. Every same-vehicle pair sprays lines across the frame and says
  // nothing extra, so the degree is capped at two and fades with length.
  const diag = Math.hypot(w, h);
  ctx.lineWidth = 1;
  blobs.forEach((A) => {
    const funds = new Set(A.items.map((d) => d.vehicleId));
    const near = blobs
      .filter((B) => B !== A && B.items.some((d) => funds.has(d.vehicleId)))
      .map((B) => ({ B, d: Math.hypot(B.x - A.x, B.y - A.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    near.forEach(({ B, d }) => {
      const shared = B.items.find((x) => funds.has(x.vehicleId));
      if (!shared) return;
      const reach = Math.max(0.25, 1 - (d / diag) * 1.5);
      ctx.strokeStyle = alpha(colorOf(shared), (hot && hot !== A && hot !== B ? 0.05 : 0.2) * reach * lineBoost);
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      ctx.quadraticCurveTo(mx + (A.y - B.y) * 0.1, my + (B.x - A.x) * 0.1, B.x, B.y);
      ctx.stroke();
    });
  });

  blobs.forEach((g) => {
    const dim = !!hot && hot !== g;
    const color = colorOf(g.items[0]);
    ctx.strokeStyle = alpha(color, (dim ? 0.08 : 0.3) * lineBoost);
    ctx.lineWidth = 1;
    ctx.beginPath();
    g.items.forEach((d, k) => {
      for (let n = k + 1; n < Math.min(k + 4, g.items.length); n++) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(g.items[n].x, g.items[n].y);
      }
    });
    ctx.stroke();

    if (g.items.length > 2) {
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r + 12);
      grd.addColorStop(0, alpha(color, dim ? 0.05 : 0.13));
      grd.addColorStop(1, alpha(color, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r + 12, 0, Math.PI * 2);
      ctx.fill();
    }
    g.items.forEach((d) => drawDot(ctx, d, dotR, colorOf(d), dim, false, theme.ink));
  });

  // Count chips. The number is a count of dots you can see, never a synthetic
  // figure. Placed by trying each side and taking the first slot that is clear
  // of other chips and of other clusters' dots.
  ctx.font = '600 10.5px ui-sans-serif, system-ui, sans-serif';
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const taken: { x: number; y: number; w: number; h: number }[] = [];
  const narrow = w < 360;
  [...blobs]
    .sort((a, b) => b.items.length - a.items.length)
    .forEach((g) => {
      const dim = !!hot && hot !== g;
      if (narrow && g.items.length < 2 && hot !== g) return;
      const label = `${g.key}  ${g.items.length}`;
      const tw = ctx.measureText(label).width + 11;
      const th = 17;
      const slots: [number, number][] = [
        [g.x - tw / 2, g.y - g.r - 22],
        [g.x - tw / 2, g.y + g.r + 5],
        [g.x + g.r + 5, g.y - th / 2],
        [g.x - g.r - tw - 5, g.y - th / 2],
        [g.x - tw / 2, g.y - g.r - 40],
        [g.x - tw / 2, g.y + g.r + 23],
      ];
      let box: { x: number; y: number; w: number; h: number } | null = null;
      for (const [sx, sy] of slots) {
        const r = {
          x: Math.max(2, Math.min(w - tw - 2, sx)),
          y: Math.max(2, Math.min(h - th - 2, sy)),
          w: tw,
          h: th,
        };
        const clearOfChips = !taken.some(
          (t) => r.x < t.x + t.w + 3 && t.x < r.x + r.w + 3 && r.y < t.y + t.h + 2 && t.y < r.y + r.h + 2,
        );
        const clearOfDots = !blobs.some(
          (o) =>
            o !== g &&
            o.items.some(
              (d) => d.x > r.x - dotR && d.x < r.x + r.w + dotR && d.y > r.y - dotR && d.y < r.y + r.h + dotR,
            ),
        );
        if (clearOfChips && clearOfDots) {
          box = r;
          break;
        }
      }
      // Better a missing chip than an illegible pile of them.
      if (!box) return;
      taken.push(box);
      ctx.fillStyle = alpha(theme.ink, dim ? 0.05 : 0.11);
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, tw, th, 3);
      ctx.fill();
      ctx.fillStyle = dim ? theme.ink3 : theme.ink;
      ctx.fillText(label, box.x + 5.5, box.y + th / 2 + 0.5);
    });
}

/* -------------------------------------------------------------------- orbit */

type Wedge = { vehicle: Vehicle; a0: number; a1: number; capT: number; provs: { key: string; items: Dot[]; a0: number; a1: number }[] };

/**
 * Wedge width is the vehicle's share of BUILDINGS; band thickness is its share
 * of capital.
 *
 * Splitting the circle by capital instead was the first attempt and read as
 * arbitrary — a vehicle with few buildings got most of the belt, and its dots
 * scattered while a crowded vehicle bunched up. Moving money onto thickness
 * makes the belt evenly spaced and puts the one monetary encoding somewhere it
 * cannot be mistaken for anything else.
 */
function layoutOrbit(dots: Dot[], vehicles: Vehicle[], w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const small = w < 620;
  const R = Math.min(w, h) / 2 - (small ? 26 : 40);
  // A phone's radius cannot hold the committed figure at 0.36; give the centre
  // proportionally more room there.
  const geo = { cx, cy, R, rCap: R * (small ? 0.44 : 0.36), rProv: R * 0.62, rBelt: R * 0.86, band: R * 0.13 };

  const total = vehicles.reduce((s, v) => s + v.committed, 0);
  const maxShare = total > 0 ? Math.max(...vehicles.map((v) => v.committed)) / total : 1;
  const gap = 0.055;
  const wedges: Wedge[] = [];
  let a0 = -Math.PI / 2;

  vehicles.forEach((v) => {
    const mine = dots.filter((d) => d.vehicleId === v.id);
    if (!mine.length) return;
    const span = (mine.length / Math.max(1, dots.length)) * (Math.PI * 2 - gap * vehicles.length);
    mine.sort((a, b) => a.province.localeCompare(b.province) || a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

    const provs: Wedge["provs"] = [];
    mine.forEach((d) => {
      const last = provs[provs.length - 1];
      if (last && last.key === d.province) last.items.push(d);
      else provs.push({ key: d.province, items: [d], a0: 0, a1: 0 });
    });

    let pa = a0 + 0.012;
    const inner = span - 0.024;
    provs.forEach((g) => {
      const s = inner * (g.items.length / mine.length);
      g.a0 = pa;
      g.a1 = pa + s;
      pa += s;
      g.items.forEach((d, k) => {
        const t = (k + 0.5) / g.items.length;
        const ang = g.a0 + (g.a1 - g.a0) * t;
        const rr = geo.rBelt + ((k % 3) - 1) * (geo.band * 0.34);
        d.x = cx + Math.cos(ang) * rr;
        d.y = cy + Math.sin(ang) * rr;
        d.fx = ang; // reused as the angle for the spoke
      });
    });

    wedges.push({ vehicle: v, a0, a1: a0 + span, capT: total > 0 ? v.committed / total / maxShare : 1, provs });
    a0 += span + gap;
  });

  return { geo, wedges, small };
}

/* --------------------------------------------------------------------- lens */

type LensGroup = { key: string; items: Dot[]; x: number; y: number; w: number; h: number };

function layoutLens(dots: Dot[], group: Grouping, w: number, order: string[] | null) {
  const map = new Map<string, Dot[]>();
  dots.forEach((d) => {
    const k = group.key(d);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(d);
  });
  const list: LensGroup[] = [...map.entries()].map(([key, items]) => ({ key, items, x: 0, y: 0, w: 0, h: 0 }));
  if (order) list.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  else list.sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key));

  const small = w < 620;
  // Never leave empty columns: two groups get half the width each, not a quarter.
  const cols = Math.min(list.length, small ? 2 : Math.max(2, Math.min(4, Math.floor(w / 230))));
  const padX = 14;
  const gapX = 12;
  const gapY = 16;
  // Cap the card width so two groups become two tidy cards rather than banners,
  // then centre the whole grid in whatever is left over.
  const cw = Math.min(small ? 9999 : 300, (w - padX * 2 - gapX * (cols - 1)) / cols);
  const dotStep = small ? 15 : 17;
  const fitPerRow = Math.max(3, Math.floor((cw - 6) / dotStep));
  const headH = 30;
  const originX = Math.max(padX, (w - (cols * cw + gapX * (cols - 1))) / 2);

  let x = originX;
  let y = 16;
  let rowH = 0;
  let col = 0;
  list.forEach((g) => {
    // Aim for a roughly 1.6:1 block so thirty dots read as a shape, not a line.
    const perRow = Math.max(1, Math.min(fitPerRow, Math.ceil(Math.sqrt(g.items.length * 1.6))));
    const rows = Math.ceil(g.items.length / perRow);
    const gh = headH + rows * dotStep + 8;
    if (col === cols) {
      col = 0;
      x = originX;
      y += rowH + gapY;
      rowH = 0;
    }
    g.x = x;
    g.y = y;
    g.w = cw;
    g.h = gh;
    g.items.forEach((d, k) => {
      d.fx = x + 8 + (k % perRow) * dotStep + dotStep / 2;
      d.fy = y + headH + Math.floor(k / perRow) * dotStep + dotStep / 2;
    });
    rowH = Math.max(rowH, gh);
    x += cw + gapX;
    col += 1;
  });

  return { groups: list, height: y + rowH + 18 };
}

/* ---------------------------------------------------------------- component */

export function ClusterCanvas({
  view,
  dots,
  vehicles,
  grouping,
  groupOrder,
  theme,
  height,
  onHoverDot,
  onHoverCluster,
  centreTitle,
  centreLines,
}: {
  view: ClusterView;
  dots: Dot[];
  vehicles: Vehicle[];
  grouping: Grouping;
  groupOrder: string[] | null;
  theme: TerminalTheme;
  height: number;
  onHoverDot: (d: Dot | null) => void;
  onHoverCluster: (key: string | null, items: Dot[]) => void;
  centreTitle: string;
  centreLines: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const hotDot = useRef<Dot | null>(null);
  const hotBlob = useRef<Blob | null>(null);
  const tween = useRef({ start: -1, placed: false });
  const [autoHeight, setAutoHeight] = useState(height);

  const colorOf = useMemo(() => {
    const byId = new Map(vehicles.map((v) => [v.id, v.color]));
    return (d: Dot) => byId.get(d.vehicleId) ?? theme.ink2;
  }, [vehicles, theme.ink2]);

  // Hairlines that read on a near-black ground disappear on a near-white one.
  const lineBoost = useMemo(() => {
    const h = theme.ground.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    if (Number.isNaN(n)) return 1;
    const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    return lum > 128 ? 1.9 : 1;
  }, [theme.ground]);

  // Reset the tween whenever the grouping or the view changes, holding the
  // dots' current positions so they move from where they are.
  useEffect(() => {
    dots.forEach((d) => {
      d.px = d.x;
      d.py = d.y;
    });
    tween.current.start = -1;
  }, [grouping, view, dots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) });
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const raw = canvas?.getContext("2d");
    if (!canvas || !raw) return;
    const ctx: CanvasRenderingContext2D = raw;
    const { w, h } = size;
    if (w < 2 || h < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0;
    let stop = false;

    const cloud = view === "cloud" ? layoutCloud(dots, grouping, w, h) : null;
    const orbit = view === "orbit" ? layoutOrbit(dots, vehicles, w, h) : null;
    const lens = view === "lens" ? layoutLens(dots, grouping, w, groupOrder) : null;

    if (lens && Math.abs(lens.height - h) > 2) {
      setAutoHeight(lens.height);
      return;
    }
    if (lens && !tween.current.placed) {
      tween.current.placed = true;
      dots.forEach((d) => {
        d.px = d.fx;
        d.py = d.fy;
      });
    }

    function paint(t: number) {
      if (stop) return;
      ctx.clearRect(0, 0, w, h);

      if (cloud) {
        paintCloud(ctx, w, h, cloud.blobs, cloud.dotR, theme, colorOf, hotBlob.current, lineBoost);
        return;
      }

      if (orbit) {
        const { geo: g, wedges, small } = orbit;
        ctx.fillStyle = theme.ground;
        ctx.fillRect(0, 0, w, h);
        drawGrid(ctx, w, h, theme.ruleSoft, small ? 46 : 62);

        // Spokes: building back to its vehicle. The one connection that is
        // contractually true, and the only line drawn on this view.
        dots.forEach((d) => {
          ctx.strokeStyle = alpha(colorOf(d), (hotDot.current && hotDot.current !== d ? 0.07 : 0.2) * lineBoost);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(g.cx + Math.cos(d.fx) * (g.rCap + 8), g.cy + Math.sin(d.fx) * (g.rCap + 8));
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        });

        const maxT = small ? 22 : 30;
        wedges.forEach((wd) => {
          wd.provs.forEach((pr) => {
            ctx.strokeStyle = alpha(wd.vehicle.color, 0.42);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(g.cx, g.cy, g.rProv, pr.a0, pr.a1);
            ctx.stroke();
          });
          const th = Math.max(4, maxT * wd.capT);
          ctx.strokeStyle = wd.vehicle.color;
          ctx.lineWidth = th;
          ctx.lineCap = "butt";
          ctx.beginPath();
          ctx.arc(g.cx, g.cy, g.rCap - maxT / 2 + th / 2, wd.a0, wd.a1);
          ctx.stroke();
          // Shared baseline, so the difference in thickness is measurable.
          ctx.strokeStyle = alpha(theme.ink, 0.16);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(g.cx, g.cy, g.rCap - maxT / 2, wd.a0, wd.a1);
          ctx.stroke();
        });

        // Inbound pulses paced by the vehicle's PUBLISHED distribution cadence.
        // Cadence is in both offering documents, so animating it is fair; it
        // carries no size and must never be given one.
        wedges.forEach((wd) => {
          const months = wd.vehicle.cadenceMonths;
          if (!months) return;
          const mid = (wd.a0 + wd.a1) / 2;
          const period = months * 620;
          for (let k = 0; k < 3; k++) {
            const ph = ((t + (k * period) / 3) % period) / period;
            const rr = g.rCap - 6 - (g.rCap - 26) * easeOut(ph);
            ctx.fillStyle = alpha(wd.vehicle.color, (1 - ph) * 0.9);
            ctx.beginPath();
            ctx.arc(g.cx + Math.cos(mid) * rr, g.cy + Math.sin(mid) * rr, 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        dots.forEach((d) => drawDot(ctx, d, 4.1, colorOf(d), !!hotDot.current && hotDot.current !== d, hotDot.current === d, theme.ink));

        const hubR = Math.max(10, g.rCap - 16);
        ctx.fillStyle = theme.panel;
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, hubR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme.rule;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Everything in the hub is measured against the hub's real radius rather
        // than guessed from viewport width: the radius depends on the panel's
        // height too, so a wide-but-short canvas has a small hub and a caption
        // sized for "desktop" would run out over the capital band.
        const inner = hubR * 1.72;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
        const joined = [centreLines[1], centreLines[2]].filter(Boolean).join(" · ");
        const stacked = ctx.measureText(joined).width > inner;
        const sub = stacked ? centreLines.slice(1, 3).filter(Boolean) : [joined].filter(Boolean);

        let big = Math.min(22, Math.round(hubR * 0.42));
        ctx.font = `${big}px ui-serif, Georgia, serif`;
        while (big > 11 && ctx.measureText(centreLines[0] ?? "").width > inner) {
          big -= 1;
          ctx.font = `${big}px ui-serif, Georgia, serif`;
        }

        const blockH = 11 + big + sub.length * 13;
        let y = g.cy - blockH / 2 + 5;
        ctx.fillStyle = theme.ink3;
        ctx.font = '600 9px ui-sans-serif, system-ui, sans-serif';
        ctx.fillText(centreTitle, g.cx, y);
        y += big / 2 + 6;
        ctx.fillStyle = theme.ink;
        ctx.font = `${big}px ui-serif, Georgia, serif`;
        ctx.fillText(centreLines[0] ?? "", g.cx, y);
        y += big / 2 + 8;
        ctx.fillStyle = theme.ink3;
        ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
        sub.forEach((line) => {
          ctx.fillText(line, g.cx, y);
          y += 13;
        });

        if (!small) {
          ctx.font = '600 9.5px ui-sans-serif, system-ui, sans-serif';
          wedges.forEach((wd) =>
            wd.provs.forEach((pr) => {
              const mid = (pr.a0 + pr.a1) / 2;
              const rr = g.rBelt + g.band * 0.62 + 12;
              ctx.textAlign = Math.cos(mid) < -0.2 ? "right" : Math.cos(mid) > 0.2 ? "left" : "center";
              ctx.fillStyle = theme.ink2;
              ctx.fillText(`${pr.key} ${pr.items.length}`, g.cx + Math.cos(mid) * rr, g.cy + Math.sin(mid) * rr);
            }),
          );
          ctx.textAlign = "center";
          const total = vehicles.reduce((s, v) => s + v.committed, 0);
          wedges.forEach((wd) => {
            const mid = (wd.a0 + wd.a1) / 2;
            const rr = (g.rCap + g.rProv) / 2;
            const share = total > 0 ? `${((wd.vehicle.committed / total) * 100).toFixed(1)}%` : "—";
            const label = `${wd.vehicle.short}  ${share}`;
            ctx.save();
            ctx.translate(g.cx + Math.cos(mid) * rr, g.cy + Math.sin(mid) * rr);
            let rot = mid + Math.PI / 2;
            // Keep it right-reading on the left half of the circle.
            if (Math.cos(mid) < 0) rot += Math.PI;
            ctx.rotate(rot);
            ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = theme.ground;
            ctx.beginPath();
            ctx.roundRect(-tw / 2 - 5, -8, tw + 10, 16, 3);
            ctx.fill();
            ctx.fillStyle = theme.ink;
            ctx.fillText(label, 0, 0.5);
            ctx.restore();
          });
        }
        ctx.textAlign = "left";
        frame = requestAnimationFrame(paint);
        return;
      }

      if (lens) {
        if (tween.current.start < 0) tween.current.start = t;
        const k = Math.min(1, (t - tween.current.start) / 620);
        const e = easeOut(k);
        ctx.fillStyle = theme.ground;
        ctx.fillRect(0, 0, w, h);

        lens.groups.forEach((g) => {
          ctx.fillStyle = alpha(theme.ink, 0.028);
          ctx.beginPath();
          ctx.roundRect(g.x, g.y, g.w, g.h, 5);
          ctx.fill();
          ctx.strokeStyle = theme.ruleSoft;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.textBaseline = "alphabetic";
          ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
          ctx.textAlign = "left";
          ctx.fillStyle = theme.ink;
          ctx.fillText(fit(ctx, g.key, g.w - 44), g.x + 9, g.y + 18);
          ctx.textAlign = "right";
          ctx.fillStyle = theme.ink3;
          ctx.fillText(String(g.items.length), g.x + g.w - 9, g.y + 18);
          ctx.textAlign = "left";
        });

        dots.forEach((d) => {
          d.x = d.px + (d.fx - d.px) * e;
          d.y = d.py + (d.fy - d.py) * e;
          drawDot(ctx, d, 4.6, colorOf(d), !!hotDot.current && hotDot.current !== d, hotDot.current === d, theme.ink);
        });

        if (k < 1) frame = requestAnimationFrame(paint);
      }
    }

    frame = requestAnimationFrame(paint);

    function pick(ev: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      if (cloud) {
        let best: Blob | null = null;
        let bd = Infinity;
        cloud.blobs.forEach((g) => {
          const d = Math.hypot(g.x - x, g.y - y);
          if (d < g.r + 20 && d < bd) {
            bd = d;
            best = g;
          }
        });
        if (best === hotBlob.current) return;
        hotBlob.current = best;
        const blob = best as Blob | null;
        onHoverCluster(blob ? blob.key : null, blob ? blob.items : []);
      } else {
        let best: Dot | null = null;
        let bd = view === "lens" ? 12 : 15;
        dots.forEach((d) => {
          const dd = Math.hypot(d.x - x, d.y - y);
          if (dd < bd) {
            bd = dd;
            best = d;
          }
        });
        if (best === hotDot.current) return;
        hotDot.current = best;
        onHoverDot(best);
      }
      frame = requestAnimationFrame(paint);
    }
    function leave() {
      hotBlob.current = null;
      hotDot.current = null;
      onHoverDot(null);
      onHoverCluster(null, []);
      frame = requestAnimationFrame(paint);
    }

    canvas.addEventListener("pointermove", pick);
    canvas.addEventListener("pointerdown", pick);
    canvas.addEventListener("pointerleave", leave);
    return () => {
      stop = true;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", pick);
      canvas.removeEventListener("pointerdown", pick);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [
    size, view, dots, vehicles, grouping, groupOrder, theme, colorOf, lineBoost,
    onHoverDot, onHoverCluster, centreTitle, centreLines,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full touch-manipulation"
      style={{ height: view === "lens" ? autoHeight : height }}
    />
  );
}
