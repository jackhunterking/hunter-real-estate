"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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

const STORAGE_KEY = "hunter-lang";

export function LanguageProvider({
  children,
  defaultLang = "tr",
  storageKey = STORAGE_KEY,
}: {
  children: React.ReactNode;
  /** Initial language before any persisted preference loads. */
  defaultLang?: Lang;
  /** localStorage key for the persisted preference. Use a distinct key to
   *  scope a section's language independently (e.g. English-first advisory). */
  storageKey?: string;
}) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  // Read persisted language on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored && Object.prototype.hasOwnProperty.call(dictionaries, stored)) {
        setLangState(stored as Lang);
        document.documentElement.lang = stored;
      }
    } catch {
      /* ignore storage errors */
    }
  }, [storageKey]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        window.localStorage.setItem(storageKey, next);
        document.documentElement.lang = next;
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const t = dictionaries[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
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
