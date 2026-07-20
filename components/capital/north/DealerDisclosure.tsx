"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  INVESTMENT_BASE_PATH,
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
  const linkClass = tone === "dark" ? "text-[#e2ca86] hover:text-white" : "text-[#0a4b72] hover:text-[#072f49]";
  const text = level === "micro"
    ? copy.microDisclosure
    : level === "transactional"
      ? copy.transactionalDisclosure
      : copy.shortDisclosure;

  if (level === "full") {
    const compensation = PARVIS_RELATIONSHIP.compensationDisclosure[lang];
    return (
      <section className={`rounded-xl border border-[#d8dfe3] bg-white p-6 sm:p-8 ${className}`} aria-labelledby="dealer-disclosure-title">
        <h2 id="dealer-disclosure-title" className="font-serif text-2xl font-semibold text-[#172b3a] sm:text-3xl">
          {copy.legalTitle}
        </h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[#5f6d77]">
          {copy.legalParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {compensation && <p>{compensation}</p>}
        </div>
        <a href={PARVIS_RELATIONSHIP.disclosuresUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex text-sm font-semibold text-[#0a4b72] hover:underline">
          {copy.parvisLink}
        </a>
      </section>
    );
  }

  return (
    <aside className={`text-xs leading-5 ${textClass} ${className}`} aria-label={copy.legalTitle}>
      <p>{text}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
        <Link href={`${INVESTMENT_BASE_PATH}/legal`} className={linkClass}>{copy.disclosuresLink}</Link>
        <a href={PARVIS_RELATIONSHIP.disclosuresUrl} target="_blank" rel="noreferrer" className={linkClass}>{copy.parvisLink}</a>
      </div>
    </aside>
  );
}
