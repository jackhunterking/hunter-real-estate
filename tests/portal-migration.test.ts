import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const migrationDir = resolve(root, "supabase/migrations");
const migration = readdirSync(migrationDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(resolve(migrationDir, file), "utf8"))
  .join("\n");
const partnerRedesignMigration = readFileSync(
  resolve(
    migrationDir,
    readdirSync(migrationDir).find((file) =>
      file.endsWith("_simplify_partner_application_and_protect_fund_commissions.sql"),
    ) ?? "missing-partner-redesign-migration.sql",
  ),
  "utf8",
);

test("advisory application uses the canonical route tree only", () => {
  assert.equal(existsSync(resolve(root, "app/[locale]/equity-market/page.tsx")), true);
  assert.equal(existsSync(resolve(root, "app/hunter-north-capital")), false);
  const middleware = readFileSync(resolve(root, "middleware.ts"), "utf8");
  // The prefix has exactly one definition (lib/equity-market/investment-brand.ts);
  // middleware must derive it rather than re-declare the literal.
  assert.match(middleware, /const PORTAL_PREFIX = INVESTMENT_BASE_PATH/);
  assert.match(
    readFileSync(resolve(root, "lib/equity-market/investment-brand.ts"), "utf8"),
    /export const INVESTMENT_BASE_PATH = "\/equity-market"/,
  );
  assert.match(middleware, /const PORTAL_ORIGIN = "https:\/\/equitymarket\.io"/);
  // The retired prefix keeps a 301 rather than disappearing.
  assert.match(middleware, /RETIRED_PORTAL_PREFIXES = \["\/hunter-advisory"\]/);
  // Legacy /investing is redirected off the locale-stripped path now that routes
  // are locale-prefixed (see stripLocale() in middleware.ts).
  assert.match(middleware, /rest === "\/investing"/);
  assert.doesNotMatch(middleware, /hunter-north-capital/);
});

test("every exposed privacy-domain table enables row level security", () => {
  const tables = [
    "profiles",
    "organizations",
    "organization_memberships",
    "firm_affiliations",
    "partner_applications",
    "regulatory_credentials",
    "license_verification_events",
    "partner_accounts",
    "organization_offering_access",
    "referrals",
    "referral_status_history",
    "investment_applications",
    "commission_entries",
    "document_records",
    "audit_events",
    "investment_interest_requests",
    "fund_commission_schedules",
  ];
  for (const table of tables) {
    assert.match(migration, new RegExp(`alter table app\\.${table} enable row level security;`));
  }
});

test("account intent routes onboarding but cannot grant partner permissions", () => {
  assert.match(migration, /account_intent app\.account_intent/);
  assert.match(migration, /onboarding_status app\.onboarding_status/);
  const onboardingFunction = migration.match(
    /create or replace function app\.complete_hnc_onboarding[\s\S]*?create or replace function app\.create_investment_interest/,
  )?.[0] ?? "";
  assert.doesNotMatch(onboardingFunction, /insert into app\.(partner_accounts|organization_memberships|platform_role_assignments)/);
  assert.match(onboardingFunction, /update app\.profiles/);
});

test("investment interests are owner-readable and administrator-controlled", () => {
  assert.match(migration, /create table app\.investment_interest_requests/);
  assert.match(migration, /investment_interest_requests_owner_select/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /investment_interest_requests_hunter_update/);
  assert.match(migration, /private\.is_hunter_admin\(\)/);
  assert.match(migration, /one_open_interest_per_user_offering/);
  const ownerView = migration.match(/create view api\.investment_interest_requests[\s\S]*?create or replace function app\.complete_hnc_onboarding/)?.[0] ?? "";
  assert.doesNotMatch(ownerView, /reviewer_notes|reviewed_by/);
  assert.match(migration, /list_investment_interest_admin/);
});

