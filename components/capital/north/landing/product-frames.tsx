"use client";

/**
 * Marketing "product screenshots" built from the REAL portal components
 * (StatCard, KeyFactsCard, AssetGallery, FundBannerCard) fed with real,
 * source-dated offering data. These are not CSS approximations — what a
 * visitor sees here is the same surface an investor sees after signing in.
 *
 * The portal components are shadcn-token driven; the landing never sets
 * `.dark`, so they resolve to their normal light skin inside BrowserFrame.
 */

import { Building2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { tx } from "@/lib/i18n/localize";
import {
  formatCurrencyCad,
  formatReturnPhrase,
} from "@/lib/capital/present";
import { taxonomyLabel } from "@/lib/capital/taxonomies";
import { useTaxonomies } from "@/components/capital/north/TaxonomyProvider";
import type {
  Lang,
  Property,
  PublicOfferingPreview,
  PublicOfferingPropertyPreview,
} from "@/lib/capital/types";
import {
  AssetGallery,
  KeyFactsCard,
  type KeyFact,
} from "@/components/capital/offering-ui";
import { FundBannerCard } from "@/components/capital/FundBannerCard";
import { BrowserFrame, GrowthChart, shortRange } from "./primitives";
import type { LandingCopy } from "./copy";

/* ------------------------------------------------------------------ */
/* Adapters: PublicOfferingPreview → portal component props            */
/* ------------------------------------------------------------------ */

function publicKeyFacts(
  offering: PublicOfferingPreview,
  c: LandingCopy,
  lang: Lang,
): KeyFact[] {
  const L = c.frames.factLabels;
  const facts: KeyFact[] = [];
  if (offering.targetReturn) {
    facts.push({
      label: L.targetReturn,
      value: formatReturnPhrase(offering.targetReturn.value, lang),
      provenance: offering.targetReturn,
    });
  }
  if (offering.targetDistribution) {
    facts.push({
      label: L.distribution,
      value: formatReturnPhrase(offering.targetDistribution.value, lang),
      provenance: offering.targetDistribution,
    });
  }
  if (offering.minimumInvestment) {
    facts.push({
      label: L.minimum,
      value: formatCurrencyCad(offering.minimumInvestment.value, lang),
      provenance: offering.minimumInvestment,
    });
  }
  if (offering.riskProfile) {
    facts.push({ label: L.risk, value: tx(offering.riskProfile, lang) });
  }
  if (offering.term) {
    facts.push({
      label: L.term,
      value: formatReturnPhrase(offering.term.value, lang),
      provenance: offering.term,
    });
  }
  if (offering.aum) {
    facts.push({ label: L.aum, value: offering.aum.value, provenance: offering.aum });
  }
  return facts;
}

/**
 * AssetGallery takes the portal's full Property shape. The public preview only
 * carries verified properties, so `verificationStatus: "verified"` is truthful.
 */
function toGalleryProperty(p: PublicOfferingPropertyPreview): Property {
  return {
    id: p.id,
    offeringIds: [],
    managerId: "",
    name: p.name,
    city: p.city,
    province: p.province,
    country: "Canada",
    latitude: p.latitude,
    longitude: p.longitude,
    assetClassId: p.assetClassId,
    status: p.status,
    media: p.media,
    verificationStatus: "verified",
  };
}

/* ------------------------------------------------------------------ */
/* Static replica of the portal detail-page tab nav                    */
/* ------------------------------------------------------------------ */

function TabStrip({ tabs, active }: { tabs: string[]; active: number }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-sm">
      {tabs.map((tab, index) => (
        <span
          key={tab}
          className={`flex min-h-9 min-w-max flex-1 items-center justify-center rounded-md px-3 text-xs font-semibold ${
            index === active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}
/* ------------------------------------------------------------------ */
/* Frame 1 — investor dashboard (stat row + available funds)           */
/* ------------------------------------------------------------------ */

export function DashboardFrame({
  offerings,
  c,
  isPreview = false,
}: {
  offerings: PublicOfferingPreview[];
  c: LandingCopy;
  isPreview?: boolean;
}) {
  const { lang } = useLang();
  const { strategies } = useTaxonomies();

  return (
    <BrowserFrame label={c.frames.portfolio}>
      <div className="bg-[#eef3f4] p-3 sm:p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {isPreview ? c.frames.exampleFunds : c.frames.availableFunds}
        </p>
        <div className="space-y-3">
          {offerings.slice(0, 2).map((offering) => (
            <FundBannerCard
              key={offering.id}
              image={offering.media?.card?.src ?? offering.media?.banner?.src}
              imageAlt={tx(offering.media?.card?.alt, lang)}
              logo={offering.media?.logo?.src}
              name={tx(offering.shortName, lang)}
              manager={tx(offering.managerName, lang)}
              strategyLabel={
                offering.strategyIds[0]
                  ? taxonomyLabel(strategies, offering.strategyIds[0], lang)
                  : undefined
              }
              summary={tx(offering.summary, lang)}
              compact
            />
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Open-funds frame — every open fund, target returns aligned          */
/* ------------------------------------------------------------------ */

export function OpenFundsFrame({
  offerings,
  c,
}: {
  offerings: PublicOfferingPreview[];
  c: LandingCopy;
}) {
  const { lang } = useLang();

  return (
    <BrowserFrame label={c.frames.openFunds}>
      <div className="space-y-3 bg-[#eef3f4] p-3 sm:p-4">
        {offerings.map((offering) => (
          <div
            key={offering.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-4 sm:p-5"
          >
            {offering.media?.logo?.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={offering.media.logo.src}
                alt=""
                className="h-10 w-16 shrink-0 rounded bg-white object-contain p-1 shadow-sm"
              />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                <Building2 className="size-5 text-primary" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5 text-foreground sm:truncate">
                {tx(offering.shortName, lang)}
              </p>
              <p className="mt-0.5 text-xs leading-4 text-muted-foreground sm:truncate">
                {tx(offering.managerName, lang)}
              </p>
            </div>
            {offering.targetReturn && (
              <div className="col-start-2 text-left sm:col-auto sm:text-right">
                <p className="font-serif text-2xl font-semibold leading-none text-foreground">
                  {shortRange(offering.targetReturn.value)}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {c.frames.targetReturn}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Frame 2 — offering detail (banner + tabs + real key facts)          */
/* ------------------------------------------------------------------ */

export function OfferingDetailFrame({
  offering,
  c,
}: {
  offering: PublicOfferingPreview;
  c: LandingCopy;
}) {
  const { lang } = useLang();
  const { strategies } = useTaxonomies();
  const banner = offering.media?.banner?.src ?? offering.media?.card?.src;
  const strategy = offering.strategyIds[0]
    ? taxonomyLabel(strategies, offering.strategyIds[0], lang)
    : undefined;

  return (
    <BrowserFrame label={c.frames.detail}>
      <div className="space-y-3 bg-[#eef3f4] p-3 sm:p-4">
        <div className="relative h-24 overflow-hidden rounded-xl border border-border bg-[#0a2d46] sm:h-28">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-[linear-gradient(135deg,#123f5e,#071c2c)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/85 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-3">
            {offering.media?.logo?.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={offering.media.logo.src}
                alt=""
                className="h-9 max-w-24 rounded bg-white object-contain p-1.5 shadow-sm"
              />
            )}
            <p className="font-serif text-lg font-semibold text-white">
              {tx(offering.shortName, lang)}
            </p>
          </div>
        </div>
        <TabStrip tabs={c.frames.tabs} active={0} />
        <div className="[&>div]:p-4 sm:[&>div]:p-5">
          <KeyFactsCard
            strategyLabel={strategy}
            facts={publicKeyFacts(offering, c, lang).slice(0, 6)}
            lang={lang}
          />
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Frame 3 — performance (published returns, exactly as filed)         */
/* ------------------------------------------------------------------ */

export function PerformanceFrame({
  offering,
  c,
}: {
  offering: PublicOfferingPreview;
  c: LandingCopy;
}) {
  const { lang } = useLang();
  const rows = (offering.performance ?? []).slice(-6);

  return (
    <BrowserFrame label={c.frames.performance}>
      <div className="space-y-3 bg-[#eef3f4] p-3 sm:p-4">
        <TabStrip tabs={c.frames.tabs} active={1} />
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-serif text-base font-semibold text-foreground">
              {c.frames.historical}
            </p>
            <span className="rounded bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {c.frames.historicalTag}
            </span>
          </div>
          <div className="mt-3 h-16 overflow-hidden sm:h-20">
            <GrowthChart className="h-full" height={80} />
          </div>
          {rows.length > 0 && (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="rounded-l px-3 py-2">{c.frames.tabs[1]}</th>
                  <th className="rounded-r px-3 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={tx(row.period, lang)} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">
                      {tx(row.period, lang)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Frame 4 — buildings (fact-sheet photography + verified assets)      */
/* ------------------------------------------------------------------ */

export function BuildingsFrame({
  offering,
  c,
}: {
  offering: PublicOfferingPreview;
  c: LandingCopy;
}) {
  const { lang } = useLang();
  const gallery = offering.media?.gallery ?? [];
  const properties = offering.properties.slice(0, 3).map(toGalleryProperty);

  return (
    <BrowserFrame label={c.frames.buildings}>
      <div className="space-y-3 bg-[#eef3f4] p-3 sm:p-4">
        <TabStrip tabs={c.frames.tabs} active={2} />
        {gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {gallery.slice(0, 2).map((image) => (
              <div key={image.src} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={tx(image.alt, lang)}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        <div className="[&>div]:grid-cols-1 sm:[&>div]:grid-cols-3 lg:[&>div]:grid-cols-3">
          <AssetGallery properties={properties} lang={lang} />
        </div>
      </div>
    </BrowserFrame>
  );
}
