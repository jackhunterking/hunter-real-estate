create type app.lead_submission_type as enum ('guide', 'capital_intake', 'investor_readiness');
create type app.lead_status as enum ('new', 'reviewing', 'contacted', 'qualified', 'converted', 'closed', 'spam');
create type app.email_deliverability_status as enum ('unknown', 'deliverable', 'bounced', 'complained', 'suppressed');

create table app.contacts (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null,
  first_name text,
  last_name text,
  phone text,
  preferred_language text check (preferred_language is null or preferred_language in ('tr', 'en', 'both')),
  country text,
  city text,
  email_deliverability app.email_deliverability_status not null default 'unknown',
  retention_until timestamptz,
  legal_hold boolean not null default false,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);

create table app.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references app.contacts(id) on delete restrict,
  submission_type app.lead_submission_type not null,
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  consent_snapshot jsonb not null default '{}'::jsonb,
  status app.lead_status not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  follow_up_at timestamptz,
  converted_client_id uuid,
  retention_until timestamptz,
  legal_hold boolean not null default false,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_submission_id uuid not null references app.lead_submissions(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  note text not null check (length(trim(note)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.lead_activity_events (
  id uuid primary key default gen_random_uuid(),
  lead_submission_id uuid not null references app.lead_submissions(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index contacts_deliverability_idx on app.contacts(email_deliverability) where deleted_at is null;
create index lead_submissions_inbox_idx on app.lead_submissions(status, follow_up_at, submitted_at desc) where deleted_at is null;
create index lead_submissions_contact_idx on app.lead_submissions(contact_id, submitted_at desc);
create index lead_submissions_assignee_idx on app.lead_submissions(assigned_to, status) where deleted_at is null;
create index lead_notes_submission_idx on app.lead_notes(lead_submission_id, created_at desc);
create index lead_activity_submission_idx on app.lead_activity_events(lead_submission_id, occurred_at desc);

create trigger contacts_set_updated_at before update on app.contacts
for each row execute function private.set_updated_at();
create trigger lead_submissions_set_updated_at before update on app.lead_submissions
for each row execute function private.set_updated_at();
create trigger lead_notes_set_updated_at before update on app.lead_notes
for each row execute function private.set_updated_at();

alter table app.contacts enable row level security;
alter table app.lead_submissions enable row level security;
alter table app.lead_notes enable row level security;
alter table app.lead_activity_events enable row level security;

create policy contacts_hunter_admin on app.contacts for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy leads_hunter_admin on app.lead_submissions for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy lead_notes_hunter_admin on app.lead_notes for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy lead_activity_hunter_admin on app.lead_activity_events for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));

grant select, insert, update on app.contacts, app.lead_submissions, app.lead_notes, app.lead_activity_events to authenticated;
grant usage, select on all sequences in schema app to authenticated;
