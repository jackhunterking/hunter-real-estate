"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { dictionaries, tr, type Dictionary, type Lang } from "./dictionaries";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "tr",
  setLang: () => {},
  t: tr,
});

/**
 * Bridges the URL-derived locale (owned by next-intl routing) into the existing
 * dictionary context that ~60 components consume via `useT()`/`useLang()`.
 *
 * Language is now **server-authoritative**: the active locale comes from the URL
 * (`/en/…`, `/tr/…`), not from `localStorage`, so the server renders the correct
 * language and search engines index each locale. Switching language navigates to
 * the same route under the new locale prefix; next-intl persists that choice in
 * the `NEXT_LOCALE` cookie so it survives the visitor's next visit. First-visit
 * detection from the device/browser `Accept-Language` happens in middleware.
 */
export function LanguageProvider({
  children,
  lang,
}: {
  children: React.ReactNode;
  /** Active locale, resolved from the URL by the [locale] layout. */
  lang: Lang;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const setLang = useCallback(
    (next: Lang) => {
      // `pathname` here is locale-stripped; next-intl re-adds the new prefix and
      // updates the NEXT_LOCALE cookie.
      router.replace(pathname, { locale: next });
    },
    [router, pathname],
  );

  const t = dictionaries[lang];

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

/** Shorthand to get just the dictionary */
export function useT() {
  return useContext(LanguageContext).t;
}
