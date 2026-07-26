import assert from "node:assert/strict";
import test from "node:test";
import {
  PORTAL_HOSTS,
  RETIRED_PORTAL_HOSTS,
  portalAuthRedirectUrl,
  portalPublicPath,
  isPortalHost,
  safePortalNext,
} from "../lib/capital/portal-domain.ts";

test("the portal has exactly one canonical host", () => {
  assert.equal(isPortalHost("www.equitymarket.io"), true);
  assert.equal(isPortalHost("equitymarket.io:443"), true);
  assert.equal(portalPublicPath("www.equitymarket.io", "/sign-in"), "/sign-in");
  assert.equal(portalPublicPath("jackhunter.com", "/sign-in"), "/equity-market/sign-in");
});

test("retired portal hosts are redirect-only and never serve the portal", () => {
  // A host in both sets would serve the portal on two canonical origins at
  // once, which is what the middleware 301 exists to prevent.
  for (const host of RETIRED_PORTAL_HOSTS) {
    assert.equal(isPortalHost(host), false, `${host} must not serve the portal`);
    assert.equal(PORTAL_HOSTS.has(host), false);
  }
  assert.equal(RETIRED_PORTAL_HOSTS.has("hunterhunteradvisors.com"), true);
  assert.equal(RETIRED_PORTAL_HOSTS.has("www.hunterhunteradvisors.com"), true);
  assert.equal(RETIRED_PORTAL_HOSTS.has("hunternorthcapital.com"), true);
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
