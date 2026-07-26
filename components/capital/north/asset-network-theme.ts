/**
 * The asset network renders as an instrument panel, so it carries its own
 * surface tokens rather than borrowing the console's. Both modes are designed,
 * not inverted: the dark set lifts its secondary and tertiary inks well above
 * the 3:1 floor (the first version sat near it and was genuinely hard to read),
 * and the light set is a cool paper rather than white so hairlines survive.
 *
 * Vehicle hues are validated per mode against that mode's own ground for the
 * OKLCH lightness band, the chroma floor, adjacent-pair CVD separation and
 * contrast. Gold is excluded from both lists and reserved for the subject.
 */

export type TerminalMode = "dark" | "light";

export type TerminalTheme = {
  mode: TerminalMode;
  ground: string;
  panel: string;
  head: string;
  rule: string;
  ruleSoft: string;
  hover: string;
  track: string;
  ink: string;
  ink2: string;
  ink3: string;
  inkFaint: string;
  accent: string;
  ok: string;
  warn: string;
  bar: string;
  vehicles: string[];
};

export const TERMINAL_THEMES: Record<TerminalMode, TerminalTheme> = {
  dark: {
    mode: "dark",
    ground: "#07090c",
    panel: "#0c1014",
    head: "#10161c",
    rule: "#233040",
    ruleSoft: "#18212b",
    hover: "#121b24",
    track: "#18222d",
    ink: "#e8eef6",
    ink2: "#9fadbf",
    // Lifted from #5d6874, which sat at roughly 3.4:1 on this ground and was
    // the reason small labels were hard to read.
    ink3: "#7f8c9d",
    inkFaint: "#4a5462",
    accent: "#ebc76b",
    ok: "#5cb488",
    warn: "#d9a457",
    bar: "#4a6b8f",
    vehicles: ["#6d86d6", "#22a892", "#9a7bd1", "#b8724f"],
  },
  light: {
    mode: "light",
    ground: "#f4f5f3",
    panel: "#e9ebe6",
    head: "#e3e6e0",
    rule: "#cdd2c9",
    ruleSoft: "#dee2d9",
    hover: "#e7eae4",
    track: "#dadfd6",
    ink: "#14171a",
    ink2: "#4b5259",
    ink3: "#6c757e",
    inkFaint: "#98a0a7",
    accent: "#7b5c19",
    ok: "#2f6f4f",
    warn: "#9a6f1e",
    bar: "#7d92a8",
    vehicles: ["#3a55a6", "#0a8f7d", "#8a5cc4", "#a8562f"],
  },
};

/** Custom properties the panel sets once, so markup reads through tokens. */
export function themeVars(theme: TerminalTheme): React.CSSProperties {
  return {
    "--t-ground": theme.ground,
    "--t-panel": theme.panel,
    "--t-head": theme.head,
    "--t-rule": theme.rule,
    "--t-rule-soft": theme.ruleSoft,
    "--t-hover": theme.hover,
    "--t-track": theme.track,
    "--t-ink": theme.ink,
    "--t-ink-2": theme.ink2,
    "--t-ink-3": theme.ink3,
    "--t-ink-faint": theme.inkFaint,
    "--t-accent": theme.accent,
    "--t-ok": theme.ok,
    "--t-warn": theme.warn,
    "--t-bar": theme.bar,
  } as React.CSSProperties;
}
