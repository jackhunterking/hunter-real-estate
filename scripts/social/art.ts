/**
 * The visual half of every card.
 *
 * Rule: no card is text alone. Each spec carries an `Art`, and `renderArt`
 * turns it into either a real building photograph or a drawn figure. The
 * figures are inline SVG built from the card's own content — the "15 of 30"
 * dot grid really is 30 dots with 15 filled — so the illustration carries
 * information rather than decorating the copy.
 *
 * Everything is geometric and drawn in the offering palette. No stock imagery,
 * no clip art: a photograph on a card is always a real building at a real
 * address (see data.ts and the honesty rule), and anything that isn't a
 * photograph is visibly a diagram.
 */
import { C } from "./tokens.ts";
import { findBuilding } from "./data.ts";

export type Art =
  /** A real building photo, pulled from the seeds by property id. */
  | { kind: "photo"; buildingId: string }
  /** `filled` of `total` — the literal figure, drawn. */
  | { kind: "dots"; total: number; filled: number }
  /** A vertical chain of labelled steps. Rent → manager → you. */
  | { kind: "flow"; steps: { label: string; sub?: string }[] }
  /** A row of building silhouettes — portfolio, not one address. */
  | { kind: "skyline" }
  /** Three glyphs: one house, a portfolio, a price line. */
  | { kind: "paths"; labels?: [string, string, string] };

export interface ArtContext {
  /** Ink that reads on this card's surface. */
  tone: "navy" | "cream";
  width: number;
  height: number;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function ink(tone: "navy" | "cream") {
  return tone === "navy"
    ? { line: "rgba(244,241,234,0.30)", strong: C.onNavy, muted: C.onNavyMuted, fill: C.goldLight }
    : { line: "rgba(27,26,23,0.22)", strong: C.ink, muted: C.inkMuted, fill: C.goldDeep };
}

/* ------------------------------------------------------------------ */
/* Photo                                                               */
/* ------------------------------------------------------------------ */

/** A white pill with an icon — the Verified and rendering tags. */
export function chip(text: string, icon: string, color: string, scale: number): string {
  const px = (n: number) => Math.round(n * scale);
  return `<span style="display:inline-flex;align-items:center;gap:${px(8)}px;background:rgba(252,251,249,0.94);
    border-radius:999px;padding:${px(9)}px ${px(18)}px;font-size:${px(18)}px;font-weight:700;color:${color};
    box-shadow:0 ${px(2)}px ${px(10)}px rgba(0,0,0,0.18)">${icon}${esc(text)}</span>`;
}

export const CHECK_ICON = (scale: number, color: string) =>
  `<svg width="${Math.round(20 * scale)}" height="${Math.round(20 * scale)}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>`;

const RULER_ICON = (scale: number, color: string) =>
  `<svg width="${Math.round(19 * scale)}" height="${Math.round(19 * scale)}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="m5 17 9-9 3 3-9 9H5v-3Z"/><path d="M14 6l4-4 3 3-4 4"/></svg>`;

/**
 * A photo band. `scrim` paints the navy gradient that lets type sit on top —
 * used by the full-bleed layouts (carousel cover, quote).
 *
 * The "Artist's rendering" tag is drawn *here*, not by the caller, so that
 * every surface showing a CGI says so. That rule exists because an investor
 * reads an image as evidence, and a rendering is an intention.
 */
export function photoBand(
  buildingId: string,
  {
    width,
    height,
    scrim = false,
    pad = 0,
    scale = 1,
  }: { width: number; height: number; scrim?: boolean; pad?: number; scale?: number },
): string {
  const b = findBuilding(buildingId);
  if (!b) throw new Error(`Unknown building: ${buildingId}`);
  if (!b.imageUrl) {
    throw new Error(
      `${b.id} has no approved image. A card never shows a look-alike photo — pull Street View first (scripts/pull-street-view.ts).`,
    );
  }
  const inset = pad || Math.round(30 * scale);
  return `<div style="position:relative;width:${width}px;height:${height}px;flex:none;background:${C.navyMid};overflow:hidden">
    <!-- Scanned deck photos often carry a 1–3px dark edge; a hair of scale crops it. -->
    <img src="${b.imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.02)" />
    ${
      scrim
        ? `<div style="position:absolute;inset:0;background:linear-gradient(to top,
            rgba(7,28,44,0.97) 0%, rgba(7,28,44,0.93) 34%, rgba(7,28,44,0.62) 60%, rgba(7,28,44,0.28) 82%, rgba(7,28,44,0.18) 100%)"></div>`
        : ""
    }
    ${
      b.imageKind === "render"
        ? `<div style="position:absolute;right:${inset}px;top:${inset}px">${chip("Artist's rendering", RULER_ICON(scale, C.inkMuted), C.inkMuted, scale)}</div>`
        : ""
    }
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Figures                                                             */
/* ------------------------------------------------------------------ */

