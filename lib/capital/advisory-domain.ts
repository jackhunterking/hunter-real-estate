import { INVESTMENT_BASE_PATH } from "./investment-brand.ts";

export const HUNTER_ADVISORY_HOSTS = new Set([
  "hunterhunteradvisors.com",
  "www.hunterhunteradvisors.com",
  // Keep the former dedicated-domain aliases working during migration.
  "hunternorthcapital.com",
  "www.hunternorthcapital.com",
]);

function normalizedHostname(hostname: string) {
  return hostname.split(":")[0].trim().toLowerCase();
}

function normalizedSuffix(suffix: string) {
  return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

export function isHunterAdvisoryHost(hostname: string) {
  return HUNTER_ADVISORY_HOSTS.has(normalizedHostname(hostname));
}

export function advisoryPublicPath(hostname: string, suffix: string) {
  const path = normalizedSuffix(suffix);
  return isHunterAdvisoryHost(hostname)
    ? path
    : `${INVESTMENT_BASE_PATH}${path === "/" ? "" : path}`;
}

export function advisoryAuthRedirectUrl(
  location: Pick<Location, "origin" | "hostname">,
  nextSuffix: string,
) {
  const next = advisoryPublicPath(location.hostname, nextSuffix);
  const confirm = advisoryPublicPath(location.hostname, "/auth/confirm");
  return `${location.origin}${confirm}?next=${encodeURIComponent(next)}`;
}

export function safeAdvisoryNext(hostname: string, value: string | null) {
  const fallback = advisoryPublicPath(hostname, "/onboarding");
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  const dedicated = isHunterAdvisoryHost(hostname);
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

  return advisoryPublicPath(hostname, suffix);
}
