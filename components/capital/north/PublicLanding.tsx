"use client";

/**
 * Hunter & Hunter public entry / marketing page.
 *
 * This is a thin orchestrator: the marketing narrative lives in
 * `./landing/*` (copy, primitives, mockups, product-frames, sections). The
 * export name and path are unchanged so `app/hunter-advisory/page.tsx` needs
 * no edits.
 */

import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import type { PublicOfferingPreview } from "@/lib/capital/types";
import { LANDING_COPY } from "./landing/copy";
import { deriveLandingData } from "./landing/primitives";
import {
  BenefitsAndWays,
  FeaturedOpportunities,
  FinalCta,
  Hero,
  LandingFooter,
  LandingHeader,
  PlatformTabs,
} from "./landing/sections";

export function PublicLanding({
  offerings,
}: {
  offerings: PublicOfferingPreview[];
}) {
  const { lang } = useLang();
  const c = pick(LANDING_COPY, lang);
  const displayOfferings = offerings;
  const data = deriveLandingData(displayOfferings);
  const isPreview = offerings.length === 0;

  return (
    // English-first marketing surface: pin lang so CSS uppercase casing doesn't
    // apply Turkish rules (i → İ) to English labels on the tr-default site.
    <div lang="en" className="min-h-screen bg-[#f5f7f7] text-[#122b3c]">
      <LandingHeader c={c} hasOfferings={data.hasOfferings} />
      <main>
        <Hero
          c={c}
          offerings={displayOfferings.slice(0, 2)}
          hasOfferings={data.hasOfferings}
          backdrop={data.heroBackdrop}
        />
        {displayOfferings.length > 0 && (
          <PlatformTabs
            c={c}
            offerings={displayOfferings.slice(0, 2)}
            isPreview={isPreview}
          />
        )}
        {data.hasOfferings && <FeaturedOpportunities c={c} offerings={displayOfferings} />}
        <BenefitsAndWays
          c={c}
          images={data.galleryItems}
          hasOfferings={data.hasOfferings}
        />
        <FinalCta c={c} />
      </main>
      <LandingFooter c={c} />
    </div>
  );
}