/** `filled` of `total`, as a grid of dots. The count is the point. */
function dots(total: number, filled: number, ctx: ArtContext): string {
  const cols = total > 24 ? 10 : total > 12 ? 6 : 5;
  const rows = Math.ceil(total / cols);
  const step = 100;
  const r = 26;
  const w = cols * step;
  const h = rows * step;
  const k = ink(ctx.tone);
  const circles = Array.from({ length: total }, (_, i) => {
    const cx = (i % cols) * step + step / 2;
    const cy = Math.floor(i / cols) * step + step / 2;
    return i < filled
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${k.fill}"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="${k.line}" stroke-width="4"/>`;
  }).join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${circles}</svg>`;
}

/** A vertical chain: each step a rule, a label, and a connector down. */
function flow(steps: { label: string; sub?: string }[], ctx: ArtContext): string {
  const k = ink(ctx.tone);
  const rowH = 150;
  const w = 1000;
  const h = steps.length * rowH;
  const parts = steps
    .map((step, i) => {
      const y = i * rowH;
      const cy = y + 52;
      const connector =
        i < steps.length - 1
          ? `<line x1="46" y1="${cy + 34}" x2="46" y2="${y + rowH + 18}" stroke="${k.line}" stroke-width="4"/>
             <path d="M46 ${y + rowH + 26} l-9 -14 h18 z" fill="${k.line}"/>`
          : "";
      return `
        <circle cx="46" cy="${cy}" r="17" fill="none" stroke="${k.fill}" stroke-width="5"/>
        <circle cx="46" cy="${cy}" r="6" fill="${k.fill}"/>
        <text x="112" y="${cy + 3}" fill="${k.strong}" font-family="Hunter Sans" font-size="42" font-weight="600" dominant-baseline="middle">${esc(step.label)}</text>
        ${step.sub ? `<text x="112" y="${cy + 52}" fill="${k.muted}" font-family="Hunter Sans" font-size="32" dominant-baseline="middle">${esc(step.sub)}</text>` : ""}
        ${connector}`;
    })
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${parts}</svg>`;
}

/**
 * A row of building silhouettes with window grids. Deterministic — the shapes
 * come from a fixed table, never a random seed, so a re-render is identical.
 */
function skyline(ctx: ArtContext): string {
  const k = ink(ctx.tone);
  const spec = [
    { w: 150, h: 190, cols: 3, rows: 5 },
    { w: 210, h: 300, cols: 4, rows: 8 },
    { w: 130, h: 150, cols: 3, rows: 4 },
    { w: 190, h: 250, cols: 4, rows: 6 },
    { w: 160, h: 210, cols: 3, rows: 5 },
  ];
  const gap = 22;
  const baseline = 320;
  const total = spec.reduce((sum, s) => sum + s.w, 0) + gap * (spec.length - 1);
  let x = 0;
  const shapes = spec
    .map((s, i) => {
      const y = baseline - s.h;
      const winW = 18;
      const winH = 14;
      const padX = (s.w - s.cols * winW) / (s.cols + 1);
      const padY = (s.h - 26 - s.rows * winH) / (s.rows + 1);
      const windows = Array.from({ length: s.cols * s.rows }, (_, n) => {
        const wx = x + padX + (n % s.cols) * (winW + padX);
        const wy = y + 22 + padY + Math.floor(n / s.cols) * (winH + padY);
        // Every third window lit, in gold — a portfolio that is occupied.
        const lit = (n + i) % 3 === 0;
        return `<rect x="${wx}" y="${wy}" width="${winW}" height="${winH}" fill="${lit ? k.fill : "none"}" stroke="${lit ? "none" : k.line}" stroke-width="2.5"/>`;
      }).join("");
      const rect = `<rect x="${x}" y="${y}" width="${s.w}" height="${s.h}" fill="none" stroke="${k.line}" stroke-width="4"/>`;
      x += s.w + gap;
      return rect + windows;
    })
    .join("");
  return `<svg viewBox="0 0 ${total} ${baseline + 6}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    ${shapes}
    <line x1="0" y1="${baseline}" x2="${total}" y2="${baseline}" stroke="${k.fill}" stroke-width="5"/>
  </svg>`;
}

