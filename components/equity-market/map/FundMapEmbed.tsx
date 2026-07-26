"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { buildMapProperties } from "@/lib/equity-market/present";
import { useTaxonomies } from "@/components/equity-market/portal/TaxonomyProvider";
import type { OfferingBundle } from "@/lib/equity-market/types";

// Lazy-load the map so Leaflet (CDN) + tiles load only when the Portfolio tab
// is opened.
const FundMap = dynamic(() => import("./FundMap").then((m) => m.FundMap), {
  ssr: false,
  loading: () => null,
});

export function FundMapEmbed({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const { assetClasses } = useTaxonomies();
  const buildings = buildMapProperties(offering, lang, assetClasses);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <FundMap properties={buildings} selectedId={selectedId} onSelect={setSelectedId} variant="embed" />
    </div>
  );
}
