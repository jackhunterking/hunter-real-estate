/**
 * Legal page slugs, kept apart from the legal copy in `legal.ts` so the
 * site-wide footer can link to the pages without shipping their full text.
 */
export const LEGAL_SLUGS = {
  privacy: "gizlilik",
  terms: "kullanim-kosullari",
  advertising: "reklam-aciklamasi",
} as const;

export type LegalKey = keyof typeof LEGAL_SLUGS;
