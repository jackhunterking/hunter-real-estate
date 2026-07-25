import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";
import { HUNTER_ADVISORY_HOSTS } from "@/lib/capital/advisory-domain";

// Keep the existing dedicated-domain aliases working while the public brand and
// canonical application path move to Hunter & Hunter Investment Advisors.
const JACK_HOSTS = new Set([
  "jackhunter.com",
  "www.jackhunter.com",
  "jackvetara.com",
  "www.jackvetara.com",
]);
const ADVISORY_PREFIX = "/hunter-advisory";
const ADVISORY_HOME_URL = "https://hunterhunteradvisors.com/";

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

/** Carry next-intl's cookies (NEXT_LOCALE) and Vary header onto our response. */
function inheritIntlArtifacts(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  const vary = from.headers.get("vary");
  if (vary) to.headers.set("vary", vary);
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const dedicatedHost = HUNTER_ADVISORY_HOSTS.has(host);
  const { locale, rest } = stripLocale(request.nextUrl.pathname);

  // --- Legacy redirects (evaluated on the locale-stripped path) ---
  // The advisory portal landing page is the canonical marketing entry point;
  // any legacy /investing link redirects there.
  if (rest === "/investing" || rest.startsWith("/investing/")) {
    const destination = request.nextUrl.clone();
    destination.pathname = locale
      ? `/${locale}${ADVISORY_PREFIX}`
      : ADVISORY_PREFIX;
    destination.search = "";
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

  const legacyCapitalRequest =
    rest === "/hunter-group-capital" ||
    rest.startsWith("/hunter-group-capital/") ||
    rest === "/hunter-x-capital" ||
    rest.startsWith("/hunter-x-capital/");
  if (legacyCapitalRequest && !dedicatedHost) {
    // Dedicated jackhunter.com aliases route to the standalone advisory brand;
    // every other host resolves to the in-app advisory experience.
    if (JACK_HOSTS.has(host)) {
      return NextResponse.redirect(new URL(ADVISORY_HOME_URL), 301);
    }
    const destination = request.nextUrl.clone();
    destination.pathname = `/${locale ?? routing.defaultLocale}${ADVISORY_PREFIX}`;
    destination.search = "";
    return NextResponse.redirect(destination, 301);
  }

  // --- Locale negotiation / prefix insertion ---
  const intlResponse = intlMiddleware(request);
  // When next-intl adds a missing locale prefix (or otherwise redirects), honor
  // it before any host rewrite; the redirected request comes back prefixed.
  if (intlResponse.headers.has("location")) {
    return intlResponse;
  }

  const advisoryRequest =
    rest === ADVISORY_PREFIX || rest.startsWith(`${ADVISORY_PREFIX}/`);

  // Main-site pages on the main host: next-intl's response is all that's needed.
  if (!dedicatedHost && !advisoryRequest) {
    return intlResponse;
  }

  // Past this point the locale prefix is guaranteed present (else next-intl
  // would have redirected above).
  const activeLocale = locale ?? routing.defaultLocale;

  // Keep the dedicated domain clean: an accidental /{locale}/hunter-advisory
  // normalizes back to the clean, locale-prefixed path.
  if (dedicatedHost && advisoryRequest) {
    const cleanRest = rest.slice(ADVISORY_PREFIX.length) || "/";
    const destination = request.nextUrl.clone();
    destination.pathname = `/${activeLocale}${cleanRest === "/" ? "" : cleanRest}`;
    return NextResponse.redirect(destination, 307);
  }

  // The public path the app logic keys off — locale-stripped, so existing
  // `startsWith("/hunter-advisory")` checks in the portal layout keep working.
  const publicSuffix = advisoryRequest
    ? rest.slice(ADVISORY_PREFIX.length)
    : rest;
  const portalPath = `${ADVISORY_PREFIX}${publicSuffix === "/" ? "" : publicSuffix}${request.nextUrl.search}`;

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-hnc-path", portalPath);

  let response: NextResponse;
  if (dedicatedHost) {
    // Clean path on the dedicated host maps to the locale-prefixed portal route
    // on disk: /{locale}/hunter-advisory/...
    const destination = request.nextUrl.clone();
    destination.pathname = `/${activeLocale}${ADVISORY_PREFIX}${rest === "/" ? "" : rest}`;
    response = NextResponse.rewrite(destination, {
      request: { headers: forwardedHeaders },
    });
  } else {
    response = NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  inheritIntlArtifacts(intlResponse, response);
  return refreshSupabaseSession(request, response);
}

export const config = {
  // Skip API routes, Next internals, the PostHog proxy, and anything with a file
  // extension. Everything else flows through locale negotiation.
  matcher: ["/((?!api|_next|ingest|.*\\..*).*)"],
};
