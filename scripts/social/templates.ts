/**
 * The five card templates, as HTML.
 *
 *   A `building`  — one address, one real photo. The proof series.
 *   B `fact`      — one figure, drawn as well as written.
 *   C `carousel`  — a multi-slide explainer (cover / body / list / cta).
 *   D `compare`   — the three-column structural comparison.
 *   E `pov`       — a quote set over a real building.
 *
 * Two house rules, enforced here rather than left to discipline:
 *
 *   1. No card is text alone. Every spec carries an `art` — a photograph of a
 *      real building, or a figure drawn from the card's own content — and
 *      `renderSpec` throws if one is missing.
 *   2. No brand lockup and no disclosure footer. These cards are the content,
 *      not a letterhead. The only URL that appears is on an explicit CTA slide,
 *      where a call to action needs somewhere to go.
 *
 * Type sizes are authored against the 1080-wide Instagram frame and scaled by
 * canvas width, so the LinkedIn square is the same design, not a second design.
 */
import { C, CANVAS, FONT_FACES, SANS, SERIF, SITE_URL, type Platform } from "./tokens.ts";
import { findBuilding } from "./data.ts";
import { CHECK_ICON, chip, photoBand, renderFigure, type Art } from "./art.ts";

/* ------------------------------------------------------------------ */
/* Specs                                                               */
/* ------------------------------------------------------------------ */

export interface BuildingSpec {
  kind: "building";
  /** Property id from the seed bundles, e.g. `lankin-park-centre-place`. */
  buildingId: string;
  eyebrow?: string;
  /**
   * Optional. Only fill this from something the manager has actually published
   * — the site's building card deliberately shows no metrics because managers
   * may not disclose them. If you set facts, `source` becomes required.
   */
  facts?: { label: string; value: string }[];
  source?: string;
}

export interface FactSpec {
  kind: "fact";
  art: Art;
  eyebrow: string;
  value: string;
  label: string;
  body?: string;
  source?: string;
}

export interface CompareSpec {
  kind: "compare";
  /** Defaults to the three-path glyph strip. */
  art?: Art;
  eyebrow: string;
  title: string;
  columns: [string, string, string];
  /** Index of the column drawn in gold. */
  highlight: 0 | 1 | 2;
  rows: { label: string; cells: [string, string, string] }[];
  note?: string;
}

export interface PovSpec {
  kind: "pov";
  /** A quote sits over a real building. */
  art: Art;
  eyebrow?: string;
  quote: string;
  attribution?: string;
}

export interface SlideSpec {
  variant: "cover" | "body" | "list" | "cta";
  art: Art;
  eyebrow?: string;
  title?: string;
  body?: string;
  items?: string[];
  /** Small line under the content — a source, a caveat. */
  kicker?: string;
}

export interface CarouselSpec {
  kind: "carousel";
  slides: SlideSpec[];
}

export type Spec = BuildingSpec | FactSpec | CompareSpec | PovSpec | CarouselSpec;

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

type Tone = "navy" | "cream";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function scaler(platform: Platform) {
  const cv = CANVAS[platform];
  return (n: number) => Math.round((n * cv.w) / 1080);
}

/**
 * `bleed` drops the horizontal padding so an art band can run edge to edge;
 * inner text blocks re-apply it themselves.
 */
