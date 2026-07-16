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
  ];
  for (const table of tables) {
    assert.match(migration, new RegExp(`alter table app\\.${table} enable row level security;`));
  }
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
    existsSync(resolve(root, "app/hunter-north-capital/(portal)/firm/clients")),
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

test("Hunter North privileged functions require MFA-aware database permissions", () => {
  assert.match(migration, /create or replace function private\.has_mfa/);
  assert.match(migration, /auth\.jwt\(\).*'aal'.*'aal2'/s);
  assert.match(migration, /revoke execute on function app\.record_license_verification/);
  assert.match(migration, /grant execute on function app\.record_license_verification/);
});
