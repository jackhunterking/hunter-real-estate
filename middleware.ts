import { NextRequest, NextResponse } from "next/server";
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

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const dedicatedHost = HUNTER_ADVISORY_HOSTS.has(host);
  const advisoryPortalRequest =
    request.nextUrl.pathname === ADVISORY_PREFIX ||
    request.nextUrl.pathname.startsWith(`${ADVISORY_PREFIX}/`);

  const legacyCapitalRequest =
    request.nextUrl.pathname === "/hunter-group-capital" ||
    request.nextUrl.pathname.startsWith("/hunter-group-capital/") ||
    request.nextUrl.pathname === "/hunter-x-capital" ||
    request.nextUrl.pathname.startsWith("/hunter-x-capital/");
  if (!dedicatedHost && JACK_HOSTS.has(host) && legacyCapitalRequest) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/investing";
    destination.search = "";
    return NextResponse.redirect(destination, 301);
  }

  if (!dedicatedHost && !advisoryPortalRequest) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Keep the dedicated domain clean even though the implementation remains in
  // the shared Next.js project while the product is being validated.
  if (
    dedicatedHost &&
    (pathname === ADVISORY_PREFIX || pathname.startsWith(`${ADVISORY_PREFIX}/`))
  ) {
    const cleanPath = pathname.slice(ADVISORY_PREFIX.length) || "/";
    const destination = request.nextUrl.clone();
    destination.pathname = cleanPath;
    return NextResponse.redirect(destination, 307);
  }

  let response: NextResponse;
  const forwardedHeaders = new Headers(request.headers);
  const publicSuffix = pathname.startsWith(ADVISORY_PREFIX)
    ? pathname.slice(ADVISORY_PREFIX.length)
    : pathname;
  const portalPath = `${ADVISORY_PREFIX}${publicSuffix === "/" ? "" : publicSuffix}${request.nextUrl.search}`;
  forwardedHeaders.set("x-hnc-path", portalPath);
  if (dedicatedHost) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === "/" ? ADVISORY_PREFIX : `${ADVISORY_PREFIX}${pathname}`;
    response = NextResponse.rewrite(destination, { request: { headers: forwardedHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  return refreshSupabaseSession(request, response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
