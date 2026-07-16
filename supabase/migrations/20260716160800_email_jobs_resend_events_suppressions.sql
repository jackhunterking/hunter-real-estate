create type app.email_job_status as enum (
  'queued', 'sending', 'sent', 'delivered', 'delayed', 'failed',
  'bounced', 'complained', 'suppressed', 'cancelled'
);

create table private.email_jobs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  related_entity_type text not null,
  related_entity_id uuid not null,
  recipient extensions.citext not null,
  template_key text not null,
  template_version text not null,
  variables jsonb not null default '{}'::jsonb,
  status app.email_job_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_retry_at timestamptz not null default now(),
  resend_email_id text unique,
  idempotency_key text not null unique,
  last_error_code text,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  completed_at timestamptz
);

create table private.resend_events (
  event_id text primary key,
  resend_email_id text not null,
  event_type text not null,
  event_at timestamptz not null,
  event_data jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create table private.email_suppressions (
  email extensions.citext primary key,
  reason text not null,
  source_event_id text references private.resend_events(event_id) on delete restrict,
  suppressed_at timestamptz not null,
  cleared_at timestamptz
);

create table private.notification_preferences (
  category text primary key,
  recipient extensions.citext not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into private.notification_preferences(category, recipient)
values
  ('capital_intake', 'hello@jackhunter.com'),
  ('investor_readiness', 'hello@jackhunter.com')
on conflict (category) do nothing;

create index email_jobs_retry_idx on private.email_jobs(next_retry_at, created_at)
where status in ('queued', 'delayed');
create index resend_events_email_idx on private.resend_events(resend_email_id, event_at desc);

create trigger resend_events_append_only
before update or delete on private.resend_events
for each row execute function private.prevent_append_only_change();

create or replace function private.enqueue_email(
  p_category text,
  p_related_entity_type text,
  p_related_entity_id uuid,
  p_recipient text,
  p_template_key text,
  p_template_version text,
  p_variables jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if exists (
    select 1 from private.email_suppressions suppression
    where suppression.email = lower(trim(p_recipient))::extensions.citext
      and suppression.cleared_at is null
  ) then
    insert into private.email_jobs (
      id, category, related_entity_type, related_entity_id, recipient,
      template_key, template_version, variables, status, idempotency_key,
      completed_at
    ) values (
      v_id, p_category, p_related_entity_type, p_related_entity_id,
      lower(trim(p_recipient))::extensions.citext, p_template_key,
      p_template_version, p_variables, 'suppressed',
      p_category || '/' || v_id::text, now()
    );
  else
    insert into private.email_jobs (
      id, category, related_entity_type, related_entity_id, recipient,
      template_key, template_version, variables, idempotency_key
    ) values (
      v_id, p_category, p_related_entity_type, p_related_entity_id,
      lower(trim(p_recipient))::extensions.citext, p_template_key,
      p_template_version, p_variables, p_category || '/' || v_id::text
    );
  end if;
  return v_id;
end;
$$;

revoke all on all tables in schema private from anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant all on private.email_jobs, private.resend_events, private.email_suppressions,
  private.notification_preferences to service_role;
grant execute on function private.enqueue_email(text, text, uuid, text, text, text, jsonb) to service_role;
