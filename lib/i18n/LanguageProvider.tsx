"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

/**
 * Coordinates ownership of the document-level `<html lang>` attribute between
 * nested providers. Browsers make CSS `text-transform` (e.g. uppercase labels)
 * locale-aware from `<html lang>` — so if it says "tr" while English content is
 * shown, uppercased labels render Turkish casing (dotted "İ" for "i"). The site
 * mounts a Turkish-first root provider around everything, and the English-first
 * advisory portal mounts its own provider inside it. The *innermost* (most
 * specific) provider must win, so each provider hands its children a "claim"
 * object; a nested provider marks its ancestor's claim taken on mount, and any
 * provider whose claim was taken stops writing `<html lang>`.
 */
type HtmlLangClaim = { taken: boolean };
const HtmlLangClaimContext = createContext<HtmlLangClaim | null>(null);

const STORAGE_KEY = "hunter-lang";

export function LanguageProvider({
  children,
  defaultLang = "tr",
  storageKey = STORAGE_KEY,
  autoDetect = false,
  detectLangs = ["tr", "en"],
}: {
  children: React.ReactNode;
  /** Initial language before any persisted preference loads. */
  defaultLang?: Lang;
  /** localStorage key for the persisted preference. Use a distinct key to
   *  scope a section's language independently (e.g. English-first advisory). */
  storageKey?: string;
  /** When true and no preference is stored yet, pick the initial language from
   *  the visitor's browser languages (opt-in; the Turkish-first root site does
   *  not use it). Anything outside `detectLangs` falls back to `defaultLang`. */
  autoDetect?: boolean;
  /** Candidate languages auto-detect is allowed to choose from, by base tag. */
  detectLangs?: Lang[];
}) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  const parentClaim = useContext(HtmlLangClaimContext);
  // Stable per-instance claim handed down to descendants. A nested provider
  // flips its ancestor's `taken` so only the deepest provider drives `<html lang>`.
  const ownClaim = useRef<HtmlLangClaim>({ taken: false }).current;

  // Resolve the initial language on mount: a stored preference always wins;
  // otherwise, when auto-detect is on, greet the visitor in their browser
  // language (e.g. Turkish phones land in Turkish) before falling back to the
  // default. Persisting only happens when the visitor chooses via `setLang`.
  const detectKey = detectLangs.join(",");
  useEffect(() => {
    const isKnown = (value: string) =>
      Object.prototype.hasOwnProperty.call(dictionaries, value);
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored && isKnown(stored)) {
        setLangState(stored as Lang);
        return;
      }
      if (autoDetect && typeof navigator !== "undefined") {
        const allowed = detectKey.split(",").filter(Boolean);
        const candidates =
          navigator.languages && navigator.languages.length
            ? navigator.languages
            : [navigator.language];
        for (const tag of candidates) {
          const base = (tag || "").toLowerCase().split("-")[0];
          if (allowed.includes(base) && isKnown(base)) {
            setLangState(base as Lang);
            return;
          }
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }, [storageKey, autoDetect, detectKey]);

  // Tell the nearest ancestor provider (if any) to yield `<html lang>` ownership
  // to us — we're the deeper, more specific provider for this subtree. Child
  // effects flush before parent effects, so the ancestor sees this before its
  // own sync effect runs and skips writing.
  useEffect(() => {
    if (parentClaim) parentClaim.taken = true;
  }, [parentClaim]);

  // Keep `<html lang>` in sync with the active language — unless a nested
  // provider has claimed ownership. Runs on mount too, so the default language
  // (e.g. the advisory portal's English) is reflected instead of the static
  // server-rendered value.
  useEffect(() => {
    if (ownClaim.taken) return;
    document.documentElement.lang = lang;
  }, [lang, ownClaim]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const t = dictionaries[lang];

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      <HtmlLangClaimContext.Provider value={ownClaim}>
        {children}
      </HtmlLangClaimContext.Provider>
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
