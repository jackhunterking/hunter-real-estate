/**
 * Brand tokens for social cards — the single place the renderer gets colour,
 * type and legal copy from.
 *
 * Values are copied from `app/theme.css` (and the dark navy accents the
 * offerings UI uses) rather than parsed at runtime: a social card is a frozen
 * PNG, so it must not silently change hue when the site theme is retuned.
 * When you retune the site, retune here deliberately.
 *
 * The disclosure strings mirror `lib/capital/investment-brand.ts` — every card
 * carries the same one-line registration that `DisclosureBar` shows on screen.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

export const C = {
  /** Deep navy field — the offerings UI navy, not the light site background. */
  navy: "#071c2c",
  navyMid: "#09283d",
  navyLift: "#0a2d46",
  /** Light surfaces. */
  cream: "#f2ede1",
  paper: "#fcfbf9",
  white: "#ffffff",
  /** Ink on light surfaces. */
  ink: "#1b1a17",
  inkMuted: "#6b665c",
  /** Accents. */
  gold: "#c5a34d",
  goldLight: "#d6b96e",
  goldLine: "#d9bd74",
  /** Gold dark enough to read as a fill on the cream surface. */
  goldDeep: "#9a7c2e",
  ok: "#2f6f4f",
  /** Ink on the navy field. */
  onNavy: "#f4f1ea",
  onNavyMuted: "rgba(244,241,234,0.62)",
  onNavyFaint: "rgba(244,241,234,0.32)",
  hairlineDark: "rgba(244,241,234,0.16)",
  hairlineLight: "#e0dacb",
} as const;

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

/**
 * Instagram portrait is the tallest frame the feed shows uncropped; LinkedIn
 * square is what the LI feed renders largest on desktop. A post declares a
 * platform and gets the right frame — never hand-crop a PNG afterwards.
 */
export const CANVAS = {
  ig: { w: 1080, h: 1350, pad: 72 },
  li: { w: 1200, h: 1200, pad: 84 },
} as const;

export type Platform = keyof typeof CANVAS;

/* ------------------------------------------------------------------ */
/* Destination                                                         */
/* ------------------------------------------------------------------ */

/**
 * The only piece of chrome these cards carry, and only on an explicit CTA
 * slide — a call to action needs somewhere to go. There is deliberately no
 * brand lockup and no disclosure footer: the post is the content, not a
 * letterhead. Legal copy lives on the site, in `DisclosureBar`.
 */
export const SITE_URL = "hunterandhunter.ca";

/* ------------------------------------------------------------------ */
/* Fonts — inlined so a card renders identically on any machine        */
/* ------------------------------------------------------------------ */

function fontFace(family: string, file: string, weightRange: string): string {
  const b64 = readFileSync(join(repoRoot, "app", "fonts", file)).toString("base64");
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-weight:${weightRange};font-style:normal;font-display:block;}`;
}

/** Cached: both faces are read once per process, not once per card. */
export const FONT_FACES = [
  fontFace("Hunter Serif", "NotoSerif.woff2", "100 900"),
  fontFace("Hunter Sans", "Manrope.woff2", "100 900"),
].join("");

export const SERIF = `"Hunter Serif", Georgia, serif`;
export const SANS = `"Hunter Sans", -apple-system, system-ui, sans-serif`;
