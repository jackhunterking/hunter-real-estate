import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { PORTAL_URL } from "@/lib/portal-link";

/**
 * Paths the funds portal used to live under while it was a subtree of this
 * app. It is now a separate business with its own repo and domain, so each of
 * these leaves for that domain rather than resolving in-app. The portal's
 * former dedicated host is redirected wholesale in next.config.mjs.
 */
const PORTAL_PREFIXES = [
  "/hunter-advisory",
  "/hunter-group-capital",
  "/hunter-x-capital",
  "/investing",
];

// /mortgage is a single page. The six topic pages are now cards on it, and the
// old tools and rates pages already pointed back to it, so old links, ads and
// search results for any of them land on /mortgage.
const RETIRED_MORTGAGE_PATHS = new Set(
  [
    "ev-almak",
    "yenileme",
    "tadilat",
    "borc-toparlama",
    "ev-degeri",
    "heloc",
    "araclar",
    "oranlar",
  ].map((slug) => `/mortgage/${slug}`),
);

// Owns locale negotiation (Accept-Language on first visit), prefix insertion,
// and the NEXT_LOCALE cookie for the whole site.
const intlMiddleware = createIntlMiddleware(routing);

const LOCALE_PREFIX_RE = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

/** Split a leading `/en|/tr|/fr|/es` locale prefix off a pathname. */
function stripLocale(pathname: string): { locale: string | null; rest: string } {
  const match = pathname.match(LOCALE_PREFIX_RE);
  if (!match) return { locale: null, rest: pathname };
  return { locale: match[1], rest: pathname.slice(match[0].length) || "/" };
}

export function middleware(request: NextRequest) {
  const { locale, rest } = stripLocale(request.nextUrl.pathname);

  // --- Legacy redirects (evaluated on the locale-stripped path) ---
  // Anything that used to be the portal now leaves for the portal's domain,
  // carrying the locale and sub-path so a deep link still lands somewhere
  // useful; the portal maps its own retired paths from there. The query string
  // is dropped: it belonged to a route that no longer exists here.
  const portalPrefix = PORTAL_PREFIXES.find(
    (prefix) => rest === prefix || rest.startsWith(`${prefix}/`),
  );
  if (portalPrefix) {
    const suffix = portalPrefix === "/investing" ? "" : rest.slice(portalPrefix.length);
    return NextResponse.redirect(
      new URL(`/${locale ?? routing.defaultLocale}${suffix}`, PORTAL_URL),
      301,
    );
  }

  // Keeps the query string so ad click IDs and UTM tags survive the hop. Built
  // from scratch rather than cloned so a trailing slash isn't carried over.
  if (RETIRED_MORTGAGE_PATHS.has(rest.replace(/\/$/, ""))) {
    const pathname = locale ? `/${locale}/mortgage` : "/mortgage";
    const destination = new URL(`${pathname}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(destination, 301);
  }

  // Bare guide index used to bounce to the home resources anchor.
  if (rest === "/rehber") {
    const destination = request.nextUrl.clone();
    destination.pathname = `/${locale ?? routing.defaultLocale}`;
    destination.hash = "kaynaklar";
    destination.search = "";
    return NextResponse.redirect(destination, 301);
  }

  // The Learn page (a mortgage glossary) was removed; send old links to the
  // mortgage page.
  if (rest === "/rehber/ogren") {
    const destination = request.nextUrl.clone();
    destination.pathname = locale ? `/${locale}/mortgage` : "/mortgage";
    destination.search = "";
    return NextResponse.redirect(destination, 301);
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, Next internals, the PostHog proxy, and anything with a file
  // extension. Everything else flows through locale negotiation.
  matcher: ["/((?!api|_next|ingest|.*\\..*).*)"],
};
