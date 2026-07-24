"use client";

/**
 * Reusable presentation primitives for the offering surfaces (detail, portfolio,
 * discover). These are intentionally token-driven (shadcn/theme.css variables) so
 * they render correctly in light and dark and stay consistent across the portal.
 *
 * They never fetch or mutate — callers pass already-derived, localized values.
 */
import { useState } from "react";
import { tx } from "@/lib/i18n/localize";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  type LucideIcon,
  MapPin,
  MapPinned,
  Presentation,
} from "lucide-react";
import type { Lang, OfferingBundle, OfferingDocument, Property, ServiceProviders, SourcedValue } from "@/lib/capital/types";
import type { DocumentTermGroup } from "@/lib/capital/key-facts";
import { localizeVerification, primaryShareClass, resolveImage } from "@/lib/capital/present";
import { computeInvestmentIncome } from "@/lib/capital/performance";
import { CommaInput } from "@/components/capital/north/CompareUI";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Summary stat card (the 3-up row the user likes)                     */
/* ------------------------------------------------------------------ */

export function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon?: LucideIcon }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      {Icon && (
        <span className="mb-3 inline-grid size-10 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <p className="font-serif text-2xl font-semibold leading-tight text-foreground sm:text-[1.75rem]">{value}</p>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Key-facts card (Parvis-style two-column, with a strategy pill)      */
/* ------------------------------------------------------------------ */

export type KeyFact = { label: string; value: string; provenance?: SourcedValue; note?: string };

export function KeyFactsCard({
  strategyLabel,
  facts,
}: {
  strategyLabel?: string;
  facts: KeyFact[];
}) {
  if (!facts.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
      {strategyLabel && (
        <span className="inline-flex items-center rounded-full bg-gold/15 px-3.5 py-1.5 text-sm font-semibold text-gold-foreground">
          {strategyLabel}
        </span>
      )}
      <dl className={cn("grid gap-x-8 gap-y-5 sm:grid-cols-2", strategyLabel && "mt-6")}>
        {facts.map((fact, index) => (
          <div key={`${fact.label}-${index}`} className="border-b border-border/70 pb-3">
            <dt className="text-xs font-medium text-muted-foreground">{fact.label}</dt>
            <dd className="mt-1 text-[15px] font-semibold leading-6 text-foreground">{fact.value}</dd>
            {fact.note && <p className="mt-1 text-xs font-normal leading-5 text-muted-foreground">{fact.note}</p>}
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Document terms — the published terms, under the document they cite  */
/* ------------------------------------------------------------------ */

/**
 * The terms a document sets out, collapsed by default. These are the same
 * fund-published facts that used to crowd the Key facts card; filing them under
 * their own document keeps them one click away and makes their provenance the
 * obvious thing about them.
 */
export function DocumentTermsDisclosure({
  groups,
  lang,
  copy,
}: {
  groups: DocumentTermGroup[];
  lang: Lang;
  copy: { summary: string; page: string };
}) {
  if (!groups.length) return null;
  return (
    <details className="group mt-4 border-t border-border pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-primary hover:underline [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        {copy.summary}
      </summary>
      <div className="mt-4 space-y-5">
        {groups.map((group) => (
          <section key={group.key}>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {tx(group.title, lang)}
            </h4>
            <dl className="mt-2 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {group.facts.map((fact) => (
                <div key={fact.id} className="border-b border-border/70 pb-3">
                  <dt className="text-xs font-medium text-muted-foreground">{tx(fact.label, lang)}</dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground">{tx(fact.value, lang)}</dd>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {fact.effectiveDate}
                    {fact.sourcePage ? ` · ${copy.page}${fact.sourcePage}` : ""}
                  </p>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Highlights & fun facts (location counts + OM-style statements)      */
/* ------------------------------------------------------------------ */

export function Highlights({
  properties,
  funFacts,
  copy,
}: {
  properties: Property[];
  funFacts: string[];
  copy: { cities: string; buildings: string; locations: string };
}) {
  const cityCount = new Set(properties.map((p) => p.city)).size;
  const locationCount = new Set(properties.map((p) => `${p.city}:${p.province}`)).size;
  const counts = [
    { icon: MapPin, value: cityCount, label: copy.cities },
    { icon: Building2, value: properties.length, label: copy.buildings },
    { icon: MapPinned, value: locationCount, label: copy.locations },
  ].filter((item) => item.value > 0);

  if (!counts.length && !funFacts.length) return null;

  return (
    <div className="space-y-4">
      {counts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {counts.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {funFacts.length > 0 && (
        <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {funFacts.map((fact) => (
            <li key={fact} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              {fact}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Asset gallery — real building photos, graceful gradient fallback    */
/* ------------------------------------------------------------------ */

export function AssetGallery({ properties, lang }: { properties: Property[]; lang: Lang }) {
  if (!properties.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => {
        const image = resolveImage(p.media?.card ?? p.media?.gallery?.[0], p.id, tx(p.name, lang), lang);
        const verified = p.verificationStatus === "verified";
        return (
          <figure key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <div
              className="relative flex aspect-[4/3] items-center justify-center"
              style={image.src ? undefined : { backgroundImage: image.gradient }}
            >
              {image.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif text-2xl font-semibold text-white/85">{image.initials}</span>
              )}
              {verified && (
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ok)] shadow-sm">
                  <CheckCircle2 className="size-3" aria-hidden />
                  {localizeVerification(p.verificationStatus, lang)}
                </span>
              )}
            </div>
            <figcaption className="p-3">
              <p className="truncate text-sm font-semibold text-foreground">{tx(p.name, lang)}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {tx(p.address, lang) ? `${tx(p.address, lang)} · ` : ""}
                {p.city}, {p.province}
              </p>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Presentation — inline surface (cover + open), post-sign-up          */
/* ------------------------------------------------------------------ */

export function PresentationCard({
  document,
  coverSrc,
  lang,
  copy,
}: {
  document: OfferingDocument;
  coverSrc?: string;
  lang: Lang;
  copy: { title: string; open: string; unavailable: string; version: string };
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5">
        <div className="relative grid h-24 w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-primary sm:w-40">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="h-full w-full object-cover opacity-80" />
          ) : null}
          <Presentation className="absolute size-8 text-white/90" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-foreground">{copy.title}</p>
          <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">{tx(document.title, lang)}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.version} {document.version} · {document.effectiveDate}
          </p>
        </div>
        <div className="shrink-0">
          {document.href ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="size-4" aria-hidden />
              {copy.open}
            </button>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">{copy.unavailable}</span>
          )}
        </div>
      </div>
      {expanded && document.href && (
        <div className="border-t border-border">
          <object data={document.href} type="application/pdf" className="h-[70vh] w-full" aria-label={tx(document.title, lang)}>
            <a href={document.href} target="_blank" rel="noreferrer" className="block p-6 text-sm font-semibold text-primary hover:underline">
              {copy.open} <ExternalLink className="ml-1 inline size-4" aria-hidden />
            </a>
          </object>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Service providers — a role and a firm name, nothing else. Hunter    */
/* audits nothing here, so the card carries no claim of its own: no    */
/* shield, no green tick, no "verified" wording, and no date. Each     */
/* firm's engagement scope belongs in the documents that set it out,   */
/* not in a caption underneath a name.                                 */
/* ------------------------------------------------------------------ */

export function ServiceProvidersCard({
  providers,
  copy,
  className,
}: {
  providers?: ServiceProviders;
  copy: {
    auditor: string;
    legalCounsel: string;
    appraiser: string;
  };
  className?: string;
}) {
  const rows = [
    providers?.auditor ? { label: copy.auditor, ...providers.auditor } : null,
    providers?.legalCounsel ? { label: copy.legalCounsel, ...providers.legalCounsel } : null,
    providers?.appraiser ? { label: copy.appraiser, ...providers.appraiser } : null,
  ].filter(Boolean) as { label: string; name: string; url?: string }[];

  if (!rows.length) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-card px-5 py-5 sm:px-6", className)}>
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{row.label}</p>
            {row.url ? (
              <a href={row.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary">
                {row.name}
                <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
              </a>
            ) : (
              <p className="mt-1.5 text-sm font-semibold text-foreground">{row.name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Performance-tab income calculator                                   */
/* ------------------------------------------------------------------ */

const INCOME_CALC_COPY = {
  en: {
    title: "See it on your amount",
    help: "Enter an amount to see what it would have earned in this fund — looking back, not a projection.",
    tag: "Historical—not a forecast",
    amountLabel: "Amount invested",
    caption: "What your amount would have earned each year, at this fund’s published returns",
    year: "Year",
    ret: "Return",
    perYear: "Income / year",
    perMonth: "Income / month",
    average: "Average / yr",
  },
  tr: {
    title: "Kendi tutarınızda görün",
    help: "Bu yatırımda ne kazandırmış olacağını görmek için bir tutar girin — geriye dönük, bir öngörü değil.",
    tag: "Geçmiş bilgi—tahmin değildir",
    amountLabel: "Yatırılan tutar",
    caption: "Girdiğiniz tutarın, bu yatırımın yayımlanan getirilerinde her yıl ne kazandıracağı",
    year: "Yıl",
    ret: "Getiri",
    perYear: "Gelir / yıl",
    perMonth: "Gelir / ay",
    average: "Ortalama / yıl",
  },
} as const;

const INCOME_PRESETS = [10000, 25000, 100000, 500000, 1000000];
const INCOME_DEFAULT_AMOUNT = 25000;

function presetLabel(value: number): string {
  if (value >= 1_000_000) return `$${value / 1_000_000}M`;
  if (value >= 1000) return `$${value / 1000}k`;
  return `$${value}`;
}

/**
 * Backward-looking passive-income illustration for the Performance tab. The
 * amount is a free, uncapped entry (any figure up to $1M+); the table applies
 * the fund's own published calendar-year total returns to it, per year and per
 * month, with an average row. Renders nothing when the fund has no usable
 * calendar-year history, so it is safe to drop onto every offering.
 */
export function PerformanceIncomeCalculator({ offering, lang }: { offering: OfferingBundle; lang: Lang }) {
  const c = lang === "tr" ? INCOME_CALC_COPY.tr : INCOME_CALC_COPY.en;
  const minimum = primaryShareClass(offering)?.minimumInvestment?.value;
  const [amount, setAmount] = useState<number>(() =>
    Math.max(1000, Math.round(minimum && minimum > INCOME_DEFAULT_AMOUNT ? minimum : INCOME_DEFAULT_AMOUNT)),
  );

  const result = computeInvestmentIncome(amount, offering.trailingReturns);
  if (!result) return null;

  const nf = new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
  const money = (n: number) => nf.format(Math.round(n));
  const pctText = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  const pctClass = (n: number) => (n >= 0 ? "text-ok" : "text-destructive");

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-foreground">
            <span className="h-4 w-[3px] shrink-0 rounded-full bg-gold" aria-hidden />
            {c.title}
          </h2>
          <p className="mt-1.5 pl-[15px] text-sm text-muted-foreground">{c.help}</p>
        </div>
        <span className="w-fit shrink-0 rounded bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {c.tag}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <label className="min-w-[200px] flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{c.amountLabel}</span>
          <span className="mt-1.5 flex items-center rounded-lg border border-border bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <span className="text-lg text-muted-foreground">$</span>
            <CommaInput
              value={amount}
              onChange={setAmount}
              min={0}
              // ≥16px keeps iOS Safari from zooming on focus.
              className="h-12 w-full bg-transparent px-2 text-left font-serif text-2xl font-semibold tabular-nums text-foreground outline-none"
            />
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {INCOME_PRESETS.map((preset) => {
            const active = amount === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() => setAmount(preset)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {presetLabel(preset)}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{c.caption}</p>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-secondary/40">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">{c.year}</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">{c.ret}</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">{c.perYear}</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">{c.perMonth}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.rows.map((row) => (
              <tr key={row.year}>
                <th scope="row" className="px-4 py-3 text-sm font-medium text-foreground sm:px-5">{row.year}</th>
                <td className={`px-4 py-3 text-right text-sm font-semibold tabular-nums sm:px-5 ${pctClass(row.pct)}`}>{pctText(row.pct)}</td>
                <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-foreground sm:px-5">{money(row.incomePerYear)}</td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground sm:px-5">{money(row.incomePerMonth)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-secondary/40">
              <th scope="row" className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground sm:px-5">{c.average}</th>
              <td className={`px-4 py-3 text-right text-sm font-bold tabular-nums sm:px-5 ${pctClass(result.avgPct)}`}>{`${result.avgPct >= 0 ? "+" : ""}${result.avgPct.toFixed(1)}%`}</td>
              <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-foreground sm:px-5">{money(result.avgIncomePerYear)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-foreground sm:px-5">{money(result.avgIncomePerMonth)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
