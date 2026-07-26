"use client";

/**
 * Hunter & Hunter public entry / marketing page.
 *
 * This is a thin orchestrator: the marketing narrative lives in
 * `./landing/*` (copy, primitives, mockups, sections). The export name and
 * path are unchanged so the portal's `page.tsx` needs no edits.
 *
 * Section order is tuned for a cold, mobile Instagram visitor: explain it in
 * plain words → set it against the alternatives (compare) → prove it's real
 * (buildings) → show the simple path → offerings → credibility → answer the
 * first questions → deeper product tour → convert.
 */

import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import type { PublicOfferingPreview } from "@/lib/capital/types";
import { LANDING_COPY } from "./landing/copy";
import { deriveLandingData } from "./landing/primitives";
import {
  BuildingsGallery,
  FAQ,
  FeaturedOpportunities,
  FinalCta,
  Hero,
  HowItCompares,
  HowItWorks,
  LandingFooter,
  LandingHeader,
  Simulator,
  TrustBar,
  WhyPillars,
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

  return (
    // Content language follows the active UI language so CSS casing rules match
    // the text (English stays English; Turkish gets Turkish "İ" casing).
    <div lang={lang} className="min-h-screen bg-[#f5f7f7] text-[#122b3c]">
      <LandingHeader c={c} hasOfferings={data.hasOfferings} />
      <main>
        <Hero
          c={c}
          offerings={displayOfferings}
          hasOfferings={data.hasOfferings}
          backdrop={data.heroBackdrop}
        />
        <WhyPillars c={c} images={data.galleryItems} />
        {data.hasOfferings && <Simulator c={c} offerings={displayOfferings} />}
        <HowItCompares c={c} />
        <BuildingsGallery c={c} images={data.galleryItems} lang={lang} />
        <HowItWorks c={c} />
        {data.hasOfferings && <FeaturedOpportunities c={c} offerings={displayOfferings} />}
        <TrustBar c={c} />
        <FAQ c={c} />
        <FinalCta c={c} />
      </main>
      <LandingFooter />
    </div>
  );
}
