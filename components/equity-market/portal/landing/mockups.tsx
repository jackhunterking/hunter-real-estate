"use client";

/**
 * Data-driven offering cards for the landing page.
 *
 * The featured card composes the SAME `OfferingSummaryCard` the authenticated
 * Discover and dashboard surfaces use, so the marketing surface and the product
 * stay uniform. All figures come from real offering data via present.ts.
 */

import { useLang } from "@/lib/i18n/LanguageProvider";
import { tx } from "@/lib/i18n/localize";
import { formatCurrencyCad, formatReturnPhrase } from "@/lib/equity-market/present";
import { taxonomyLabel } from "@/lib/equity-market/taxonomies";
import { useTaxonomies } from "@/components/equity-market/portal/TaxonomyProvider";
import type { PublicOfferingPreview } from "@/lib/equity-market/types";
import {
  OfferingSummaryCard,
  cardMetricLabels,
  riskLevel,
  tightDistribution,
  tightRange,
  CARD_CTA,
} from "@/components/equity-market/OfferingSummaryCard";
import type { LandingCopy } from "./copy";

type Metric = { label: string; value: string };

function offeringMetrics(
  offering: PublicOfferingPreview,
  c: LandingCopy,
  lang: ReturnType<typeof useLang>["lang"],
): Metric[] {
  // Same labels + derivation as the authenticated `offeringBundleCardProps`
  // adapter, so the public card reads field-for-field like the logged-in one.
  // Gated values fall back to the "get access" placeholder rather than being
  // dropped, keeping the fact grid identical in shape.
  const labels = cardMetricLabels(lang);
  const metrics: Metric[] = [
    {
      label: labels.minimum,
      value: offering.minimumInvestment
        ? formatCurrencyCad(offering.minimumInvestment.value, lang)
        : c.card.reviewRequired,
    },
    {
      label: labels.distribution,
      value: offering.targetDistribution
        ? tightDistribution(offering.targetDistribution.value, lang)
        : c.card.reviewRequired,
    },
    {
      label: labels.portfolio,
      value: `${offering.properties.length} ${labels.buildings}`,
    },
  ];
  if (offering.aum) {
    metrics.push({ label: labels.aum, value: offering.aum.value });
  } else {
    metrics.push({
      label: labels.term,
      value: offering.term ? formatReturnPhrase(offering.term.value, lang) : c.card.reviewRequired,
    });
  }
  return metrics;
}

/* ------------------------------------------------------------------ */
/* Featured opportunity card — shared OfferingSummaryCard + real metrics */
/* ------------------------------------------------------------------ */

export function OpportunityCard({
  offering,
  c,
}: {
  offering: PublicOfferingPreview;
  c: LandingCopy;
}) {
  const { lang } = useLang();
  const { strategies } = useTaxonomies();
  const strategy = offering.strategyIds[0]
    ? taxonomyLabel(strategies, offering.strategyIds[0], lang)
    : undefined;
  const metrics = offeringMetrics(offering, c, lang);
  const risk = offering.riskProfile
    ? { label: tx(offering.riskProfile, lang), level: riskLevel(tx(offering.riskProfile, lang)) }
    : undefined;

  return (
    <OfferingSummaryCard
      lang={lang}
      image={offering.media?.card?.src ?? offering.media?.banner?.src}
      imageAlt={
        tx(offering.media?.card?.alt ?? offering.media?.banner?.alt, lang) ||
        tx(offering.shortName, lang)
      }
      logo={offering.media?.logo?.src}
      name={tx(offering.name, lang)}
      manager={tx(offering.managerName, lang)}
      strategyLabel={strategy}
      summary={tx(offering.summary, lang)}
      targetReturn={offering.targetReturn ? tightRange(offering.targetReturn.value) : undefined}
      risk={risk}
      metrics={metrics}
      verified={offering.audited}
      cta={CARD_CTA.loggedOut(offering.slug, lang)}
      note={c.card.accountNote}
    />
  );
}
