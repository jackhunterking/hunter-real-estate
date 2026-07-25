import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Use these instead of `next/link` and
 * `next/navigation` for any internal link or programmatic navigation so the
 * active locale prefix is preserved automatically. The language switcher uses
 * `useRouter().replace(pathname, { locale })` to switch locale in place, which
 * also updates the NEXT_LOCALE cookie.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
