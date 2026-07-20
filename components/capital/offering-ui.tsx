"use client";

/**
 * Reusable presentation primitives for the offering surfaces (detail, portfolio,
 * discover). These are intentionally token-driven (shadcn/theme.css variables) so
 * they render correctly in light and dark and stay consistent across the portal.
 *
 * They never fetch or mutate — callers pass already-derived, localized values.
 */
import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Info,
  type LucideIcon,
  MapPin,
  MapPinned,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import type { Lang, OfferingDocument, Property, ServiceProviders, SourcedValue } from "@/lib/capital/types";
import { formatSourceLine, localizeVerification, resolveImage } from "@/lib/capital/present";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Calm provenance — an unobtrusive info affordance, detail on hover   */
/* ------------------------------------------------------------------ */

export function ProvenanceChip({ value, lang }: { value?: SourcedValue; lang: Lang }) {
  const line = formatSourceLine(value, lang);
  if (!value || !line) return null;
  return (
    <span
      tabIndex={0}
      title={`${value.sourceId} · ${line}`}
      aria-label={`${value.sourceId} · ${line}`}
      className="ml-1 inline-flex translate-y-[1px] cursor-help text-muted-foreground/70 hover:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Info className="size-3.5" aria-hidden />
    </span>
  );
}

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

export type KeyFact = { label: string; value: string; provenance?: SourcedValue };

export function KeyFactsCard({
  strategyLabel,
  facts,
  lang,
}: {
  strategyLabel?: string;
  facts: KeyFact[];
  lang: Lang;
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
            <dd className="mt-1 text-[15px] font-semibold leading-6 text-foreground">
              {fact.value}
              <ProvenanceChip value={fact.provenance} lang={lang} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
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
        const image = resolveImage(p.media?.card ?? p.media?.gallery?.[0], p.id, p.name[lang], lang);
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
              <p className="truncate text-sm font-semibold text-foreground">{p.name[lang]}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {p.address?.[lang] ? `${p.address[lang]} · ` : ""}
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
          <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">{document.title[lang]}</h3>
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
          <object data={document.href} type="application/pdf" className="h-[70vh] w-full" aria-label={document.title[lang]}>
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
/* Trust strip — independent auditor / legal / appraiser + verified    */
/* ------------------------------------------------------------------ */

export function TrustStrip({
  providers,
  verifiedAt,
  copy,
  className,
}: {
  providers?: ServiceProviders;
  verifiedAt?: string;
  copy: { heading: string; auditor: string; legalCounsel: string; appraiser: string; verified: string };
  className?: string;
}) {
  const rows = [
    providers?.auditor ? { label: copy.auditor, ...providers.auditor } : null,
    providers?.legalCounsel ? { label: copy.legalCounsel, ...providers.legalCounsel } : null,
    providers?.appraiser ? { label: copy.appraiser, ...providers.appraiser } : null,
  ].filter(Boolean) as { label: string; name: string; url?: string }[];

  if (!rows.length && !verifiedAt) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-secondary/50 p-5 sm:p-6", className)}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-[color:var(--ok)]" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">{copy.heading}</h2>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{row.label}</p>
            {row.url ? (
              <a href={row.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary">
                {row.name}
                <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
              </a>
            ) : (
              <p className="mt-1 text-sm font-semibold text-foreground">{row.name}</p>
            )}
          </div>
        ))}
        {verifiedAt && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{copy.verified}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ok)]">
              <CheckCircle2 className="size-3.5" aria-hidden />
              {verifiedAt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
