import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { PORTAL_URL } from "@/lib/portal-link";

/**
 * Paths the investor portal used to live under while it was a subtree of this
 * app. It is now a separate business in its own repo, on its own domain, so
 * each of these leaves for that domain rather than resolving in-app. The
 * query string is dropped: it belonged to a route that no longer exists here.
 */
const PORTAL_PREFIXES = [
  "/equity-market",
  "/hunter-advisory",
  "/hunter-group-capital",
  "/hunter-x-capital",
  "/investing",
];

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
  // carrying the sub-path so a deep link still lands somewhere useful.
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

  // Bare guide index used to bounce to the home resources anchor.
  if (rest === "/rehber") {
    const destination = request.nextUrl.clone();
    destination.pathname = `/${locale ?? routing.defaultLocale}`;
    destination.hash = "kaynaklar";
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
