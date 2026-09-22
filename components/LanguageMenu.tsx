"use client";

import { DropdownMenu } from "radix-ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { localeOption } from "@/lib/i18n/locale-options";
import type { Lang } from "@/lib/i18n/dictionaries";
import styles from "./LanguageMenu.module.css";

// Turkish first: it is the group's home language on the public site.
const OPTIONS = (["tr", "en", "fr", "es"] as const).map(localeOption);

/**
 * Header language picker for the public site: a globe + "EN" trigger that
 * opens the four locales, each named in its own language.
 */
export default function LanguageMenu() {
  const { lang, setLang, t } = useLang();
  const active = localeOption(lang);

  return (
    // Non-modal: the fixed header must not lose its scrollbar when it opens.
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        className={styles.trigger}
        aria-label={`${t.nav.language}: ${active.label}`}
      >
        <svg
          className={styles.globe}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9.25" />
          <path d="M2.75 12h18.5M12 2.75c2.4 2.5 3.6 5.6 3.6 9.25S14.4 18.75 12 21.25M12 2.75C9.6 5.25 8.4 8.35 8.4 12s1.2 6.75 3.6 9.25" />
        </svg>
        <span>{active.short}</span>
        <svg
          className={styles.caret}
          width="9"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.content}
          align="center"
          collisionPadding={16}
          sideOffset={12}
        >
          <DropdownMenu.RadioGroup
            value={lang}
            onValueChange={(value) => setLang(value as Lang)}
          >
            {OPTIONS.map((option) => (
              <DropdownMenu.RadioItem
                key={option.code}
                value={option.code}
                lang={option.code}
                className={styles.item}
              >
                <option.Flag className={styles.flag} />
                <span className={styles.label}>{option.label}</span>
                <DropdownMenu.ItemIndicator className={styles.check}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8.5l3.2 3.2L13 5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