/** One house · a portfolio · a price line — the three paths, as glyphs. */
function paths(labels: [string, string, string] | undefined, ctx: ArtContext): string {
  const k = ink(ctx.tone);
  const cell = 330;
  const gap = 40;
  const w = cell * 3 + gap * 2;
  const h = 250;
  const label = (i: number, text?: string) =>
    text
      ? `<text x="${i * (cell + gap) + cell / 2}" y="232" fill="${k.muted}" font-family="Hunter Sans" font-size="30" text-anchor="middle">${esc(text)}</text>`
      : "";

  // 1 — a single house.
  const house = `<g transform="translate(${cell / 2 - 80},40)">
    <path d="M0 60 L80 0 L160 60 V150 H0 Z" fill="none" stroke="${k.line}" stroke-width="5"/>
    <rect x="62" y="92" width="36" height="58" fill="${k.fill}"/>
  </g>`;

  // 2 — a cluster, the middle one lit.
  const cluster = `<g transform="translate(${cell + gap + cell / 2 - 100},30)">
    <rect x="0" y="60" width="55" height="100" fill="none" stroke="${k.line}" stroke-width="5"/>
    <rect x="72" y="20" width="60" height="140" fill="none" stroke="${k.fill}" stroke-width="5"/>
    <rect x="88" y="44" width="28" height="24" fill="${k.fill}"/>
    <rect x="88" y="84" width="28" height="24" fill="${k.fill}"/>
    <rect x="149" y="76" width="52" height="84" fill="none" stroke="${k.line}" stroke-width="5"/>
    <line x1="-6" y1="160" x2="207" y2="160" stroke="${k.line}" stroke-width="5"/>
  </g>`;

  // 3 — a price line, going nowhere in particular.
  const chart = `<g transform="translate(${(cell + gap) * 2 + cell / 2 - 100},40)">
    <polyline points="0,120 40,70 80,95 120,30 160,80 200,45" fill="none" stroke="${k.line}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="200" cy="45" r="11" fill="${k.fill}"/>
    <line x1="0" y1="150" x2="200" y2="150" stroke="${k.line}" stroke-width="5"/>
  </g>`;

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    ${house}${cluster}${chart}
    ${label(0, labels?.[0])}${label(1, labels?.[1])}${label(2, labels?.[2])}
  </svg>`;
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                            */
/* ------------------------------------------------------------------ */

/** A drawn figure, padded inside its band. Photos go through `photoBand`. */
export function renderFigure(art: Art, ctx: ArtContext): string {
  let svg: string;
  switch (art.kind) {
    case "dots":
      svg = dots(art.total, art.filled, ctx);
      break;
    case "flow":
      svg = flow(art.steps, ctx);
      break;
    case "skyline":
      svg = skyline(ctx);
      break;
    case "paths":
      svg = paths(art.labels, ctx);
      break;
    case "photo":
      throw new Error("Photo art belongs in photoBand(), not renderFigure().");
  }
  // Figures breathe inside their band — a diagram touching the card edge reads
  // like a cropping mistake.
  const inset = Math.round(ctx.width * 0.075);
  return `<div style="width:${ctx.width}px;height:${ctx.height}px;flex:none;display:flex;align-items:center;justify-content:center;padding:${Math.round(inset * 0.5)}px ${inset}px">${svg}</div>`;
}
