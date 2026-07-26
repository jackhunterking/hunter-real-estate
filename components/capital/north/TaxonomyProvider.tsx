"use client";

import { createContext, useContext, type ReactNode } from "react";
import { EMPTY_TAXONOMIES, type TaxonomySet } from "@/lib/capital/taxonomies";

const TaxonomyContext = createContext<TaxonomySet>(EMPTY_TAXONOMIES);

/**
 * Provides Supabase-sourced classification taxonomies to the client tree.
 * Mounted once in the shared portal layout (covers both the public
 * landing and the authenticated portal).
 */
export function TaxonomyProvider({ value, children }: { value: TaxonomySet; children: ReactNode }) {
  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
}

export function useTaxonomies(): TaxonomySet {
  return useContext(TaxonomyContext);
}
