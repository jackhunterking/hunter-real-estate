"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

/**
 * Stamps the portal's *active* language onto the wrapper element. Browsers make
 * CSS `text-transform` (e.g. uppercase headings) locale-aware from the nearest
 * `lang` ancestor — so this guarantees Turkish renders the dotted "İ" (and the
 * dotless "ı") correctly everywhere in the portal, independent of the
 * document-level lang, which the site sets to Turkish-first.
 */
export function LangBoundary({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  return (
    <div lang={lang} className="hnc-root min-h-screen bg-[#f4f6f8]">
      {children}
    </div>
  );
}
