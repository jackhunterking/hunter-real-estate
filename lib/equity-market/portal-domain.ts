import { INVESTMENT_BASE_PATH } from "./investment-brand.ts";

/**
 * Hosts that serve the portal at their root. Exactly the canonical domain —
 * every other host that once served the portal belongs in
 * RETIRED_PORTAL_HOSTS so it redirects instead, keeping one canonical origin.
 */
export const PORTAL_HOSTS = new Set(["equitymarket.io", "www.equitymarket.io"]);

/** Former portal domains. Middleware 301s these to the canonical origin. */
export const RETIRED_PORTAL_HOSTS = new Set([
  "hunterhunteradvisors.com",
  "www.hunterhunteradvisors.com",
  "hunternorthcapital.com",
  "www.hunternorthcapital.com",
]);

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
