"use client";

/**
 * The canonical offering summary card used across every surface — the public
 * landing page, the authenticated Discover / Funds list, and the dashboard.
 *
 * It is purely presentational: callers resolve their own strings (respecting
 * whatever compliance gating that surface requires) and pass them in. The
 * `offeringBundleCardFacts` adapter derives the facts for authenticated portal
 * surfaces from a full `OfferingBundle`, mirroring the fund detail view.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import type { Lang, OfferingBundle } from "@/lib/capital/types";
import { tx } from "@/lib/i18n/localize";
import {
  formatCurrencyCad,
  formatReturnPhrase,
  primaryShareClass,
} from "@/lib/capital/present";
import { taxonomyLabel, type TaxonomyItem } from "@/lib/capital/taxonomies";
import { INVESTMENT_BASE_PATH } from "@/lib/capital/investment-brand";
import { FundBannerCard } from "@/components/capital/FundBannerCard";

export type OfferingCardMetric = { label: string; value: string };

const T = (lang: Lang, en: string, tr: string) => (lang === "tr" ? tr : en);

/** Collapse "12 - 15 %" style ranges to a tight "12–15%". */
export function tightRange(text: string) {
  const match = text.match(/\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?\s*%/);
  return match ? match[0].replace(/\s+/g, "").replace("-", "–") : text;
}

/**
 * Free-text risk copy → 1–5 position on a Low→High scale. Matches both English
 * ("Low – Moderate") and Turkish ("Düşük - Orta") wording so the meter renders
 * in either language. Unrecognised copy returns 0 — meter hides, label stays.
 */
export function riskLevel(risk: string): number {
  const t = risk.toLowerCase();
  const low = t.includes("low") || t.includes("düşük") || t.includes("dusuk");
  const mod =
    t.includes("moderate") || t.includes("medium") || t.includes("orta");
  const high = t.includes("high") || t.includes("yüksek") || t.includes("yuksek");
  if (mod && high) return 4;
  if (high) return 5;
  if (low && mod) return 2;
  if (mod) return 3;
  if (low) return 1;
  return 0;
}

