import { NextRequest, NextResponse } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const HUNTER_NORTH_HOSTS = new Set([
  "hunternorthcapital.com",
  "www.hunternorthcapital.com",
]);
const INTERNAL_PREFIX = "/hunter-north-capital";

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const dedicatedHost = HUNTER_NORTH_HOSTS.has(host);
  const internalPortalRequest =
    request.nextUrl.pathname === INTERNAL_PREFIX ||
    request.nextUrl.pathname.startsWith(`${INTERNAL_PREFIX}/`);

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
  if (dedicatedHost) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === "/" ? INTERNAL_PREFIX : `${INTERNAL_PREFIX}${pathname}`;
    response = NextResponse.rewrite(destination);
  } else {
    response = NextResponse.next({ request });
  }

  return refreshSupabaseSession(request, response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
