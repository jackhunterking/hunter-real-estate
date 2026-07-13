"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import { fundHeadline, resolveImage } from "@/lib/capital/present";
import type { OfferingBundle } from "@/lib/capital/types";

export function OfferingCard({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const c = t.capitalApp.card;
  const media = resolveImage(offering.media?.card, offering.slug, offering.shortName[lang], lang);
  const logo = resolveImage(offering.media?.logo, `${offering.slug}-logo`, offering.shortName[lang], lang);
  const strategyLabel = taxonomyLabel(strategies, offering.strategyIds[0], lang);
  const headline = fundHeadline(offering, lang);
  const headlineCaption = offering.offeringSize ? c.offeringSize : c.aumLabel;

  return (
    <Link
      href={`/hunter-group-capital/offerings/${offering.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div
        className="relative grid aspect-[60/13] place-items-center overflow-hidden bg-cover bg-center"
        style={media.src ? undefined : { backgroundImage: media.gradient }}
      >
        {media.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.src} alt={media.alt} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span className="absolute right-3 top-3 z-10 bg-card/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary shadow-sm">
          {strategyLabel}
        </span>
        {!media.src && (
          <span
            className="relative z-[1] grid size-20 place-items-center overflow-hidden rounded-full border-4 border-white bg-white font-serif text-2xl font-semibold text-primary shadow-md"
            style={logo.src ? undefined : { backgroundImage: logo.gradient }}
          >
            {logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={logo.alt} className="h-full w-full object-contain p-2.5" />
            ) : (
              <span aria-hidden>{logo.initials}</span>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-tight text-foreground">{offering.shortName[lang]}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{offering.manager.name[lang]}</p>

        {headline && (
          <p className="mt-3 flex items-baseline gap-2">
            <strong className="text-xl font-bold text-primary">{headline}</strong>
            <span className="text-xs text-muted-foreground">{headlineCaption}</span>
          </p>
        )}

        <span className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-xs font-bold uppercase tracking-[0.06em] text-primary-foreground transition-colors group-hover:bg-primary/90">
          {c.learnMore}
        </span>
      </div>
    </Link>
  );
}