function RiskMeter({ lang, label, level }: { lang: Lang; label: string; level: number }) {
  return (
    <div className="min-w-0 flex-1 sm:max-w-[220px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a8790]">
          {T(lang, "Risk profile", "Risk profili")}
        </span>
        <span className="truncate text-xs font-semibold text-[#0a2d46]">{label}</span>
      </div>
      {level > 0 && (
        <>
          <div className="mt-2 flex gap-1" aria-hidden>
            {[1, 2, 3, 4, 5].map((step) => (
              <span
                key={step}
                className={`h-1.5 flex-1 rounded-full ${step <= level ? "bg-[#0a2d46]" : "bg-[#e2e7ea]"}`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] text-[#9aa6ad]">
            <span>{T(lang, "Low", "Düşük")}</span>
            <span>{T(lang, "High", "Yüksek")}</span>
          </div>
        </>
      )}
    </div>
  );
}

export type OfferingSummaryCardProps = {
  lang: Lang;
  image?: string;
  imageAlt?: string;
  logo?: string;
  name: string;
  manager: string;
  strategyLabel?: string;
  summary: string;
  /** Already-resolved target-return range, e.g. "12–15%". */
  targetReturn?: string;
  risk?: { label: string; level: number };
  metrics: OfferingCardMetric[];
  /** Default full-width link CTA. Ignored when `ctaSlot` is provided. */
  cta?: { href: string; label: string };
  /**
   * Custom footer action, rendered in place of the default `cta` link. Used by
   * the portal to inject the "Request to invest" dialog button (opportunities)
   * or a committed-amount + status block (owned positions).
   */
  ctaSlot?: ReactNode;
  /** Per-fund trust cue — compact "Independently audited" line under the facts. */
  verified?: boolean;
  /** Optional gated-access note (landing only). */
  note?: string;
};

export function OfferingSummaryCard({
  lang,
  image,
  imageAlt,
  logo,
  name,
  manager,
  strategyLabel,
  summary,
  targetReturn,
  risk,
  metrics,
  cta,
  ctaSlot,
  verified,
  note,
}: OfferingSummaryCardProps) {
  return (
    <FundBannerCard
      image={image}
      imageAlt={imageAlt}
      logo={logo}
      name={name}
      manager={manager}
      strategyLabel={strategyLabel}
      summary={summary}
      footer={
        <div>
          {(targetReturn || risk) && (
            <div className="mt-4 flex items-end justify-between gap-5 border-b border-[#e9edef] pb-4">
              {targetReturn && (
                <div className="shrink-0">
                  <p className="font-serif text-4xl font-semibold leading-none text-[#0a2d46]">
                    {targetReturn}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a8790]">
                    {T(lang, "Target return", "Hedeflenen getiri")}
                  </p>
                </div>
              )}
              {risk && <RiskMeter lang={lang} label={risk.label} level={risk.level} />}
            </div>
          )}

          {metrics.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#e2e7ea] bg-[#e2e7ea]">
              {metrics.slice(0, 4).map((metric) => (
                <div key={metric.label} className="min-h-20 bg-[#fbfcfc] p-3.5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">
                    {metric.label}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold leading-5 text-[#172d3d]">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {verified && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3f7a58]">
              <ShieldCheck className="size-3.5" />
              {T(lang, "Independently audited", "Bağımsız denetimli")}
            </p>
          )}

          {ctaSlot ? (
            <div className="mt-4">{ctaSlot}</div>
          ) : (
            cta && (
              <Link
                href={cta.href}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e]"
              >
                {cta.label}
                <ArrowRight className="size-4" />
              </Link>
            )
          )}
          {note && (
            <p className="mt-2 text-center text-[10px] leading-4 text-[#7d8992]">
              <Lock className="mr-1 inline size-3" />
              {note}
            </p>
          )}
        </div>
      }
    />
  );
}

/**
 * Canonical metric labels for the offering card. Both the authenticated
 * (`offeringBundleCardProps`) and public (landing) adapters read from here so
 * the same four facts read identically on every surface.
 */
export function cardMetricLabels(lang: Lang) {
  return {
    minimum: T(lang, "Minimum investment", "Minimum yatırım"),
    distribution: T(lang, "Target distribution", "Hedef dağıtım"),
    portfolio: T(lang, "Portfolio", "Portföy"),
    aum: T(lang, "Assets under management", "Yönetilen varlıklar"),
    term: T(lang, "Term", "Vade"),
    buildings: T(lang, "buildings", "bina"),
  };
}

/**
 * The card's bottom CTA has exactly two states — the only thing allowed to
 * differ between surfaces. Everything else on the card (title included, always
 * the full legal name) is identical. Every card resolves its CTA from here.
 */
export const CARD_CTA = {
  /** Authenticated surfaces → the offering detail page. */
  loggedIn(slug: string, lang: Lang) {
    return {
      href: `${INVESTMENT_BASE_PATH}/investments/${slug}`,
      label: T(lang, "View details", "Detayları gör"),
    };
  },
  /** Public landing → the gated sign-up flow. */
  loggedOut(slug: string, lang: Lang) {
    return {
      href: `${INVESTMENT_BASE_PATH}/sign-up?offering=${encodeURIComponent(slug)}&path=investor`,
      label: T(lang, "Sign up", "Kaydol"),
    };
  },
};

/**
 * Derive the card's resolved facts from an authenticated `OfferingBundle`,
 * mirroring the fund detail view (reads the primary share class, no public
 * approval gate). Landing surfaces build their own facts from the gated
 * `PublicOfferingPreview` projection instead.
 */
export function offeringBundleCardFacts(
  bundle: OfferingBundle,
  lang: Lang,
): {
  targetReturn?: string;
  risk?: { label: string; level: number };
  metrics: OfferingCardMetric[];
  verified: boolean;
} {
  const sc = primaryShareClass(bundle);
  const labels = cardMetricLabels(lang);
  const targetReturn = sc?.targetReturn ? tightRange(sc.targetReturn.value) : undefined;
  const riskText = bundle.riskProfile ? tx(bundle.riskProfile, lang) : "";
  const risk = riskText ? { label: riskText, level: riskLevel(riskText) } : undefined;
  const verified = Boolean(bundle.serviceProviders?.auditor);

  const metrics: OfferingCardMetric[] = [];
  if (sc?.minimumInvestment) {
    metrics.push({
      label: labels.minimum,
      value: formatCurrencyCad(sc.minimumInvestment.value, lang),
    });
  }
  const distribution = sc?.targetDistribution ?? sc?.distributionPerUnit;
  if (distribution) {
    metrics.push({
      label: labels.distribution,
      value: formatReturnPhrase(distribution.value, lang),
    });
  }
  if (bundle.properties.length) {
    metrics.push({
      label: labels.portfolio,
      value: `${bundle.properties.length} ${labels.buildings}`,
    });
  }
  if (bundle.aum) {
    metrics.push({
      label: labels.aum,
      value: String(bundle.aum.value),
    });
  } else if (sc?.term) {
    metrics.push({
      label: labels.term,
      value: formatReturnPhrase(sc.term.value, lang),
    });
  }

  return { targetReturn, risk, metrics: metrics.slice(0, 4), verified };
}

/**
 * The single source of truth for every non-CTA prop on an authenticated
 * offering card. All three logged-in surfaces (Discover, My Portfolio,
 * Dashboard) spread this and supply only their CTA, so the card body — title
 * (always the full legal `name`), imagery, metrics, and trust cue — is
 * guaranteed identical. Landing mirrors these fields from its gated preview.
 */
export function offeringBundleCardProps(
  bundle: OfferingBundle,
  lang: Lang,
  strategies: TaxonomyItem[],
): Omit<OfferingSummaryCardProps, "lang" | "cta" | "ctaSlot" | "note"> {
  const facts = offeringBundleCardFacts(bundle, lang);
  const strategyLabel = bundle.strategyIds[0]
    ? taxonomyLabel(strategies, bundle.strategyIds[0], lang)
    : undefined;
  return {
    image: bundle.media?.card?.src ?? bundle.media?.banner?.src,
    imageAlt: tx(bundle.media?.card?.alt, lang) || tx(bundle.shortName, lang),
    logo: bundle.media?.logo?.src,
    name: tx(bundle.name, lang),
    manager: tx(bundle.manager.name, lang),
    strategyLabel,
    summary: tx(bundle.summary, lang),
    ...facts,
  };
}