test("investment requests enforce consent, positive amounts, publication, and duplicate checks", () => {
  const requestFunction = migration.match(
    /create or replace function app\.create_investment_request[\s\S]*?create or replace function api\.create_investment_request/,
  )?.[0] ?? "";
  assert.match(requestFunction, /Authentication is required/);
  assert.match(requestFunction, /Contact consent is required/);
  assert.match(requestFunction, /p_amount is null or p_amount <= 0/);
  assert.match(requestFunction, /offering\.status = 'published'/);
  assert.match(requestFunction, /An open request already exists for this fund/);
  assert.match(requestFunction, /status[\s\S]*'submitted'/);
});

test("partner applications prevent duplicate active reviews while allowing revised submissions", () => {
  const applicationFunction = migration.match(
    /create or replace function app\.submit_partner_application[\s\S]*?create or replace function app\.decide_firm_membership/,
  )?.[0] ?? "";
  assert.match(applicationFunction, /application\.status in \('submitted', 'under_review'\)/);
  assert.match(applicationFunction, /An active partner application already exists/);
  assert.doesNotMatch(
    applicationFunction,
    /application\.status in \('submitted', 'under_review', 'changes_requested', 'rejected'\)/,
  );
});

test("simplified partner applications atomically resolve typed firm names", () => {
  assert.match(partnerRedesignMigration, /Firm name is required/);
  assert.match(partnerRedesignMigration, /pg_advisory_xact_lock/);
  assert.match(partnerRedesignMigration, /lower\(organization\.legal_name\)[\s\S]*lower\(pg_catalog\.btrim\(p_new_firm_legal_name\)\)/);
  assert.match(partnerRedesignMigration, /'pending_review'/);
  assert.match(partnerRedesignMigration, /on conflict \(organization_id, user_id\) do update/);
});

test("Operations queue is security-invoker and keeps compliance and finance modules separate", () => {
  assert.match(migration, /create view api\.operations_queue with \(security_invoker = true\)/);
  assert.match(migration, /'compliance_admin'::text as required_role/);
  assert.match(migration, /'finance_admin'/);
  assert.match(migration, /private\.has_platform_role\('compliance_admin'\)/);
  assert.match(migration, /private\.has_platform_role\('finance_admin'\)/);
  assert.match(migration, /revoke all on api\.operations_queue from public, anon/);
  assert.match(migration, /grant select on api\.operations_queue to authenticated/);
});

test("controlled offering content cannot skip publication stages", () => {
  assert.match(migration, /offering_content_versions_enforce_progression/);
  assert.match(migration, /New offering versions must begin as draft/);
  assert.match(migration, /old\.status = 'draft' and new\.status in \('in_review', 'withdrawn'\)/);
  assert.match(migration, /old\.status = 'approved' and new\.status in \('in_review', 'published', 'withdrawn'\)/);
  assert.match(migration, /Approved offering versions require author, reviewer, and compliance owner/);
});

test("legacy cleanup remains an approval-only manifest", () => {
  const manifestPath = resolve(root, "docs/HNC_LEGACY_DELETION_MANIFEST.md");
  assert.equal(existsSync(manifestPath), true);
  const manifest = readFileSync(manifestPath, "utf8");
  assert.match(manifest, /Awaiting explicit owner approval/);
  assert.match(manifest, /Nothing in this manifest has been deleted/);
  assert.match(manifest, /Never delete through this manifest/);
});

test("append-only compliance and audit records have immutable database triggers", () => {
  assert.match(migration, /license_verification_events_append_only/);
  assert.match(migration, /audit_events_append_only/);
  assert.match(migration, /Append-only records cannot be updated or deleted/);
});

