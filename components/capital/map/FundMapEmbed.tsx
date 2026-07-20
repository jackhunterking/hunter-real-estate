"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { buildMapProperties } from "@/lib/capital/present";
import type { OfferingBundle } from "@/lib/capital/types";

// Lazy-load the map so Leaflet (CDN) + tiles load only when the Portfolio tab
// is opened.
const FundMap = dynamic(() => import("./FundMap").then((m) => m.FundMap), {
  ssr: false,
  loading: () => null,
});

export function FundMapEmbed({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const buildings = buildMapProperties(offering, lang);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <FundMap properties={buildings} selectedId={selectedId} onSelect={setSelectedId} variant="embed" />
    </div>
  );
}
