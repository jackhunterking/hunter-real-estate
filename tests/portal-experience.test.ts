import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("fund detail exposes only Overview, Buildings, and Documents tabs", () => {
  const detail = read("app/hunter-north-capital/(portal)/products/[slug]/ProductDetailView.tsx");
  const tabIds = [...detail.matchAll(/id: "(overview|buildings|documents)"/g)].map((match) => match[1]);
  assert.deepEqual(tabIds, ["overview", "buildings", "documents"]);
  assert.doesNotMatch(detail, /id: "(?:money|risk|contact)"/);
});

test("fund terms remain verbatim and early exit conditions live in Overview", () => {
  const detail = read("app/hunter-north-capital/(portal)/products/[slug]/ProductDetailView.tsx");
  assert.match(detail, /fundDefinedFacts/);
  assert.match(detail, /fact\.value\[lang\]/);
  assert.match(detail, /share\?\.redemptionTerms\?\.\[lang\]/);
  assert.doesNotMatch(detail, /formatReturnPhrase/);
  assert.doesNotMatch(detail, /Cash income goal/i);
});

test("fund cards keep financial and portfolio facts on detail pages only", () => {
  const cardSources = [
    read("app/hunter-north-capital/(portal)/products/ProductsExplorer.tsx"),
    read("app/hunter-north-capital/(portal)/dashboard/DashboardView.tsx"),
    read("components/capital/OfferingCard.tsx"),
  ];

  for (const card of cardSources) {
    assert.doesNotMatch(
      card,
      /minimumInvestment|unitPrice|targetReturn|targetDistribution|fundHeadline|offeringSize|aumLabel|portfolioFacts|unitsTotal|amountRaised|fundingPercent/,
    );
  }

  const detail = read("app/hunter-north-capital/(portal)/products/[slug]/ProductDetailView.tsx");
  assert.match(detail, /minimumInvestment/);
  assert.match(detail, /targetReturn/);
});

test("public landing does not load fund data and global documents route returns to funds", () => {
  assert.doesNotMatch(read("app/hunter-north-capital/page.tsx"), /getPublishedOfferings/);
  assert.match(read("app/hunter-north-capital/(portal)/documents/page.tsx"), /hunter-north-capital\/funds/);
});

test("profile is a permanent sidebar destination instead of an account-popover action", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  assert.match(shell, /id: "account"[\s\S]*href: "\/profile"/);
  assert.doesNotMatch(shell, /href=`?\$\{NORTH_BASE\}\/partner\/apply/);
  const popover = shell.match(/\{accountOpen && \([\s\S]*?<\/form>[\s\S]*?\)\}/)?.[0] ?? "";
  assert.doesNotMatch(popover, /\/profile|partner\/apply/);
});

test("regular investors can discover the investor self-check without duplicating the professional link", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  assert.match(shell, /investorReadiness: \["\/resources\/investor-readiness", "Investor self-check"/);
  assert.match(shell, /!professional \? \[c\.investorReadiness\] : \[\]/);
  assert.match(shell, /professional:[\s\S]*"\/resources\/investor-readiness", "Investor qualification"/);
});

test("legacy professional profile routes redirect into the unified profile", () => {
  assert.match(
    read("app/hunter-north-capital/(portal)/partner/apply/page.tsx"),
    /profile\?apply=1#professional-access/,
  );
  assert.match(
    read("app/hunter-north-capital/(portal)/partner-program/page.tsx"),
    /profile#partner-program/,
  );
});

test("unified profile uses a modal application and fixed tier cards without fund calculations", () => {
  const profile = read("components/capital/north/ProfileView.tsx");
  const application = read("components/capital/north/PartnerApplicationView.tsx");
  const applicationRoute = read("app/api/hnc-partner-applications/route.ts");
  assert.match(profile, /PARTNER_TIER_THRESHOLDS/);
  assert.match(profile, /PARTNER_COMMISSION_ALLOCATIONS/);
  assert.match(profile, /professionalState !== "not_applied"/);
  assert.doesNotMatch(profile, /effectivePartnerBps|FundCommissionSchedule|hnc-fund-commission-schedules|selectedOfferingId/);
  assert.doesNotMatch(profile, /investmentObjective|timeHorizon|riskAcknowledgedAt|contactConsentAt|residenceJurisdiction/);
  assert.match(application, /id="professional-access"/);
  assert.match(profile, /id="partner-program"/);
  assert.match(application, /maskLicenceNumber/);
  assert.match(application, /data-ph-mask/);
  assert.match(application, /<details className="group/);
  assert.match(application, /SPL_PUBLIC_SEARCH_URL/);
  assert.match(application, /<Dialog open=/);
  assert.match(application, /name="firmName"/);
  assert.doesNotMatch(application, /type="file"|name="organizationId"|newOrganization|Search firms|Firma ara/);
  assert.match(applicationRoute, /firmName: z\.string\(\)\.trim\(\)\.min\(1\)/);
  assert.doesNotMatch(applicationRoute, /evidenceStoragePath|organizationId: z|string\(\)\.uuid/);
});

test("fund pages show only the published gross schedule to active professionals", () => {
  const detail = read("app/hunter-north-capital/(portal)/products/[slug]/ProductDetailView.tsx");
  const route = read("app/api/hnc-fund-commission-schedules/route.ts");
  assert.match(detail, /professional && <PublishedFundCommission/);
  assert.match(detail, /offeringId=\$\{encodeURIComponent\(offeringId\)\}/);
  assert.match(detail, /grossCommissionBps/);
  assert.doesNotMatch(detail, /effectivePartnerBps|PARTNER_COMMISSION_ALLOCATIONS/);
  assert.match(route, /params\.get\("offeringId"\)/);
  assert.match(route, /\.eq\("offering_id", offeringId as string\)/);
  assert.match(route, /\.limit\(1\)/);
});

test("Operations exposes fund schedules only through the finance-enabled module", () => {
  const operations = read("components/capital/north/OperationsInbox.tsx");
  const manager = read("components/capital/north/FundCommissionScheduleManager.tsx");
  assert.match(operations, /finance \? \["payments", "fund-schedules", "audit"\]/);
  assert.match(operations, /FundCommissionScheduleManager/);
  assert.match(manager, /Save draft|Taslak kaydet/);
  assert.match(manager, /Published schedules are immutable/);
});
