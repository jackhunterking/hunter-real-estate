"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  ENTRY_DISCLAIMER_EXIT_URL,
  ENTRY_DISCLAIMER_STORAGE_KEY,
  ENTRY_DISCLAIMER_VERSION,
  entryDisclaimerFor,
} from "@/lib/capital/entry-disclaimer";
import { ENTRY_DISCLAIMER_ENABLED } from "@/lib/capital/feature-flags";
import { NORTH_BASE } from "./NorthBrand";

type Acknowledgement = { version: number; acknowledgedAt: string };

function storedAcknowledgement(): Acknowledgement | null {
  try {
    const raw = window.localStorage.getItem(ENTRY_DISCLAIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Acknowledgement>;
    return typeof parsed?.version === "number" ? (parsed as Acknowledgement) : null;
  } catch {
    // Private browsing, disabled storage, or corrupt JSON — show the notice.
    return null;
  }
}

/**
 * The one-time entry acknowledgement for the advisory surface.
 *
 * Blocking is the point: a reader should meet the registration, no-offer and
 * risk statements before private-market content, not after. But a blocked
 * reader must always have a way out that is not "agree" — hence the explicit
 * "Leave this site" link. Escape and backdrop clicks do not dismiss it, because
 * a stray keypress must not count as having read anything.
 */
export function EntryDisclaimer() {
  const { lang } = useLang();
  const copy = entryDisclaimerFor(lang);
  // `null` until the client has read storage, so the server and the first
  // client render agree and nothing flashes for a returning visitor.
  const [open, setOpen] = useState<boolean | null>(null);
  const acknowledgeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ENTRY_DISCLAIMER_ENABLED) {
      setOpen(false);
      return;
    }
    const stored = storedAcknowledgement();
    // A stored acknowledgement of superseded wording does not carry forward.
    setOpen(stored?.version !== ENTRY_DISCLAIMER_VERSION);
  }, []);

  useEffect(() => {
    if (!open) return;
    acknowledgeRef.current?.focus();
    // Hold the page still underneath; the notice owns the viewport.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  function acknowledge() {
    const record: Acknowledgement = {
      version: ENTRY_DISCLAIMER_VERSION,
      acknowledgedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(ENTRY_DISCLAIMER_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Storage refused — let them through rather than trapping the reader in a
      // loop they cannot escape. They will see the notice again next visit.
    }
    setOpen(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.ariaLabel}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0a1c2b]/70 p-0 sm:items-center sm:p-6"
    >
      <div className="max-h-[92dvh] w-full max-w-[640px] overflow-y-auto rounded-t-xl bg-white shadow-[0_10px_40px_rgba(10,28,43,0.25)] sm:rounded-xl">
        <div className="px-6 pb-6 pt-7 sm:px-8 sm:pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a949c]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-[#0a2d46]">{copy.title}</h2>

          <div className="mt-4 space-y-3">
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-[13px] leading-6 text-[#4a5865]">
                {paragraph}
              </p>
            ))}
          </div>

          <Link
            href={`${NORTH_BASE}/legal`}
            className="mt-4 inline-block text-[13px] font-semibold text-[#0a2d46] underline underline-offset-2 hover:text-[#14486c]"
          >
            {copy.legalLink}
          </Link>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#e3e8ec] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={ENTRY_DISCLAIMER_EXIT_URL}
              className="text-center text-[13px] text-[#65737e] underline underline-offset-2 hover:text-[#0a2d46] sm:text-left"
            >
              {copy.leave}
            </a>
            <button
              ref={acknowledgeRef}
              type="button"
              onClick={acknowledge}
              className="h-11 rounded-md bg-[#0a2d46] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#14486c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a2d46]"
            >
              {copy.acknowledge}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
