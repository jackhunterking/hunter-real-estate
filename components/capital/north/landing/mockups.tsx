"use client";

/**
 * Data-driven offering cards for the landing page.
 *
 * The featured card composes the SAME `FundBannerCard` the authenticated
 * dashboard uses, so the marketing surface and the product stay uniform.
 * All figures come from real, source-dated offering data via present.ts.
 */

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { tx } from "@/lib/i18n/localize";
import {
  formatCurrencyCad,
  formatDate,
  formatReturnPhrase,
  formatSourceLine,
} from "@/lib/capital/present";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import type { PublicOfferingPreview } from "@/lib/capital/types";
import { FundBannerCard } from "@/components/capital/FundBannerCard";
import { NORTH_BASE } from "../NorthBrand";
import { localizedPortfolioFact, shortRange } from "./primitives";
import type { LandingCopy } from "./copy";

type Metric = { label: string; value: string; source?: string };

function offeringMetrics(
  offering: PublicOfferingPreview,
  c: LandingCopy,
  lang: ReturnType<typeof useLang>["lang"],
): Metric[] {
  const portfolioFact = offering.portfolioFacts[0];
  const metrics: Metric[] = [
    {
      label: c.card.minimum,
      value: offering.minimumInvestment
        ? formatCurrencyCad(offering.minimumInvestment.value, lang)
        : c.card.reviewRequired,
      source: offering.minimumInvestment
        ? formatSourceLine(offering.minimumInvestment, lang) ?? undefined
        : undefined,
    },
    {
      label: c.card.distribution,
      value: offering.targetDistribution
        ? formatReturnPhrase(offering.targetDistribution.value, lang)
        : c.card.reviewRequired,
      source: offering.targetDistribution
        ? formatSourceLine(offering.targetDistribution, lang) ?? undefined
        : undefined,
    },
    {
      label: c.card.portfolio,
      value: portfolioFact
        ? localizedPortfolioFact(portfolioFact.value, lang)
        : `${offering.properties.length} ${c.card.verifiedLocations}`,
      source: portfolioFact
        ? formatSourceLine(portfolioFact, lang) ?? undefined
        : `${c.card.verifiedAsOf} · ${formatDate(offering.verifiedAt, lang)}`,
    },
  ];
  if (offering.aum) {
    metrics.push({
      label: c.card.aum,
      value: offering.aum.value,
      source: formatSourceLine(offering.aum, lang) ?? undefined,
    });
  } else {
    metrics.push({
      label: c.card.term,
      value: offering.term ? formatReturnPhrase(offering.term.value, lang) : c.card.reviewRequired,
      source: offering.term ? formatSourceLine(offering.term, lang) ?? undefined : undefined,
    });
  }
  return metrics;
}

/* ------------------------------------------------------------------ */
/* Featured opportunity card — dashboard FundBannerCard + real metrics */
/* ------------------------------------------------------------------ */

export function OpportunityCard({
  offering,
  c,
}: {
  offering: PublicOfferingPreview;
  c: LandingCopy;
}) {
  const { lang } = useLang();
  const strategy = offering.strategyIds[0]
    ? taxonomyLabel(strategies, offering.strategyIds[0], lang)
    : undefined;
  const metrics = offeringMetrics(offering, c, lang);

  return (
    <FundBannerCard
      image={offering.media?.card?.src ?? offering.media?.banner?.src}
      imageAlt={
        tx(offering.media?.card?.alt ?? offering.media?.banner?.alt, lang) ||
        tx(offering.shortName, lang)
      }
      logo={offering.media?.logo?.src}
      name={tx(offering.shortName, lang)}
      manager={tx(offering.managerName, lang)}
      strategyLabel={strategy}
      summary={tx(offering.summary, lang)}
      footer={
        <div>
          {offering.targetReturn && (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#e9edef] pb-4">
              <span className="font-serif text-4xl font-semibold leading-none text-[#0a2d46]">
                {shortRange(offering.targetReturn.value)}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a8790]">
                  {c.card.targetReturn}
                </p>
                <p className="text-xs font-medium text-[#9aa6ad]">
                  {formatSourceLine(offering.targetReturn, lang)}
                </p>
              </div>
            </div>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#e2e7ea] bg-[#e2e7ea]">
            {metrics.slice(0, 4).map((metric) => (
              <div key={metric.label} className="min-h-24 bg-[#fbfcfc] p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">
                  {metric.label}
                </dt>
                <dd className="mt-2 text-sm font-semibold leading-5 text-[#172d3d]">
                  {metric.value}
                </dd>
                {metric.source && (
                  <p className="mt-1.5 text-[10px] leading-4 text-[#87939b]">{metric.source}</p>
                )}
              </div>
            ))}
          </dl>

          <Link
            href={`${NORTH_BASE}/sign-up?offering=${encodeURIComponent(offering.slug)}&path=investor`}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e]"
          >
            {c.card.view}
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-2 text-center text-[10px] leading-4 text-[#7d8992]">
            <Lock className="mr-1 inline size-3" />
            {c.card.accountNote}
          </p>
        </div>
      }
    />
  );
}
