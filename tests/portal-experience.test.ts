import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("fund detail exposes Performance immediately after Overview", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const tabIds = [...detail.matchAll(/id: "(overview|performance|buildings|documents)"/g)].map((match) => match[1]);
  assert.deepEqual(tabIds, ["overview", "performance", "buildings", "documents"]);
  assert.doesNotMatch(detail, /id: "(?:money|risk|contact)"/);
});

test("historical returns live in a dedicated compact Performance view", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const overview = detail.match(/function Overview[\s\S]*?\n}\n\ntype LocalizedPerformanceRow/)?.[0] ?? "";
  const performance = detail.match(/function Performance\([\s\S]*?\n}\n\nfunction Buildings/)?.[0] ?? "";

  assert.doesNotMatch(overview, /trailingReturns|value="historical"/);
  assert.match(performance, /offering\.trailingReturns/);
  assert.match(performance, /<table className="w-full text-left">/);
  assert.match(performance, /rows\.map\(\(row, index\) =>/);
  assert.match(performance, /tx\(item\.note, lang\)/);
  assert.match(performance, /trailingReturnsNote/);
  assert.match(performance, /c\.noHistory/);
});

test("fund terms remain verbatim and early exit conditions live in Overview", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  assert.match(detail, /fundDefinedFacts/);
  assert.match(detail, /tx\(fact\.value, lang\)/);
  assert.match(detail, /tx\(share\?\.redemptionTerms, lang\)/);
  assert.doesNotMatch(detail, /formatReturnPhrase/);
  assert.doesNotMatch(detail, /Cash income goal/i);
});

test("fund overview replaces oversized metric cards with a lean, trust-oriented flow", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const overview = detail.match(/function Overview[\s\S]*?\n}\n\ntype LocalizedPerformanceRow/)?.[0] ?? "";

  assert.doesNotMatch(overview, /summaryCards|<StatCard/);
  assert.ok(overview.indexOf("<SectionTitle title={c.approach}") < overview.indexOf("<SectionTitle title={c.keyFacts}"));
  assert.match(overview, /<SectionTitle title=\{c\.approach\} \/>[\s\S]*?<p className="max-w-4xl[^>]*">\{tx\(offering\.thesis, lang\)\}<\/p>/);
  assert.match(overview, /add\(c\.aum,[\s\S]*add\(c\.inception,[\s\S]*add\(c\.offeringSize,/);
});

test("fund manager context appears immediately before independent verification", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const overview = detail.match(/function Overview[\s\S]*?\n}\n\ntype LocalizedPerformanceRow/)?.[0] ?? "";
  const managerIndex = overview.indexOf("<SectionTitle title={c.aboutManager}");
  const trustIndex = overview.indexOf("<TrustStrip");

  assert.ok(managerIndex >= 0 && managerIndex < trustIndex);
  assert.match(overview, /tx\(offering\.manager\.description, lang\)/);
  assert.match(overview, /offering\.manager\.headquarters\.city/);
  assert.match(overview, /tx\(offering\.fundType, lang\)/);
  assert.match(overview, /offering\.manager\.website/);
});

test("fund cards keep financial and portfolio facts on detail pages only", () => {
  const cardSources = [
    read("app/hunter-advisory/(portal)/products/ProductsExplorer.tsx"),
    read("app/hunter-advisory/(portal)/dashboard/DashboardView.tsx"),
    read("components/capital/OfferingCard.tsx"),
  ];

  for (const card of cardSources) {
    assert.doesNotMatch(
      card,
      /minimumInvestment|unitPrice|targetReturn|targetDistribution|fundHeadline|offeringSize|aumLabel|portfolioFacts|unitsTotal|amountRaised|fundingPercent/,
    );
  }

  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  assert.match(detail, /minimumInvestment/);
  assert.match(detail, /targetReturn/);
});

