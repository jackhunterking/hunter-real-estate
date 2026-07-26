"use client";

import { useMemo, useState } from "react";
import type { OfferingBundle } from "@/lib/equity-market/types";
import { primaryShareClass } from "@/lib/equity-market/present";
import { parseTargetMidpoint } from "@/lib/equity-market/performance";

export type FundSort = "featured" | "return-desc" | "return-asc" | "name";

export type FundFilterState = {
  query: string;
  status: string; // "" = all
  sort: FundSort;
};

const INITIAL: FundFilterState = { query: "", status: "", sort: "featured" };

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/**
 * Client-side filter + sort for the fund lists. Keeps the offering list stable
 * (no fetching) and derives the available facets from the offerings themselves
 * so the controls only ever show values that exist. Return sorting uses the
 * same target-return midpoint the KPIs use.
 */
export function useFundFilters(offerings: OfferingBundle[]) {
  const [state, setState] = useState<FundFilterState>(INITIAL);

  const facets = useMemo(
    () => ({
      statuses: uniq(offerings.map((o) => o.status)),
    }),
    [offerings],
  );

  const filtered = useMemo(() => {
    const q = state.query.trim().toLowerCase();
    let list = offerings.filter((o) => {
      if (state.status && o.status !== state.status) return false;
      if (q) {
        const hay = `${o.name.en} ${o.name.tr}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (state.sort === "name") {
      list = [...list].sort((a, b) => a.name.en.localeCompare(b.name.en));
    } else if (state.sort === "return-desc" || state.sort === "return-asc") {
      const mid = (o: OfferingBundle) => parseTargetMidpoint(primaryShareClass(o)?.targetReturn?.value ?? "");
      list = [...list].sort((a, b) => {
        const ra = mid(a);
        const rb = mid(b);
        if (ra == null && rb == null) return 0;
        if (ra == null) return 1; // funds without a published target sink to the bottom
        if (rb == null) return -1;
        return state.sort === "return-desc" ? rb - ra : ra - rb;
      });
    }

    return list;
  }, [offerings, state]);

  const reset = () => setState(INITIAL);
  const active = state.query !== "" || state.status !== "" || state.sort !== "featured";

  return { state, setState, filtered, facets, reset, active };
}
