"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 224; // px — matches Tailwind w-56

/**
 * The single info affordance used across the platform: a small (i) dot that
 * reveals its explanation **on click** (never hover), so the fine print only
 * surfaces when the reader asks for it. The panel is portalled to <body> and
 * clamped to the viewport, so it renders identically wherever the dot sits —
 * a KPI-tile label, an inline key-fact value, anywhere. Closes on outside
 * click, Escape, scroll, or resize.
 *
 * Styling is deliberately theme-neutral (muted dot, white panel) so it reads
 * the same on every surface regardless of that surface's palette.
 */
export function InfoPopover({
  content,
  label,
  className,
}: {
  content: ReactNode;
  /** Accessible name for the trigger (e.g. "What this means: Total invested"). */
  label: string;
  /** Extra classes for the trigger (positioning nudges like `ml-1`). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    // Clamp within the viewport; guard the upper bound so a tiny/zero innerWidth
    // can never resolve to a negative (off-screen) left.
    const maxLeft = Math.max(margin, window.innerWidth - PANEL_WIDTH - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);
    setCoords({ top: rect.bottom + 6, left });
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Reposition would drift with the page; closing is simpler and expected.
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "inline-grid size-4 shrink-0 place-items-center rounded-full align-middle text-[#9aa4ac] transition-colors hover:text-[#4a5763] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa4ac]/40",
          className,
        )}
      >
        <Info className="size-[13px]" aria-hidden />
      </button>
      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            style={{ position: "fixed", top: coords.top, left: coords.left, width: PANEL_WIDTH }}
            className="z-[80] rounded-lg border border-[#e3e9ed] bg-white p-3 text-[11px] leading-4 text-[#5c6a74] shadow-[0_10px_28px_rgba(16,38,56,0.14)]"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