test("Discover cards show the exact offering name, company, and an audited trust cue (no categories)", () => {
  const discover = read("app/hunter-advisory/(portal)/products/ProductsExplorer.tsx");
  assert.match(discover, /tx\(offering\.name, lang\)/);
  assert.match(discover, /tx\(offering\.manager\.name, lang\)/);
  // Discover is deliberately uncategorized — no strategy/type badge or filter.
  assert.doesNotMatch(discover, /taxonomyLabel\(strategies/);
  assert.match(discover, /offering\.serviceProviders\?\.auditor/);
  assert.doesNotMatch(discover, /offering\.fundType|issuerLegalType|Vehicle|Yatırım aracı/);
});

test("public landing receives only approved offering previews and global documents route returns to funds", () => {
  const page = read("app/hunter-advisory/page.tsx");
  const landing = read("components/capital/north/PublicLanding.tsx");
  const projection = read("lib/capital/public-preview.ts");
  assert.match(page, /buildPublicOfferingPreviews\(await getPublishedOfferings\(\)\)/);
  assert.match(page, /buildPublicOfferingPreviews\(getProductDemoOfferings\(\)\)/);
  assert.match(page, /productDemoOfferings=\{productDemoOfferings\}/);
  assert.doesNotMatch(landing, /getPublishedOfferings|OfferingBundle|repository-server/);
  assert.match(landing, /productDemoOfferings\.length > 0/);
  assert.match(landing, /isPreview=\{!data\.hasOfferings\}/);
  assert.match(landing, /data\.hasOfferings && <FeaturedOpportunities/);
  assert.match(landing, /hasOfferings=\{data\.hasOfferings\}/);
  assert.match(read("components/capital/north/landing/sections.tsx"), /snap-x snap-mandatory/);
  assert.match(read("components/capital/north/landing/sections.tsx"), /scrollIntoView/);
  assert.match(read("components/capital/north/landing/sections.tsx"), /onScroll=\{syncViewFromRail\}/);
  assert.doesNotMatch(read("components/capital/north/landing/copy.ts"), /Swipe or tap/);
  assert.match(projection, /approval === "approved-public"/);
  assert.match(projection, /targetReturn: approved\(shareClass\?\.targetReturn\)/);
  assert.match(projection, /performance: offering\.trailingReturns\?\.map/);
  assert.doesNotMatch(projection, /documents|risks|serviceProviders|complianceProfile/);
  assert.match(read("app/hunter-advisory/(portal)/documents/page.tsx"), /hunter-advisory\/funds/);
});

test("profile is a permanent sidebar destination instead of an account-popover action", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  assert.match(shell, /id: "account"[\s\S]*href: "\/profile"/);
  assert.doesNotMatch(shell, /href=`?\$\{NORTH_BASE\}\/partner\/apply/);
  const popover = shell.match(/\{accountOpen && \([\s\S]*?<\/form>[\s\S]*?\)\}/)?.[0] ?? "";
  assert.doesNotMatch(popover, /\/profile|partner\/apply/);
});

test("Resources is a shared group with contextual qualification labels", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  assert.match(shell, /id: "resources"/);
  assert.match(shell, /"\/resources\/learning", "Learning centre"/);
  assert.match(shell, /investorReadiness: \["\/resources\/investor-readiness", "Investor self-check"/);
  assert.match(shell, /professionalReadiness: \["\/resources\/investor-readiness", "Investor qualification"/);
  assert.match(shell, /"\/commissions", "Ödemeler"/);
  assert.match(shell, /professional: \[[\s\S]*?"\/commissions", "Payments"[\s\S]*?\],\n    learning:/);
  assert.match(shell, /accountView === "professional"[\s\S]*c\.professionalReadiness/);
});

test("partner payment page uses payment terminology in both languages", () => {
  const payments = read("components/capital/north/RepresentativeCommissions.tsx");
  assert.match(payments, /title: "Ödemeler"/);
  assert.match(payments, /offering: "Yatırım ürünü"/);
  assert.match(payments, /payment: "Ödeme"/);
  assert.match(payments, /partnerPayment: "Partner ödemesi"/);
  assert.match(payments, /title: "Payments"/);
  assert.doesNotMatch(payments, /title: "Fon dağıtım komisyonlarım"/);
  assert.doesNotMatch(payments, /title: "Fon dağıtım ödemelerim"/);
});

test("account view is shared by the sidebar and qualification tool", () => {
  const provider = read("components/capital/north/PortalAccessProvider.tsx");
  const readiness = read("app/hunter-advisory/(portal)/resources/investor-readiness/InvestorReadinessTool.tsx");
  assert.match(provider, /accountView: PortalAccountView/);
  assert.match(provider, /hnc-account-view/);
  assert.match(readiness, /accountView === "professional"/);
  assert.match(readiness, /await saveInvestorAssessment/);
});

test("professional account view remains active across personal investing routes", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  assert.match(shell, /investor \? \[\{[\s\S]*id: "investing"/);
  assert.match(shell, /accountView === "professional" && professional/);
  assert.doesNotMatch(
    shell,
    /pathname\.includes\("\/portfolio"\)[\s\S]*setAccountView\("investor"\)/,
  );
});

test("active professionals retain personal investment actions in Discover", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  assert.match(detail, /const investor = canUseWorkspace\(context, "investor"\)/);
  assert.match(detail, /const professional = accountView === "professional"/);
  assert.match(detail, /\{investor && <InvestmentRequestButton/);
  // Presentation is now surfaced inline in the overview for signed-up users
  // (no separate professional-only /present hero link).
  assert.match(detail, /doc\.type === "presentation"/);
  assert.match(detail, /<PresentationCard/);
});

test("learning centre ships a bilingual sourced flagship guide", () => {
  const learning = read("lib/capital/learning.ts");
  const guide = read("components/capital/north/LearningGuide.tsx");
  assert.match(learning, /Understanding Core, Core-Plus, Value-Add and Opportunistic Real Estate/);
  assert.match(learning, /Core, Core-Plus, Value-Add ve Opportunistic/);
  assert.match(learning, /Urban Land Institute/);
  assert.match(guide, /ReactMarkdown/);
  assert.match(guide, /remarkGfm/);
  assert.doesNotMatch(learning, /6-10%|8-12%|12-17%|15-25%/);
});

test("legacy professional profile routes redirect into the unified profile", () => {
  assert.match(
    read("app/hunter-advisory/(portal)/partner/apply/page.tsx"),
    /profile\?apply=1#professional-access/,
  );
  assert.match(
    read("app/hunter-advisory/(portal)/partner-program/page.tsx"),
    /profile#professional-access/,
  );
});

test("unified profile uses an account workspace and state-aware modal professional access", () => {
  const profile = read("components/capital/north/ProfileView.tsx");
  const application = read("components/capital/north/PartnerApplicationView.tsx");
  const applicationRoute = read("app/api/hnc-partner-applications/route.ts");
  assert.match(profile, /accountInformation/);
  assert.match(profile, /residenceJurisdiction/);
  assert.match(profile, /PartnerApplicationView embedded/);
  assert.match(profile, /minmax\(0,1\.4fr\)/);
  assert.doesNotMatch(profile, /fullName|accountInformationMeta/);
  assert.doesNotMatch(profile, /PARTNER_TIER_THRESHOLDS|PARTNER_COMMISSION_ALLOCATIONS/);
  assert.doesNotMatch(profile, /effectivePartnerBps|FundCommissionSchedule|hnc-fund-commission-schedules|selectedOfferingId/);
  assert.doesNotMatch(profile, /investmentObjective|timeHorizon|riskAcknowledgedAt|contactConsentAt/);
  assert.match(application, /id="professional-access"/);
  assert.match(application, /stateLabels/);
  assert.match(application, /BriefcaseBusiness/);
  assert.doesNotMatch(application, /Sparkles|benefitOne|benefitTwo|benefitThree/);
  assert.match(application, /professionalFields/);
  assert.match(application, /maskLicenceNumber/);
  assert.match(application, /data-ph-mask/);
  assert.doesNotMatch(application, /<details|viewDetails/);
  assert.match(application, /SPL_PUBLIC_SEARCH_URL/);
  assert.match(application, /<Dialog open=/);
  assert.match(application, /name="firmName"/);
  assert.doesNotMatch(application, /type="file"|name="organizationId"|newOrganization|Search firms|Firma ara/);
  assert.match(applicationRoute, /firmName: z\.string\(\)\.trim\(\)\.min\(1\)/);
  assert.doesNotMatch(applicationRoute, /evidenceStoragePath|organizationId: z|string\(\)\.uuid/);
});

test("fund pages show only the published gross schedule to active professionals", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const route = read("app/api/hnc-fund-commission-schedules/route.ts");
  assert.match(detail, /usePublishedFundCommissionValue\(offering\.id, professional, lang\)/);
  assert.match(detail, /if \(professional && commission\) facts\.push\(\{ label: c\.commission, value: commission \}\)/);
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

test("Operations exposes controlled learning content only to compliance roles", () => {
  const operations = read("components/capital/north/OperationsInbox.tsx");
  const manager = read("components/capital/north/LearningContentManager.tsx");
  assert.match(operations, /compliance \? \["requests", "professional", "licences", "firms", "content"/);
  assert.match(operations, /LearningContentManager/);
  assert.match(manager, /Import flagship draft/);
  assert.match(manager, /request_changes/);
  assert.match(manager, /author cannot approve/i);
});
