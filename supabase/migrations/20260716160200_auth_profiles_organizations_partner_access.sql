create type app.organization_status as enum ('pending', 'active', 'suspended', 'terminated');
create type app.firm_membership_role as enum ('representative', 'membership_admin', 'finance_admin');
create type app.membership_status as enum ('pending', 'active', 'suspended', 'ended');
create type app.partner_application_status as enum ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected');
create type app.firm_affiliation_status as enum ('pending_firm', 'approved_by_firm', 'approved_by_hnc_fallback', 'rejected', 'suspended', 'ended');
create type app.license_verification_status as enum ('pending', 'verified', 'mismatch', 'not_found', 'suspended', 'expired', 'revoked', 'manual_review');
create type app.partner_account_status as enum ('pending', 'active', 'suspended', 'expired', 'terminated');
create type app.partner_tier as enum ('associate', 'principal', 'managing_partner');
create type app.firm_offering_status as enum ('proposed', 'due_diligence', 'approved', 'on_shelf', 'paused');
create type app.commission_status as enum ('draft', 'approved', 'paid', 'void');
create type app.commission_beneficiary_type as enum ('representative', 'organization');
create type app.platform_role as enum ('compliance_admin', 'finance_admin', 'platform_admin');
create type app.document_access as enum ('private_user', 'approved_partner', 'organization_assigned', 'internal');
create type app.investment_application_status as enum ('draft', 'submitted', 'compliance_review', 'approved_for_subscription', 'accepted', 'funded', 'declined', 'withdrawn', 'closed');

create table app.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  middle_names text,
  last_name text not null default '',
  display_name text not null default '',
  email text not null,
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.platform_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app.platform_role not null,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  unique (user_id, role)
);

create table app.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  firm_type text not null,
  website text,
  business_domain text,
  status app.organization_status not null default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organizations_legal_name_key
  on app.organizations (lower(legal_name));

create table app.organization_private_details (
  organization_id uuid primary key references app.organizations(id) on delete cascade,
  spk_registration text,
  registered_address text,
  authorized_contact text,
  compliance_contact text,
  reviewer_notes text,
  updated_at timestamptz not null default now()
);

create table app.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  roles app.firm_membership_role[] not null default array['representative'::app.firm_membership_role],
  status app.membership_status not null default 'pending',
  work_email text not null,
  registered_name text not null,
  licence_type text,
  masked_licence_number text,
  verification_status app.license_verification_status not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  ended_at timestamptz,
  unique (organization_id, user_id),
  check (cardinality(roles) > 0)
);

create index organization_memberships_user_id_idx on app.organization_memberships(user_id);
create index organization_memberships_organization_id_idx on app.organization_memberships(organization_id);

create table app.firm_affiliations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  status app.firm_affiliation_status not null default 'pending_firm',
  is_primary boolean not null default true,
  approved_by uuid references auth.users(id),
  approval_reason text,
  approved_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index one_active_primary_firm_per_user
  on app.firm_affiliations(user_id)
  where is_primary
    and status in ('approved_by_firm', 'approved_by_hnc_fallback');

create index firm_affiliations_organization_id_idx on app.firm_affiliations(organization_id);
create index firm_affiliations_user_id_idx on app.firm_affiliations(user_id);

create table app.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references app.organizations(id) on delete restrict,
  registered_first_names text not null check (length(trim(registered_first_names)) > 0),
  registry_last_name text not null check (length(trim(registry_last_name)) > 0),
  normalized_registry_last_name text not null check (length(trim(normalized_registry_last_name)) > 0),
  licence_document_number text not null check (length(trim(licence_document_number)) > 0),
  licence_type text not null,
  professional_title text not null,
  firm_work_email text not null,
  evidence_storage_path text,
  lookup_consent_at timestamptz not null,
  accuracy_consent_at timestamptz not null,
  status app.partner_application_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index partner_applications_user_id_idx on app.partner_applications(user_id);
create index partner_applications_organization_id_idx on app.partner_applications(organization_id);
create index partner_applications_lookup_idx
  on app.partner_applications(licence_document_number, normalized_registry_last_name);

create table app.regulatory_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references app.organizations(id) on delete restrict,
  licence_document_number text not null,
  registry_last_name text not null,
  licence_type text not null,
  professional_title text not null,
  status app.license_verification_status not null default 'pending',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, licence_document_number)
);

create index regulatory_credentials_user_id_idx on app.regulatory_credentials(user_id);

create table app.license_verification_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references app.partner_applications(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  queried_licence_number text not null,
  queried_registry_last_name text not null,
  source_url text not null default 'https://lsts.spl.com.tr/bilgi-sorgulama',
  result app.license_verification_status not null,
  returned_licence_types text[] not null default '{}',
  returned_status text,
  renewal_information text,
  employment_information text,
  reviewer_id uuid not null references auth.users(id),
  reviewer_notes text,
  evidence_storage_path text,
  verified_at timestamptz not null default now()
);

create index license_verification_events_user_id_idx on app.license_verification_events(user_id);
create index license_verification_events_application_id_idx on app.license_verification_events(application_id);

create table app.partner_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id uuid not null references app.organizations(id) on delete restrict,
  status app.partner_account_status not null default 'pending',
  tier app.partner_tier not null default 'associate',
  annual_cleared_capital numeric(16, 2) not null default 0 check (annual_cleared_capital >= 0),
  relationship_since date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index partner_accounts_organization_id_idx on app.partner_accounts(organization_id);

create table app.organization_offering_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  offering_id text not null,
  status app.firm_offering_status not null default 'proposed',
  effective_at date,
  paused_at date,
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, offering_id)
);

create index organization_offering_access_organization_id_idx
  on app.organization_offering_access(organization_id);

