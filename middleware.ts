import { NextRequest, NextResponse } from "next/server";

const HUNTER_NORTH_HOSTS = new Set([
  "hunternorthcapital.com",
  "www.hunternorthcapital.com",
]);
const INTERNAL_PREFIX = "/hunter-north-capital";

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!HUNTER_NORTH_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Keep the dedicated domain clean even though the implementation remains in
  // the shared Next.js project while the product is being validated.
  if (pathname === INTERNAL_PREFIX || pathname.startsWith(`${INTERNAL_PREFIX}/`)) {
    const cleanPath = pathname.slice(INTERNAL_PREFIX.length) || "/";
    const destination = request.nextUrl.clone();
    destination.pathname = cleanPath;
    return NextResponse.redirect(destination, 307);
  }

  const destination = request.nextUrl.clone();
  destination.pathname = pathname === "/" ? INTERNAL_PREFIX : `${INTERNAL_PREFIX}${pathname}`;
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
