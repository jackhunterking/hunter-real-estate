import { NextRequest, NextResponse } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const HUNTER_NORTH_HOSTS = new Set([
  "hunternorthcapital.com",
  "www.hunternorthcapital.com",
]);
const JACK_HOSTS = new Set([
  "jackhunter.com",
  "www.jackhunter.com",
  "jackvetara.com",
  "www.jackvetara.com",
]);
const INTERNAL_PREFIX = "/hunter-north-capital";
const DEDICATED_HUNTER_NORTH_DOMAIN_ENABLED =
  process.env.HNC_ENABLE_DEDICATED_DOMAIN === "true";

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const dedicatedHost =
    DEDICATED_HUNTER_NORTH_DOMAIN_ENABLED && HUNTER_NORTH_HOSTS.has(host);
  const internalPortalRequest =
    request.nextUrl.pathname === INTERNAL_PREFIX ||
    request.nextUrl.pathname.startsWith(`${INTERNAL_PREFIX}/`);

  const legacyCapitalRequest =
    request.nextUrl.pathname === "/hunter-group-capital" ||
    request.nextUrl.pathname.startsWith("/hunter-group-capital/") ||
    request.nextUrl.pathname === "/hunter-x-capital" ||
    request.nextUrl.pathname.startsWith("/hunter-x-capital/") ||
    request.nextUrl.pathname === INTERNAL_PREFIX ||
    request.nextUrl.pathname.startsWith(`${INTERNAL_PREFIX}/`);
  if (!dedicatedHost && JACK_HOSTS.has(host) && legacyCapitalRequest) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/investing";
    destination.search = "";
    return NextResponse.redirect(destination, 301);
  }

  if (!dedicatedHost && !internalPortalRequest) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Keep the dedicated domain clean even though the implementation remains in
  // the shared Next.js project while the product is being validated.
  if (dedicatedHost && (pathname === INTERNAL_PREFIX || pathname.startsWith(`${INTERNAL_PREFIX}/`))) {
    const cleanPath = pathname.slice(INTERNAL_PREFIX.length) || "/";
    const destination = request.nextUrl.clone();
    destination.pathname = cleanPath;
    return NextResponse.redirect(destination, 307);
  }

  let response: NextResponse;
  const forwardedHeaders = new Headers(request.headers);
  const portalPath = dedicatedHost
    ? `${INTERNAL_PREFIX}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`
    : `${request.nextUrl.pathname}${request.nextUrl.search}`;
  forwardedHeaders.set("x-hnc-path", portalPath);
  if (dedicatedHost) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === "/" ? INTERNAL_PREFIX : `${INTERNAL_PREFIX}${pathname}`;
    response = NextResponse.rewrite(destination, { request: { headers: forwardedHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  return refreshSupabaseSession(request, response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
