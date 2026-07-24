"use client";

/**
 * Shared building blocks for the Resources → Tools comparison calculators
 * (Active vs. Passive, Passive vs. Passive). Both tools show the same fund
 * picker, the same headline figure and the same grouped numeric inputs, so
 * they live here once and the tools stay about their own arithmetic.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FundComparable } from "@/lib/capital/compare-investments";
import type { Lang } from "@/lib/capital/types";
import { tx } from "@/lib/i18n/localize";

/**
 * Header for a tool page: the tool's own name, plus the one line that says what
 * it compares. `PageHeader` in PortalUI deliberately renders the title only, so
 * the subtitle lives inside the header block here rather than floating below a
 * rule that already closed the header.
 */
export function ToolHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-7 border-b border-[#dfe4e9] pb-6">
      <h1 className="font-serif text-3xl font-semibold text-[#102638] sm:text-[2.25rem]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65727c]">{subtitle}</p>
    </header>
  );
}

export function HeroCashFlow({
  value,
  unit,
  color,
  invested,
  investedLabel,
  metricValue,
  metricLabel,
}: {
  value: string;
  unit?: string;
  color: string;
  invested: string;
  investedLabel: string;
  metricValue: string;
  metricLabel: string;
}) {
  return (
    <div className="mt-5">
      <p className="font-serif text-[2.75rem] font-semibold leading-[0.95] tracking-tight" style={{ color }}>
        {value}
        {unit && <span className="ml-1 text-xl font-semibold text-[#9aa5ae]">{unit}</span>}
      </p>
      <p className="mt-2.5 text-[13px] leading-snug text-[#6b7883]">
        <span className="font-semibold text-[#40515e]">{invested}</span> {investedLabel}
        <span className="mx-1.5 text-[#c4ced4]">·</span>
        <span className="font-semibold text-[#40515e]">{metricValue}</span> {metricLabel}
      </p>
    </div>
  );
}

/** Small brand logo, matched to the height of the text it sits beside. */
export function FundLogo({ src, className = "" }: { src?: string; className?: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`w-auto max-w-9 shrink-0 rounded-[3px] bg-white object-contain ${className}`} />;
}

/**
 * Custom fund picker — a native <select> can't render a logo inside its
 * options, so this lightweight listbox shows each fund's brand mark beside its
 * name, sized to match the title text.
 */
