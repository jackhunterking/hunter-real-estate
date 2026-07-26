import assert from "node:assert/strict";
import test from "node:test";
import {
  PORTAL_DOMAIN_CUTOVER,
  PORTAL_HOSTS,
  PORTAL_ORIGIN,
  RETIRED_PORTAL_HOSTS,
  portalAuthRedirectUrl,
  portalPublicPath,
  isPortalHost,
  safePortalNext,
} from "../lib/equity-market/portal-domain.ts";

test("the new domain serves the portal, and the base path holds elsewhere", () => {
  assert.equal(isPortalHost("www.equitymarket.io"), true);
  assert.equal(isPortalHost("equitymarket.io:443"), true);
  assert.equal(portalPublicPath("www.equitymarket.io", "/sign-in"), "/sign-in");
  assert.equal(portalPublicPath("jackhunter.com", "/sign-in"), "/equity-market/sign-in");
});

test("before the cutover the current domains keep serving and nothing redirects", () => {
  // The rename ships before equitymarket.io resolves. Redirecting the live
  // domains to a host that does not exist yet would take the portal down, so
  // until NEXT_PUBLIC_PORTAL_DOMAIN_CUTOVER is set they must still serve.
  assert.equal(PORTAL_DOMAIN_CUTOVER, false, "this suite describes the pre-cutover state");
  assert.equal(RETIRED_PORTAL_HOSTS.size, 0);
  for (const host of [
    "hunterhunteradvisors.com",
    "www.hunterhunteradvisors.com",
    "hunternorthcapital.com",
    "www.hunternorthcapital.com",
  ]) {
    assert.equal(isPortalHost(host), true, `${host} must keep serving the portal`);
  }
  // Canonical links point at a host that actually answers.
  assert.equal(PORTAL_ORIGIN, "https://www.hunterhunteradvisors.com");
});

test("a host is never both served and redirected", () => {
  // The invariant that survives the cutover in either direction: a host in both
  // sets would serve the portal on two origins at once, or redirect to itself.
  for (const host of RETIRED_PORTAL_HOSTS) {
    assert.equal(PORTAL_HOSTS.has(host), false, `${host} is in both sets`);
    assert.equal(isPortalHost(host), false);
  }
});

test("auth callbacks use the visible host route contract", () => {
  assert.equal(
    portalAuthRedirectUrl(
      {
        origin: "https://www.equitymarket.io",
        hostname: "www.equitymarket.io",
      },
      "/onboarding?path=investor",
    ),
    "https://www.equitymarket.io/auth/confirm?next=%2Fonboarding%3Fpath%3Dinvestor",
  );
  assert.equal(
    portalAuthRedirectUrl(
      { origin: "http://localhost:3000", hostname: "localhost" },
      "/reset-password",
    ),
    "http://localhost:3000/equity-market/auth/confirm?next=%2Fequity-market%2Freset-password",
  );
});

test("confirmation continuations stay inside the portal", () => {
  assert.equal(
    safePortalNext("www.equitymarket.io", "/equity-market/investments/example"),
    "/investments/example",
  );
  assert.equal(
    safePortalNext("jackhunter.com", "/equity-market/investments/example"),
    "/equity-market/investments/example",
  );
  assert.equal(
    safePortalNext("www.equitymarket.io", "//evil.example"),
    "/onboarding",
  );
  assert.equal(
    safePortalNext("www.equitymarket.io", "/auth/sign-out"),
    "/onboarding",
  );
  assert.equal(
    safePortalNext("jackhunter.com", "/outside-portal"),
    "/equity-market/onboarding",
  );
});
