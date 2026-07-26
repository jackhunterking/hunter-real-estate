import { INVESTMENT_BASE_PATH } from "./investment-brand.ts";

/**
 * The domain cutover is a switch, not a deploy.
 *
 * The rename ships before equitymarket.io resolves, so until DNS and the Vercel
 * domain are in place the former domains must keep SERVING the portal. Sending
 * them to a host that does not exist yet would take the portal down. Flip this
 * to "true" only once equitymarket.io answers and is attached in Vercel; from
 * that moment the former domains 301 instead of serving, leaving one canonical
 * origin.
 *
 * NEXT_PUBLIC_ because app/providers.tsx reads PORTAL_HOSTS in the browser.
 */
export const PORTAL_DOMAIN_CUTOVER =
  process.env.NEXT_PUBLIC_PORTAL_DOMAIN_CUTOVER === "true";

/** The destination domain, whether or not it is live yet. */
const CANONICAL_HOSTS = ["equitymarket.io", "www.equitymarket.io"] as const;

/** Domains the portal is served on today, retired by the cutover. */
const FORMER_HOSTS = [
  "hunterhunteradvisors.com",
  "www.hunterhunteradvisors.com",
  "hunternorthcapital.com",
  "www.hunternorthcapital.com",
] as const;

/** Hosts that serve the portal at their root. */
export const PORTAL_HOSTS: ReadonlySet<string> = new Set(
  PORTAL_DOMAIN_CUTOVER ? CANONICAL_HOSTS : [...CANONICAL_HOSTS, ...FORMER_HOSTS],
);

/** Hosts middleware 301s to the canonical origin. Empty until the cutover. */
export const RETIRED_PORTAL_HOSTS: ReadonlySet<string> = new Set(
  PORTAL_DOMAIN_CUTOVER ? FORMER_HOSTS : [],
);

/**
 * Absolute origin for canonical links, OG tags and cross-host redirects.
 * NEXT_PUBLIC_HNC_SITE_URL is the previous variable name, still read as a
 * fallback until the Vercel environment is cut over.
 */
export const PORTAL_ORIGIN = (
  process.env.NEXT_PUBLIC_PORTAL_SITE_URL ??
  process.env.NEXT_PUBLIC_HNC_SITE_URL ??
  (PORTAL_DOMAIN_CUTOVER
    ? "https://equitymarket.io"
    : "https://www.hunterhunteradvisors.com")
).replace(/\/$/, "");

function normalizedHostname(hostname: string) {
  return hostname.split(":")[0].trim().toLowerCase();
}

function normalizedSuffix(suffix: string) {
  return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

export function isPortalHost(hostname: string) {
  return PORTAL_HOSTS.has(normalizedHostname(hostname));
}

export function portalPublicPath(hostname: string, suffix: string) {
  const path = normalizedSuffix(suffix);
  return isPortalHost(hostname)
    ? path
    : `${INVESTMENT_BASE_PATH}${path === "/" ? "" : path}`;
}

export function portalAuthRedirectUrl(
  location: Pick<Location, "origin" | "hostname">,
  nextSuffix: string,
) {
  const next = portalPublicPath(location.hostname, nextSuffix);
  const confirm = portalPublicPath(location.hostname, "/auth/confirm");
  return `${location.origin}${confirm}?next=${encodeURIComponent(next)}`;
}

export function safePortalNext(hostname: string, value: string | null) {
  const fallback = portalPublicPath(hostname, "/onboarding");
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  const dedicated = isPortalHost(hostname);
  let suffix = value;
  if (value === INVESTMENT_BASE_PATH) suffix = "/";
  else if (value.startsWith(`${INVESTMENT_BASE_PATH}/`)) {
    suffix = value.slice(INVESTMENT_BASE_PATH.length);
  } else if (!dedicated) {
    return fallback;
  }

  if (
    suffix === "/auth" ||
    suffix.startsWith("/auth/") ||
    suffix === "/sign-in" ||
    suffix.startsWith("/sign-in?") ||
    suffix === "/sign-up" ||
    suffix.startsWith("/sign-up?") ||
    suffix === "/api" ||
    suffix.startsWith("/api/") ||
    suffix === "/_next" ||
    suffix.startsWith("/_next/")
  ) {
    return fallback;
  }

  return portalPublicPath(hostname, suffix);
}