function frame(platform: Platform, tone: Tone, body: string, opts: { bleed?: boolean } = {}): string {
  const cv = CANVAS[platform];
  const bg =
    tone === "navy"
      ? `radial-gradient(120% 90% at 15% 0%, ${C.navyLift} 0%, ${C.navyMid} 42%, ${C.navy} 100%)`
      : C.cream;
  const fg = tone === "navy" ? C.onNavy : C.ink;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${FONT_FACES}
    *{margin:0;padding:0;box-sizing:border-box}
    /* The background sits on html AND the card so nothing can leave a white
       edge if a block runs long. */
    html,body{width:${cv.w}px;height:${cv.h}px;overflow:hidden;background:${bg}}
    body{color:${fg};font-family:${SANS};-webkit-font-smoothing:antialiased}
    .card{width:${cv.w}px;height:${cv.h}px;display:flex;flex-direction:column;background:${bg};
          padding:${opts.bleed ? "0" : `${cv.pad}px`}}
    .card > div{min-height:0}
    .serif{font-family:${SERIF}}
    .eyebrow{font-size:${scaler(platform)(19)}px;letter-spacing:${scaler(platform)(4)}px;text-transform:uppercase;font-weight:700}
  </style></head><body><div class="card">${body}</div></body></html>`;
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/** A drawn figure or a photograph, sized to a band. */
function artBand(art: Art, platform: Platform, tone: Tone, height: number, scrim = false): string {
  const cv = CANVAS[platform];
  if (art.kind === "photo") {
    return photoBand(art.buildingId, { width: cv.w, height, scrim, pad: cv.pad, scale: cv.w / 1080 });
  }
  return renderFigure(art, { tone, width: cv.w, height });
}

/* ------------------------------------------------------------------ */
/* A — Building                                                        */
/* ------------------------------------------------------------------ */

function buildingCard(spec: BuildingSpec, platform: Platform): string {
  const b = findBuilding(spec.buildingId);
  if (!b) throw new Error(`Unknown building: ${spec.buildingId}`);
  if (spec.facts?.length && !spec.source) {
    throw new Error(`${b.id}: facts require a source line.`);
  }
  const s = scaler(platform);
  const cv = CANVAS[platform];
  const photoH = Math.round(cv.h * (platform === "ig" ? 0.68 : 0.62));
  const eyebrow = spec.eyebrow ?? `${b.province}, Canada`;

  const facts = spec.facts?.length
    ? `<div style="display:flex;gap:${s(72)}px;margin-top:${s(30)}px;padding-top:${s(26)}px;border-top:1px solid ${C.hairlineDark}">
         ${spec.facts
           .map(
             (f) => `<div>
             <div style="font-size:${s(16)}px;letter-spacing:${s(2)}px;text-transform:uppercase;color:${C.onNavyMuted}">${esc(f.label)}</div>
             <div class="serif" style="font-size:${s(38)}px;margin-top:${s(8)}px;color:${C.onNavy}">${esc(f.value)}</div>
           </div>`,
           )
           .join("")}
       </div>`
    : "";

  return frame(
    platform,
    "navy",
    `
    <div style="position:relative;flex:none">
      ${artBand({ kind: "photo", buildingId: b.id }, platform, "navy", photoH)}
      <div style="position:absolute;left:${cv.pad}px;top:${cv.pad}px">
        ${b.verified ? chip("Verified", CHECK_ICON(cv.w / 1080, C.ok), C.ok, cv.w / 1080) : ""}
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:${s(40)}px ${cv.pad}px">
      <div class="eyebrow" style="color:${C.gold}">${esc(eyebrow)}</div>
      <div class="serif" style="font-size:${s(62)}px;line-height:1.08;margin-top:${s(20)}px">${esc(b.name)}</div>
      <div style="font-size:${s(30)}px;margin-top:${s(14)}px;color:${C.onNavyMuted}">${esc(`${b.city}, ${b.province}`)}</div>
      ${facts}
      ${spec.source ? `<div style="font-size:${s(19)}px;margin-top:${s(22)}px;color:${C.onNavyFaint}">${esc(spec.source)}</div>` : ""}
    </div>`,
    { bleed: true },
  );
}

/* ------------------------------------------------------------------ */
/* B — Fact                                                            */
/* ------------------------------------------------------------------ */

function factCard(spec: FactSpec, platform: Platform): string {
  const s = scaler(platform);
  const cv = CANVAS[platform];
  const isPhoto = spec.art.kind === "photo";
  const artH = Math.round(cv.h * (isPhoto ? 0.44 : 0.4));

  return frame(
    platform,
    "navy",
    `
    ${artBand(spec.art, platform, "navy", artH)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:${s(44)}px ${cv.pad}px ${cv.pad}px">
      <div class="eyebrow" style="color:${C.gold}">${esc(spec.eyebrow)}</div>
      <div class="serif" style="font-size:${s(120)}px;line-height:1;margin-top:${s(24)}px;color:${C.goldLight}">${esc(spec.value)}</div>
      <div class="serif" style="font-size:${s(46)}px;line-height:1.2;margin-top:${s(20)}px">${esc(spec.label)}</div>
      ${
        spec.body
          ? `<div style="font-size:${s(29)}px;line-height:1.55;margin-top:${s(24)}px;color:${C.onNavyMuted};max-width:${s(830)}px">${esc(spec.body)}</div>`
          : ""
      }
      ${spec.source ? `<div style="font-size:${s(19)}px;margin-top:${s(26)}px;color:${C.onNavyFaint}">${esc(spec.source)}</div>` : ""}
    </div>`,
    { bleed: true },
  );
}

/* ------------------------------------------------------------------ */
/* C — Carousel                                                        */
/* ------------------------------------------------------------------ */

function slide(spec: SlideSpec, platform: Platform, index: number, total: number): string {
  const s = scaler(platform);
  const cv = CANVAS[platform];
  const tone: Tone = spec.variant === "cover" || spec.variant === "cta" ? "navy" : "cream";
  const accent = tone === "navy" ? C.gold : C.navy;
  const muted = tone === "navy" ? C.onNavyMuted : C.inkMuted;
  const faint = tone === "navy" ? C.onNavyFaint : "rgba(27,26,23,0.38)";

  const counter = `<div style="font-size:${s(18)}px;letter-spacing:${s(2)}px;color:${faint};margin-top:${s(30)}px">${index + 1} / ${total}${spec.variant === "cover" ? "&nbsp;&nbsp;·&nbsp;&nbsp;Swipe →" : ""}</div>`;

  /* Cover and CTA are full-bleed photo with the type set over a scrim. */
  if (spec.variant === "cover" || spec.variant === "cta") {
    const isCta = spec.variant === "cta";
    return frame(
      platform,
      "navy",
      `<div style="position:relative;width:${cv.w}px;height:${cv.h}px">
        ${artBand(spec.art, platform, "navy", cv.h, true)}
        <div style="position:absolute;inset:auto 0 0 0;padding:0 ${cv.pad}px ${cv.pad}px">
          ${spec.eyebrow ? `<div class="eyebrow" style="color:${accent}">${esc(spec.eyebrow)}</div>` : ""}
          <div class="serif" style="font-size:${s(isCta ? 64 : 74)}px;line-height:1.1;margin-top:${s(24)}px">${esc(spec.title ?? "")}</div>
          <div style="width:${s(96)}px;height:${s(3)}px;background:${accent};margin-top:${s(30)}px"></div>
          ${spec.body ? `<div style="font-size:${s(30)}px;line-height:1.5;margin-top:${s(26)}px;color:rgba(244,241,234,0.86);max-width:${s(830)}px">${esc(spec.body)}</div>` : ""}
          ${
            isCta
              ? `<div style="margin-top:${s(34)}px;display:inline-block;border:${s(2)}px solid ${accent};color:${accent};
                    border-radius:999px;padding:${s(18)}px ${s(38)}px;font-size:${s(26)}px;font-weight:700">${esc(SITE_URL)}</div>`
              : counter
          }
        </div>
      </div>`,
      { bleed: true },
    );
  }

  /* Body and list slides: a drawn figure above, the copy below. */
  const artH = Math.round(cv.h * (spec.variant === "list" ? 0.26 : 0.34));
  const content =
    spec.variant === "list"
      ? `<div style="margin-top:${s(34)}px;display:flex;flex-direction:column;gap:${s(24)}px">
          ${(spec.items ?? [])
            .map(
              (item, i) => `<div style="display:flex;gap:${s(22)}px;align-items:flex-start">
                <div class="serif" style="font-size:${s(30)}px;color:${accent};min-width:${s(42)}px">${String(i + 1).padStart(2, "0")}</div>
                <div style="font-size:${s(31)}px;line-height:1.45">${esc(item)}</div>
              </div>`,
            )
            .join("")}
        </div>`
      : `<div style="font-size:${s(33)}px;line-height:1.5;margin-top:${s(28)}px;max-width:${s(850)}px">${esc(spec.body ?? "")}</div>`;

  return frame(
    platform,
    tone,
    `
    <!-- The band gets the card's top margin so the figure doesn't jam against
         the edge; a photo band still runs full-bleed sideways. -->
    <div style="flex:none;padding-top:${cv.pad}px">${artBand(spec.art, platform, tone, artH)}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:${s(30)}px ${cv.pad}px ${cv.pad}px">
      ${spec.eyebrow ? `<div class="eyebrow" style="color:${accent}">${esc(spec.eyebrow)}</div>` : ""}
      <div class="serif" style="font-size:${s(56)}px;line-height:1.15;margin-top:${s(20)}px">${esc(spec.title ?? "")}</div>
      ${content}
      ${spec.kicker ? `<div style="font-size:${s(21)}px;line-height:1.45;margin-top:${s(26)}px;color:${muted}">${esc(spec.kicker)}</div>` : ""}
      ${counter}
    </div>`,
    { bleed: true },
  );
}

/* ------------------------------------------------------------------ */
/* D — Compare                                                         */
/* ------------------------------------------------------------------ */

function compareCard(spec: CompareSpec, platform: Platform): string {
  const s = scaler(platform);
  const cv = CANVAS[platform];
  const art: Art = spec.art ?? { kind: "paths", labels: spec.columns };
  const artH = Math.round(cv.h * 0.19);

  const head = spec.columns
    .map((col, i) => {
      const on = i === spec.highlight;
      return `<th style="width:27%;text-align:left;padding:${s(18)}px ${s(20)}px;font-size:${s(23)}px;font-weight:700;
        color:${on ? C.navy : C.onNavy};background:${on ? C.goldLight : "transparent"};
        border-radius:${on ? `${s(10)}px ${s(10)}px 0 0` : "0"}">${esc(col)}</th>`;
    })
    .join("");

  const body = spec.rows
    .map(
      (row) => `<tr>
        <td style="padding:${s(20)}px 0;font-size:${s(22)}px;color:${C.onNavyMuted};border-top:1px solid ${C.hairlineDark};vertical-align:top">${esc(row.label)}</td>
        ${row.cells
          .map(
            (cell, i) => `<td style="padding:${s(20)}px;font-size:${s(22)}px;line-height:1.4;vertical-align:top;
              border-top:1px solid ${C.hairlineDark};
              color:${i === spec.highlight ? C.onNavy : C.onNavyMuted};
              font-weight:${i === spec.highlight ? 600 : 400};
              background:${i === spec.highlight ? "rgba(214,185,110,0.08)" : "transparent"}">${esc(cell)}</td>`,
          )
          .join("")}
      </tr>`,
    )
    .join("");

  return frame(
    platform,
    "navy",
    `
    <div style="flex:none;padding-top:${cv.pad}px">${artBand(art, platform, "navy", artH)}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:${s(30)}px ${cv.pad}px ${cv.pad}px">
      <div class="eyebrow" style="color:${C.gold}">${esc(spec.eyebrow)}</div>
      <div class="serif" style="font-size:${s(56)}px;line-height:1.12;margin-top:${s(18)}px">${esc(spec.title)}</div>
      <table style="width:100%;border-collapse:collapse;margin-top:${s(32)}px;table-layout:fixed">
        <thead><tr><th style="width:19%"></th>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
      ${spec.note ? `<div style="font-size:${s(20)}px;line-height:1.45;margin-top:${s(26)}px;color:${C.onNavyFaint}">${esc(spec.note)}</div>` : ""}
    </div>`,
    { bleed: true },
  );
}

/* ------------------------------------------------------------------ */
/* E — POV                                                             */
/* ------------------------------------------------------------------ */

function povCard(spec: PovSpec, platform: Platform): string {
  const s = scaler(platform);
  const cv = CANVAS[platform];
  return frame(
    platform,
    "navy",
    `<div style="position:relative;width:${cv.w}px;height:${cv.h}px">
      ${artBand(spec.art, platform, "navy", cv.h, true)}
      <div style="position:absolute;inset:auto 0 0 0;padding:0 ${cv.pad}px ${cv.pad}px">
        ${spec.eyebrow ? `<div class="eyebrow" style="color:${C.gold}">${esc(spec.eyebrow)}</div>` : ""}
        <div class="serif" style="font-size:${s(110)}px;line-height:0.6;color:${C.goldLight};margin-top:${s(30)}px">&ldquo;</div>
        <div class="serif" style="font-size:${s(56)}px;line-height:1.28;margin-top:${s(18)}px;max-width:${s(900)}px">${esc(spec.quote)}</div>
        ${spec.attribution ? `<div style="font-size:${s(27)}px;margin-top:${s(32)}px;color:rgba(244,241,234,0.72)">${esc(spec.attribution)}</div>` : ""}
      </div>
    </div>`,
    { bleed: true },
  );
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                            */
/* ------------------------------------------------------------------ */

/** House rule 1, enforced: no card ships as text alone. */
function requireArt(id: string, art: Art | undefined): void {
  if (!art) throw new Error(`${id}: every card needs art — add an \`art\` to the spec.`);
}

/** One spec → one or more HTML documents (a carousel yields one per slide). */
export function renderSpec(spec: Spec, platform: Platform): string[] {
  switch (spec.kind) {
    case "building":
      // The photograph is the card.
      return [buildingCard(spec, platform)];
    case "fact":
      requireArt("fact card", spec.art);
      return [factCard(spec, platform)];
    case "compare":
      // Falls back to the three-path glyph strip, so it always has a figure.
      return [compareCard(spec, platform)];
    case "pov":
      requireArt("pov card", spec.art);
      return [povCard(spec, platform)];
    case "carousel":
      spec.slides.forEach((sl, i) => requireArt(`carousel slide ${i + 1}`, sl.art));
      return spec.slides.map((sl, i) => slide(sl, platform, i, spec.slides.length));
  }
}
