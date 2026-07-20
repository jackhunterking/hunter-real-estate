import assert from "node:assert/strict";
import test from "node:test";
import {
  advisoryAuthRedirectUrl,
  advisoryPublicPath,
  isHunterAdvisoryHost,
  safeAdvisoryNext,
} from "../lib/capital/advisory-domain.ts";

test("dedicated advisory hosts use clean public routes", () => {
  assert.equal(isHunterAdvisoryHost("www.hunterhunteradvisors.com"), true);
  assert.equal(isHunterAdvisoryHost("hunterhunteradvisors.com:443"), true);
  assert.equal(advisoryPublicPath("www.hunterhunteradvisors.com", "/sign-in"), "/sign-in");
  assert.equal(advisoryPublicPath("jackhunter.com", "/sign-in"), "/hunter-advisory/sign-in");
});

test("auth callbacks use the visible host route contract", () => {
  assert.equal(
    advisoryAuthRedirectUrl(
      {
        origin: "https://www.hunterhunteradvisors.com",
        hostname: "www.hunterhunteradvisors.com",
      },
      "/onboarding?path=investor",
    ),
    "https://www.hunterhunteradvisors.com/auth/confirm?next=%2Fonboarding%3Fpath%3Dinvestor",
  );
  assert.equal(
    advisoryAuthRedirectUrl(
      { origin: "http://localhost:3000", hostname: "localhost" },
      "/reset-password",
    ),
    "http://localhost:3000/hunter-advisory/auth/confirm?next=%2Fhunter-advisory%2Freset-password",
  );
});

test("confirmation continuations stay inside the advisory portal", () => {
  assert.equal(
    safeAdvisoryNext("www.hunterhunteradvisors.com", "/hunter-advisory/funds/example"),
    "/funds/example",
  );
  assert.equal(
    safeAdvisoryNext("jackhunter.com", "/hunter-advisory/funds/example"),
    "/hunter-advisory/funds/example",
  );
  assert.equal(
    safeAdvisoryNext("www.hunterhunteradvisors.com", "//evil.example"),
    "/onboarding",
  );
  assert.equal(
    safeAdvisoryNext("www.hunterhunteradvisors.com", "/auth/sign-out"),
    "/onboarding",
  );
  assert.equal(
    safeAdvisoryNext("jackhunter.com", "/outside-portal"),
    "/hunter-advisory/onboarding",
  );
});
