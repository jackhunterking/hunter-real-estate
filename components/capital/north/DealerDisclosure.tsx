"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { tx } from "@/lib/i18n/localize";
import {
  PARVIS_RELATIONSHIP,
  investmentBrandFor,
} from "@/lib/capital/investment-brand";

export type DealerDisclosureLevel = "micro" | "short" | "transactional" | "full";

export function DealerDisclosure({
  level = "micro",
  tone = "light",
  className = "",
}: {
  level?: DealerDisclosureLevel;
  tone?: "light" | "dark";
  className?: string;
}) {
  const { lang } = useLang();
  const copy = investmentBrandFor(lang);
  const textClass = tone === "dark" ? "text-white/62" : "text-[#64737d]";
  const text = level === "micro"
    ? copy.microDisclosure
    : level === "transactional"
      ? copy.transactionalDisclosure
      : copy.shortDisclosure;

  if (level === "full") {
    const compensation = tx(PARVIS_RELATIONSHIP.compensationDisclosure, lang);
    return (
      <section className={`rounded-xl border border-[#d8dfe3] bg-white p-6 sm:p-8 ${className}`} aria-labelledby="dealer-disclosure-title">
        <h2 id="dealer-disclosure-title" className="font-serif text-2xl font-semibold text-[#172b3a] sm:text-3xl">
          {copy.legalTitle}
        </h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[#5f6d77]">
          {copy.legalParagraphs.map((paragraph: string) => <p key={paragraph}>{paragraph}</p>)}
          {compensation && <p>{compensation}</p>}
        </div>
        <p className="mt-6 text-sm text-[#64737d]">
          {copy.parvisLink}
        </p>
      </section>
    );
  }

  return (
    <aside className={`text-xs leading-5 ${textClass} ${className}`} aria-label={copy.legalTitle}>
      <p>{text}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-current">
        <span>{copy.disclosuresLink}</span>
        <span>{copy.parvisLink}</span>
      </div>
    </aside>
  );
}