export function FundSelect({
  funds,
  value,
  onChange,
  lang,
  label,
  focusClass = "focus:border-[#1d6a4f] focus:ring-2 focus:ring-[#1d6a4f]/15",
  activeClass = "bg-[#eaf3ee] font-semibold text-[#1d6a4f]",
}: {
  funds: FundComparable[];
  value: string;
  onChange: (id: string) => void;
  lang: Lang;
  label: string;
  /** Focus ring and selected-row styling, so each side of a two-fund view can differ. */
  focusClass?: string;
  activeClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = funds.find((f) => f.id === value) ?? funds[0];

  return (
    <div className="relative flex-1">
      <span className="sr-only">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 w-full items-center gap-2 rounded-md border border-[#cfd9df] bg-white pl-2.5 pr-8 text-left outline-none ${focusClass}`}
      >
        <FundLogo src={selected?.logoSrc} className="h-[1.15em]" />
        <span className="truncate text-sm font-semibold text-[#233947]">{tx(selected?.shortName, lang)}</span>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#93a0a9]" />
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute left-0 top-[calc(100%+4px)] z-20 max-h-64 w-full min-w-[200px] overflow-auto rounded-md border border-[#cfd9df] bg-white py-1 shadow-lg"
          >
            {funds.map((f) => {
              const active = f.id === value;
              return (
                <li key={f.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(f.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm ${
                      active ? activeClass : "text-[#233947] hover:bg-[#f3f6f8]"
                    }`}
                  >
                    <FundLogo src={f.logoSrc} className="h-[1.15em]" />
                    <span className="truncate">{tx(f.shortName, lang)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/* ── Comma-grouped numeric input ─────────────────────────────────────────────
 * Native <input type="number"> can't show thousands separators, so these are
 * text inputs that group the integer part with commas as you type. The caret is
 * restored by counting digits from the right, which is stable under grouping. */

/** Group the integer part of a plain numeric string with commas. */
function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a stored number for display (commas, up to a few decimals). */
function formatNumber(value: number, allowDecimal: boolean): string {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", { maximumFractionDigits: allowDecimal ? 4 : 0, useGrouping: true });
}

/** Turn raw keystrokes into a grouped display string + the parsed number. */
function parseInput(raw: string, allowDecimal: boolean): { formatted: string; num: number } {
  let s = raw.replace(/,/g, "");
  s = allowDecimal ? s.replace(/[^\d.]/g, "") : s.replace(/[^\d]/g, "");
  if (allowDecimal) {
    const dot = s.indexOf(".");
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  }
  if (s === "" || s === ".") return { formatted: s, num: 0 };
  const dot = allowDecimal ? s.indexOf(".") : -1;
  const intPart = (dot === -1 ? s : s.slice(0, dot)).replace(/^0+(?=\d)/, "");
  const decPart = dot === -1 ? "" : s.slice(dot);
  return { formatted: group(intPart) + decPart, num: Number(s) };
}

const digitsAfter = (s: string, from: number): number => {
  let n = 0;
  for (let i = from; i < s.length; i++) if (s[i] >= "0" && s[i] <= "9") n++;
  return n;
};

/** Position whose right side holds exactly `digits` digits (caret restore). */
function caretForDigits(s: string, digits: number): number {
  if (digits <= 0) return s.length;
  let count = 0;
  for (let p = s.length - 1; p >= 0; p--) {
    if (s[p] >= "0" && s[p] <= "9" && ++count === digits) return p;
  }
  return 0;
}

export function CommaInput({
  value,
  onChange,
  allowDecimal = false,
  min = 0,
  max,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
  className: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const editing = useRef(false);
  const caretTarget = useRef<number | null>(null);
  const [text, setText] = useState(() => formatNumber(value, allowDecimal));

  // Re-sync from the outside only when the field isn't being edited (e.g. reset,
  // property-type switch, or rent scaling driven by the invested amount).
  useEffect(() => {
    if (!editing.current) setText(formatNumber(value, allowDecimal));
  }, [value, allowDecimal]);

  useLayoutEffect(() => {
    if (caretTarget.current === null || !ref.current) return;
    const pos = caretForDigits(text, caretTarget.current);
    ref.current.setSelectionRange(pos, pos);
    caretTarget.current = null;
  }, [text]);

  return (
    <input
      ref={ref}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={text}
      onFocus={() => {
        editing.current = true;
      }}
      onBlur={() => {
        editing.current = false;
        setText(formatNumber(value, allowDecimal));
      }}
      onChange={(e) => {
        const el = e.target;
        caretTarget.current = digitsAfter(el.value, el.selectionStart ?? el.value.length);
        const { formatted, num } = parseInput(el.value, allowDecimal);
        setText(formatted);
        if (!Number.isFinite(num)) return;
        let clamped = Math.max(min, num);
        if (typeof max === "number") clamped = Math.min(max, clamped);
        onChange(clamped);
      }}
      className={className}
    />
  );
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs text-[#526976]">{label}</span>
      <span className="flex w-[128px] shrink-0 items-center rounded-md border border-[#cfd9df] bg-white pl-2.5 focus-within:border-[#0a4b72] focus-within:ring-2 focus-within:ring-[#0a4b72]/15">
        {prefix && <span className="text-xs text-[#93a0a9]">{prefix}</span>}
        <CommaInput
          value={value}
          onChange={onChange}
          allowDecimal={step % 1 !== 0}
          min={min}
          max={max}
          // 16px keeps iOS Safari from zooming in when the field is focused.
          className="h-9 w-full bg-transparent px-1.5 text-right text-[16px] tabular-nums text-[#263f4f] outline-none"
        />
        {suffix && <span className="pr-2.5 text-xs text-[#93a0a9]">{suffix}</span>}
      </span>
    </label>
  );
}

/** The one headline input — the invested amount — shown large and clearly primary. */
export function PrimaryAmountField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8291a0]">{label}</span>
      <span className="mt-1.5 flex items-center rounded-lg border border-[#cfd9df] bg-white px-3 focus-within:border-[#0a4b72] focus-within:ring-2 focus-within:ring-[#0a4b72]/15">
        <span className="text-base text-[#93a0a9]">$</span>
        <CommaInput
          value={value}
          onChange={onChange}
          // 17px (≥16) keeps iOS Safari from zooming on focus.
          className="h-11 w-full bg-transparent px-2 text-right text-[17px] font-semibold tabular-nums text-[#0a2d46] outline-none"
        />
      </span>
      {help && <span className="mt-1.5 block text-[11px] leading-4 text-[#93a0a9]">{help}</span>}
    </label>
  );
}
