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

test("published terms stay verbatim and file under the document that sets them out", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const ui = read("components/capital/offering-ui.tsx");
  const keyFacts = read("lib/capital/key-facts.ts");

  // The detail page no longer dumps every fund-defined fact into Key facts; the
  // Documents tab renders them under the document they cite.
  assert.match(detail, /<DocumentTermsDisclosure/);
  assert.match(detail, /documentTermGroups\(offering, share, document\)/);
  assert.match(ui, /tx\(fact\.value, lang\)/);
  // Values are never reformatted on the way out.
  assert.doesNotMatch(detail, /formatReturnPhrase/);
  assert.doesNotMatch(keyFacts, /formatReturnPhrase/);
  assert.doesNotMatch(detail, /Cash income goal/i);
});

test("dealer compensation never reaches an investor surface", () => {
  const keyFacts = read("lib/capital/key-facts.ts");
  const deck = read("components/capital/north/FundPresentation.tsx");

  // The audience gate lives in one place and both investor surfaces use it.
  assert.match(keyFacts, /\(fact\.audience \?\? "investor"\) === "investor"/);
  assert.match(deck, /investorFacts\(allPublishedFacts\(offering, share\), share\?\.id\)/);
  assert.doesNotMatch(deck, /fact\.approval !== "private" && \(!fact\.shareClassId/);
});

test("the audit cue carries the auditor's own scope, never the Hunter check date", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const masthead = detail.match(/\{c\.audited\}[\s\S]*?<\/p>/)?.[0] ?? "";

  assert.match(masthead, /serviceProviders\.auditor\.scope/);
  assert.doesNotMatch(masthead, /verifiedAt/);
  // Hunter claims nothing of its own here: the section just names the firms
  // the manager itself names, with no verification wording anywhere.
  assert.match(detail, /trust: "Service providers"/);
  assert.doesNotMatch(detail, /Independently verified|Hunter data check/);
});

test("the service providers card is a bare role-and-firm list, not a trust badge", () => {
  const ui = read("components/capital/offering-ui.tsx");
  const card = ui.match(/export function ServiceProvidersCard[\s\S]*?\n}\n/)?.[0] ?? "";

  // White like every other section card — not the beige "verified" panel.
  assert.match(card, /bg-card/);
  assert.doesNotMatch(card, /bg-secondary/);
  // No shield, no green tick, no seal-like colouring beside the firms.
  assert.doesNotMatch(card, /ShieldCheck|CheckCircle2|--ok/);
  // A role and a firm, nothing else: no engagement caption, no profile date.
  assert.doesNotMatch(card, /scope|verifiedAt|asOfDate/);
});

test("fund overview replaces oversized metric cards with a lean, trust-oriented flow", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const overview = detail.match(/function Overview[\s\S]*?\n}\n\ntype LocalizedPerformanceRow/)?.[0] ?? "";

  assert.doesNotMatch(overview, /summaryCards|<StatCard/);
  assert.doesNotMatch(overview, /c\.approach/);
  assert.doesNotMatch(overview, /offering\.thesis/);
  // Key facts is a fixed eight built in one place, not accumulated inline from
  // whatever the fund happens to publish. See tests/offering-key-facts.test.ts.
  assert.match(overview, /buildEssentialKeyFacts\(offering, share, lang, c\)/);
  assert.doesNotMatch(overview, /termFacts|hasCategory/);
});

test("fund manager context appears immediately before its service providers", () => {
  const detail = read("app/hunter-advisory/(portal)/products/[slug]/ProductDetailView.tsx");
  const overview = detail.match(/function Overview[\s\S]*?\n}\n\ntype LocalizedPerformanceRow/)?.[0] ?? "";
  const managerIndex = overview.indexOf("<SectionTitle title={c.aboutManager}");
  const trustIndex = overview.indexOf("<ServiceProvidersCard");

  assert.ok(managerIndex >= 0 && managerIndex < trustIndex);
  assert.match(overview, /tx\(offering\.manager\.description, lang\)/);
  assert.match(overview, /offering\.manager\.headquarters\.city/);
  // The one-line legal form; the full statement is a term of the OM.
  assert.match(overview, /tx\(offering\.structureLabel \?\? offering\.fundType, lang\)/);
  assert.match(overview, /offering\.manager\.website/);
});

