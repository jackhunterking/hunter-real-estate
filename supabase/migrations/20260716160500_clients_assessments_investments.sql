create table app.clients (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid unique references app.contacts(id) on delete set null,
  user_id uuid unique references auth.users(id) on delete set null,
  nationality text,
  jurisdiction text,
  preferred_language text check (preferred_language is null or preferred_language in ('tr', 'en', 'both')),
  status text not null default 'prospect',
  retention_until timestamptz,
  legal_hold boolean not null default false,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app.lead_submissions
  add constraint lead_submissions_converted_client_fk
  foreign key (converted_client_id) references app.clients(id) on delete set null;

create table app.client_fund_interests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references app.clients(id) on delete cascade,
  offering_id uuid not null references app.offerings(id) on delete restrict,
  share_class_id uuid references app.share_classes(id) on delete set null,
  share_quantity numeric(18, 6) check (share_quantity is null or share_quantity > 0),
  intended_amount numeric(16, 2) check (intended_amount is null or intended_amount > 0),
  account_preference text,
  created_at timestamptz not null default now()
);

create table app.client_suitability_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references app.clients(id) on delete cascade,
  version integer not null,
  answers jsonb not null,
  acknowledgement_snapshot jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (client_id, version)
);

create table app.investor_readiness_assessments (
  id uuid primary key default gen_random_uuid(),
  lead_submission_id uuid references app.lead_submissions(id) on delete restrict,
  client_id uuid references app.clients(id) on delete set null,
  offering_id text not null,
  offering_version_id text not null,
  jurisdiction text not null,
  ruleset_id text not null,
  ruleset_version text not null,
  input_snapshot jsonb not null,
  preliminary_category text not null,
  qualifying_criteria jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  review_reasons jsonb not null default '[]'::jsonb,
  acknowledgement_snapshot jsonb not null,
  calculated_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table app.client_status_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references app.clients(id) on delete cascade,
  status text not null,
  changed_by uuid references auth.users(id),
  note text,
  occurred_at timestamptz not null default now()
);

create table app.client_activity_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references app.clients(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table app.investment_applications
  add column client_id uuid references app.clients(id) on delete restrict,
  add column share_class_id uuid references app.share_classes(id) on delete set null,
  add column share_quantity numeric(18, 6),
  add column account_preference text,
  add column consent_snapshot jsonb not null default '{}'::jsonb;

create index clients_user_idx on app.clients(user_id) where deleted_at is null;
create index client_interests_client_idx on app.client_fund_interests(client_id, created_at desc);
create index readiness_submission_idx on app.investor_readiness_assessments(lead_submission_id);
create index readiness_client_idx on app.investor_readiness_assessments(client_id, created_at desc);
create index client_status_history_idx on app.client_status_history(client_id, occurred_at desc);

alter table app.clients enable row level security;
alter table app.client_fund_interests enable row level security;
alter table app.client_suitability_profiles enable row level security;
alter table app.investor_readiness_assessments enable row level security;
alter table app.client_status_history enable row level security;
alter table app.client_activity_events enable row level security;

create policy clients_own_or_hunter on app.clients for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_hunter_admin()));
create policy client_interests_own_or_hunter on app.client_fund_interests for select to authenticated
using (exists (select 1 from app.clients c where c.id = client_id and (c.user_id = (select auth.uid()) or (select private.is_hunter_admin()))));
create policy suitability_own_or_hunter on app.client_suitability_profiles for select to authenticated
using (exists (select 1 from app.clients c where c.id = client_id and (c.user_id = (select auth.uid()) or (select private.is_hunter_admin()))));
create policy readiness_own_or_hunter on app.investor_readiness_assessments for select to authenticated
using (exists (select 1 from app.clients c where c.id = client_id and (c.user_id = (select auth.uid()) or (select private.is_hunter_admin()))));
create policy client_status_hunter on app.client_status_history for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy client_activity_hunter on app.client_activity_events for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));

grant select on app.clients, app.client_fund_interests, app.client_suitability_profiles,
  app.investor_readiness_assessments, app.client_status_history, app.client_activity_events to authenticated;
grant insert, update on app.clients, app.client_fund_interests, app.client_suitability_profiles,
  app.investor_readiness_assessments, app.client_status_history, app.client_activity_events to authenticated;
