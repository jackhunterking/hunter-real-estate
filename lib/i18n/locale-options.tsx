/**
 * The four site locales as UI data — one source of truth for every language
 * picker (landing header, portal profile, anywhere else a switcher appears).
 *
 * Each option carries its own flag glyph, a two-letter badge for compact
 * controls, and the language name written *in that language* (never translated:
 * a Turkish speaker looking at an English page must still recognise "Türkçe").
 * Order is the routed locale order with English first, since that is the
 * default the middleware falls back to.
 */

import type { Lang } from "./dictionaries";

type FlagProps = { className?: string };

/** Default flag box — 20×14, matching the landing header's original sizing. */
const FLAG_CLASS = "h-3.5 w-5 shrink-0 rounded-[2px]";

function FlagTR({ className = FLAG_CLASS }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="11" cy="10" r="4.5" fill="#fff" />
      <circle cx="12.3" cy="10" r="3.5" fill="#E30A17" />
      <polygon
        points="17.4,7.6 18.2,9.6 20.3,9.6 18.6,10.8 19.3,12.8 17.4,11.6 15.5,12.8 16.2,10.8 14.5,9.6 16.6,9.6"
        fill="#fff"
      />
    </svg>
  );
}

function FlagEN({ className = FLAG_CLASS }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20" stroke="#fff" strokeWidth="3" />
      <path d="M30,0 L0,20" stroke="#fff" strokeWidth="3" />
      <path d="M0,0 L30,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M30,0 L0,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M15,0 V20" stroke="#fff" strokeWidth="5" />
      <path d="M0,10 H30" stroke="#fff" strokeWidth="5" />
      <path d="M15,0 V20" stroke="#C8102E" strokeWidth="3" />
      <path d="M0,10 H30" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}

function FlagFR({ className = FLAG_CLASS }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="10" height="20" x="0" fill="#0055A4" />
      <rect width="10" height="20" x="10" fill="#fff" />
      <rect width="10" height="20" x="20" fill="#EF4135" />
    </svg>
  );
}

function FlagES({ className = FLAG_CLASS }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#AA151B" />
      <rect width="30" height="10" y="5" fill="#F1BF00" />
    </svg>
  );
}

export type LocaleOption = {
  code: Lang;
  /** Two-letter badge for compact triggers. */
  short: string;
  /** Language name in its own language. */
  label: string;
  Flag: (props: FlagProps) => React.ReactElement;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en", short: "EN", label: "English", Flag: FlagEN },
  { code: "fr", short: "FR", label: "Français", Flag: FlagFR },
  { code: "es", short: "ES", label: "Español", Flag: FlagES },
  { code: "tr", short: "TR", label: "Türkçe", Flag: FlagTR },
];

/** The option for `lang`, falling back to English (the routing default). */
export function localeOption(lang: Lang): LocaleOption {
  return (
    LOCALE_OPTIONS.find((o) => o.code === lang) ??
    LOCALE_OPTIONS.find((o) => o.code === "en")!
  );
}