test("fund cards keep financial and portfolio facts on detail pages only", () => {
  const cardSources = [
    read("app/hunter-advisory/(portal)/products/ProductsExplorer.tsx"),
    read("app/hunter-advisory/(portal)/dashboard/DashboardView.tsx"),
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

test("public landing receives only approved offering previews and global documents route returns to investments", () => {
  const page = read("app/hunter-advisory/page.tsx");
  const landing = read("components/capital/north/PublicLanding.tsx");
  const projection = read("lib/capital/public-preview.ts");
  // Supabase is the single source: the landing renders only published offerings,
  // with no hardcoded demo/fixture fallback.
  assert.match(page, /buildPublicOfferingPreviews\(await getPublishedOfferings\(\)\)/);
  assert.doesNotMatch(page, /getProductDemoOfferings|productDemoOfferings|repository"/);
  assert.doesNotMatch(landing, /getPublishedOfferings|OfferingBundle|repository-server|productDemoOfferings/);
  assert.match(landing, /const displayOfferings = offerings/);
  assert.match(landing, /offerings=\{displayOfferings\.slice\(0, 2\)\}/);
  assert.match(landing, /isPreview=\{isPreview\}/);
  assert.match(landing, /data\.hasOfferings && <FeaturedOpportunities c=\{c\} offerings=\{displayOfferings\}/);
  assert.match(landing, /hasOfferings=\{data\.hasOfferings\}/);
  assert.match(read("components/capital/north/landing/sections.tsx"), /snap-x snap-mandatory/);
  assert.match(read("components/capital/north/landing/sections.tsx"), /scrollIntoView/);
  assert.match(read("components/capital/north/landing/sections.tsx"), /onScroll=\{syncViewFromRail\}/);
  assert.doesNotMatch(read("components/capital/north/landing/copy.ts"), /Swipe or tap/);
  assert.match(projection, /approval === "approved-public"/);
  assert.match(projection, /targetReturn: approved\(shareClass\?\.targetReturn\)/);
  assert.match(projection, /performance: offering\.trailingReturns\?\.map/);
  assert.doesNotMatch(projection, /documents|risks|serviceProviders|complianceProfile/);
  assert.match(read("app/hunter-advisory/(portal)/documents/page.tsx"), /hunter-advisory\/investments/);
});

test("profile is a permanent sidebar destination instead of an account-popover action", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  assert.match(shell, /id: "account"[\s\S]*href: "\/profile"/);
  assert.doesNotMatch(shell, /href=`?\$\{NORTH_BASE\}\/partner\/apply/);
  const popover = shell.match(/\{accountOpen && \([\s\S]*?<\/form>[\s\S]*?\)\}/)?.[0] ?? "";
  assert.doesNotMatch(popover, /\/profile|partner\/apply/);
});

test("Resources is a shared group of two entries: learning and tools", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  assert.match(shell, /id: "resources"/);
  assert.match(shell, /"\/resources\/learning", "Learning centre"/);
  // The sidebar names the tools group; each tool names itself on its own page.
  assert.match(shell, /tools: \["\/resources\/tools", "Tools"/);
  assert.match(shell, /tools: \["\/resources\/tools", "Araçlar"/);
  assert.doesNotMatch(shell, /compare-investments/);
  // Qualification is reached through Tools, so it has no sidebar entry of its
  // own — it only appears as the path that keeps Tools lit.
  assert.doesNotMatch(shell, /Readiness: \["\/resources\/investor-readiness"/);
  assert.match(shell, /items: \[c\.learning, c\.tools\]/);
  assert.match(shell, /href === "\/resources\/tools" && pathname\.startsWith\(`\$\{NORTH_BASE\}\/resources\/investor-readiness`\)/);
  assert.match(shell, /"\/commissions", "Ödemeler"/);
  assert.match(shell, /professional: \[[\s\S]*?"\/commissions", "Payments"[\s\S]*?\],\n    learning:/);
});

test("the tools hub carries the qualification tool with per-view labels", () => {
  const hub = read("components/capital/north/ToolsHub.tsx");
  assert.match(hub, /href: "\/resources\/investor-readiness"/);
  assert.match(hub, /name: "Investor qualification"/);
  assert.match(hub, /name: "Check your investor category"/);
  assert.match(hub, /name: "Yatırımcı sınıflandırması"/);
  assert.match(hub, /name: "Yatırımcı kategorinizi kontrol edin"/);
  assert.match(hub, /accountView === "professional" && canUseWorkspace\(context, "professional"\)/);
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

test("learning content is Supabase-only with no hardcoded guide in app code", () => {
  const learning = read("lib/capital/learning.ts");
  const repo = read("lib/capital/learning-repository-server.ts");
  const guide = read("components/capital/north/LearningGuide.tsx");
  // No hardcoded guide fixture or fixture fallback remains in the app.
  assert.doesNotMatch(learning, /FLAGSHIP_LEARNING_RESOURCE|Understanding Core, Core-Plus/);
  assert.doesNotMatch(repo, /fixturesAllowed|FLAGSHIP_LEARNING_RESOURCE|HNC_USE_FIXTURE_DATA/);
  assert.match(repo, /published_learning_resources/);
  // The guide content is preserved as seed data for provisioning into Supabase.
  const seed = JSON.parse(read("supabase/seed/learning/core-strategies-guide.json"));
  assert.equal(seed.slug, "core-core-plus-value-add-opportunistic-real-estate");
  assert.match(seed.title.en, /Understanding Core, Core-Plus, Value-Add and Opportunistic Real Estate/);
  assert.match(guide, /ReactMarkdown/);
  assert.match(guide, /remarkGfm/);
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

test("the Admin console mounts fund schedules behind the platform-admin gate", () => {
  const console_ = read("components/capital/north/AdminConsole.tsx");
  const manager = read("components/capital/north/FundCommissionScheduleManager.tsx");
  // Module-by-module role sets were replaced by one gate on the console plus
  // the `private.is_hunter_admin()` predicate on every view it reads.
  assert.match(console_, /hasPlatformRole\(currentUser, "master_admin"\)/);
  assert.match(console_, /if \(!isAdmin\)/);
  assert.match(console_, /FundCommissionScheduleManager/);
  assert.match(manager, /Save draft|Taslak kaydet/);
  assert.match(manager, /Published schedules are immutable/);
});

test("the Admin console exposes controlled learning content to platform admins only", () => {
  const console_ = read("components/capital/north/AdminConsole.tsx");
  const manager = read("components/capital/north/LearningContentManager.tsx");
  assert.match(console_, /hasPlatformRole\(currentUser, "master_admin"\)/);
  assert.match(console_, /LearningContentManager/);
  assert.match(manager, /Import flagship draft/);
  assert.match(manager, /request_changes/);
  assert.match(manager, /author cannot approve/i);
});