test("firm access never becomes referral ownership permission", () => {
  const referralPolicy = migration.match(
    /create policy "referrals_owner_or_hunter_select"[\s\S]*?create policy "referrals_owner_insert"/,
  )?.[0] ?? "";
  assert.match(referralPolicy, /owner_user_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(referralPolicy, /has_org_role/);
  assert.equal(
    existsSync(resolve(root, "app/[locale]/equity-market/(portal)/firm/clients")),
    false,
  );
});

test("firm directories use security-invoker views and commissions omit client identifiers", () => {
  assert.match(migration, /create view app\.firm_membership_directory\s+with \(security_invoker = true\)/);
  const firmCommissionView = migration.match(
    /create view app\.firm_commission_directory[\s\S]*?create view app\.partner_access_status/,
  )?.[0] ?? "";
  assert.match(firmCommissionView, /redacted_referral_reference/);
  assert.doesNotMatch(firmCommissionView, /client_first_name|client_last_name|client_email/);
  assert.doesNotMatch(firmCommissionView, /introducing_representative_id/);
});

test("fund distribution commissions use the fixed tier allocation schedule", () => {
  const commissionTable = migration.match(
    /create table app\.commission_entries[\s\S]*?create index commission_entries_beneficiary_user_id_idx/,
  )?.[0] ?? "";
  assert.match(commissionTable, /gross_distribution_commission_amount/);
  assert.match(commissionTable, /allocation_percentage in \(30, 40, 50\)/);
  assert.match(commissionTable, /tier_at_funding = 'associate' and allocation_percentage = 30/);
  assert.match(commissionTable, /tier_at_funding = 'principal' and allocation_percentage = 40/);
  assert.match(commissionTable, /tier_at_funding = 'managing_partner' and allocation_percentage = 50/);
  assert.match(
    commissionTable,
    /amount = round\(gross_distribution_commission_amount \* allocation_percentage \/ 100, 2\)/,
  );

  const createCommissionFunction = migration.match(
    /create or replace function app\.create_commission_entry[\s\S]*?create or replace function app\.set_commission_status/,
  )?.[0] ?? "";
  assert.match(createCommissionFunction, /when 'associate' then 30/);
  assert.match(createCommissionFunction, /when 'principal' then 40/);
  assert.match(createCommissionFunction, /when 'managing_partner' then 50/);
  assert.match(createCommissionFunction, /p_distribution_commission_received_at > current_date/);
});

test("fund commission schedules are effective-dated, RLS protected, and finance controlled", () => {
  assert.match(migration, /create table app\.fund_commission_schedules/);
  assert.match(migration, /gross_commission_bps numeric\(8, 2\)/);
  assert.match(migration, /effective_from date not null/);
  assert.match(migration, /effective_to date/);
  assert.match(migration, /alter table app\.fund_commission_schedules enable row level security/);
  assert.match(migration, /fund_commission_schedules_current_select/);
  assert.match(migration, /status = 'published'[\s\S]*effective_from <= current_date/);
  assert.match(migration, /private\.has_platform_role\('finance_admin'/);
  assert.match(migration, /create or replace view api\.fund_commission_schedules[\s\S]*security_invoker = true/);
  assert.match(migration, /Published fund commission schedules are immutable/);
  assert.match(migration, /fund_commission_schedule\.created/);
  assert.match(migration, /fund_commission_schedule\.published/);
  assert.match(
    partnerRedesignMigration,
    /fund_commission_schedules_current_select[\s\S]*private\.partner_is_active\(\(select auth\.uid\(\)\)\)/,
  );
});

test("new commission entries retain an optional matching fund-schedule reference", () => {
  assert.match(migration, /add column fund_commission_schedule_id uuid/);
  assert.match(migration, /references app\.fund_commission_schedules\(id\) on delete set null/);
  assert.match(migration, /create trigger commission_entries_attach_fund_schedule/);
  const attachment = migration.match(
    /create or replace function private\.attach_fund_commission_schedule[\s\S]*?create trigger commission_entries_attach_fund_schedule/,
  )?.[0] ?? "";
  assert.match(attachment, /schedule\.status = 'published'/);
  assert.match(attachment, /schedule\.effective_from <= new\.funded_at/);
  assert.match(attachment, /schedule\.effective_to is null or schedule\.effective_to >= new\.funded_at/);
});

test("Hunter & Hunter Investment Advisors privileged functions require MFA-aware database permissions", () => {
  assert.match(migration, /create or replace function private\.has_mfa/);
  assert.match(migration, /auth\.jwt\(\).*'aal'.*'aal2'/s);
  assert.match(migration, /revoke execute on function app\.record_license_verification/);
  assert.match(migration, /grant execute on function app\.record_license_verification/);
});
