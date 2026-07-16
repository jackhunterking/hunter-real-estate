create table app.referrals (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  firm_id uuid not null references app.organizations(id) on delete restrict,
  client_account_type text not null check (client_account_type in ('individual', 'entity')),
  client_first_name text not null,
  client_last_name text not null,
  client_display_name text not null,
  client_organization text,
  client_email text not null,
  client_phone text,
  country text not null,
  region text,
  city text,
  offering_id text,
  indicative_amount numeric(16, 2) check (indicative_amount is null or indicative_amount >= 0),
  status text not null default 'introduced'
    check (status in ('introduced', 'contacted', 'compliance-review', 'accepted', 'funded')),
  contact_consent_at timestamptz not null,
  accuracy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index referrals_owner_user_id_idx on app.referrals(owner_user_id);
create index referrals_firm_id_idx on app.referrals(firm_id);

create table app.referral_status_history (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references app.referrals(id) on delete cascade,
  status text not null,
  changed_by uuid not null references auth.users(id),
  note text,
  occurred_at timestamptz not null default now()
);

create index referral_status_history_referral_id_idx
  on app.referral_status_history(referral_id);

create table app.investment_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offering_id text not null,
  amount numeric(16, 2) not null check (amount > 0),
  status app.investment_application_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_applications_user_id_idx on app.investment_applications(user_id);

create table app.commission_entries (
  id uuid primary key default gen_random_uuid(),
  beneficiary_type app.commission_beneficiary_type not null,
  beneficiary_user_id uuid references auth.users(id) on delete restrict,
  beneficiary_organization_id uuid references app.organizations(id) on delete restrict,
  introducing_representative_id uuid not null references auth.users(id) on delete restrict,
  referral_id uuid references app.referrals(id) on delete set null,
  redacted_referral_reference text not null,
  offering_id text not null,
  gross_distribution_commission_amount numeric(16, 2) not null
    check (gross_distribution_commission_amount > 0),
  allocation_percentage numeric(5, 2) not null
    check (allocation_percentage in (30, 40, 50)),
  tier_at_funding app.partner_tier not null,
  amount numeric(16, 2) not null,
  currency char(3) not null default 'CAD',
  earning_period text not null,
  funded_at date not null,
  distribution_commission_received_at date not null,
  description text not null,
  status app.commission_status not null default 'draft',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    amount = round(gross_distribution_commission_amount * allocation_percentage / 100, 2)
  ),
  check (
    (tier_at_funding = 'associate' and allocation_percentage = 30)
    or (tier_at_funding = 'principal' and allocation_percentage = 40)
    or (tier_at_funding = 'managing_partner' and allocation_percentage = 50)
  ),
  check (funded_at <= distribution_commission_received_at),
  check (
    (beneficiary_type = 'representative' and beneficiary_user_id is not null and beneficiary_organization_id is null)
    or
    (beneficiary_type = 'organization' and beneficiary_organization_id is not null and beneficiary_user_id is null)
  )
);

create index commission_entries_beneficiary_user_id_idx
  on app.commission_entries(beneficiary_user_id);
create index commission_entries_beneficiary_org_id_idx
  on app.commission_entries(beneficiary_organization_id);

create table app.document_records (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references app.organizations(id) on delete cascade,
  partner_application_id uuid references app.partner_applications(id) on delete cascade,
  referral_id uuid references app.referrals(id) on delete cascade,
  bucket_id text not null,
  storage_path text not null unique,
  filename text not null,
  document_category text,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  access app.document_access not null,
  created_at timestamptz not null default now(),
  check (
    owner_user_id is not null
    or organization_id is not null
    or partner_application_id is not null
    or referral_id is not null
  )
);

create index document_records_owner_user_id_idx on app.document_records(owner_user_id);
create index document_records_organization_id_idx on app.document_records(organization_id);
create index document_records_referral_id_idx on app.document_records(referral_id);

create table app.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  summary text not null,
  before_state jsonb,
  after_state jsonb,
  request_id text,
  occurred_at timestamptz not null default now()
);

create index audit_events_actor_user_id_idx on app.audit_events(actor_user_id);
create index audit_events_entity_idx on app.audit_events(entity_type, entity_id);

