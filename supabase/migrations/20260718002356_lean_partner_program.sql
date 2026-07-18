create table app.fund_commission_schedules (
  id uuid primary key default gen_random_uuid(),
  offering_id text not null,
  gross_commission_bps numeric(8, 2) not null
    check (gross_commission_bps > 0 and gross_commission_bps <= 10000),
  status app.publication_status not null default 'draft'
    check (status in ('draft', 'published', 'superseded', 'withdrawn')),
  effective_from date not null,
  effective_to date,
  internal_note text,
  created_by uuid not null references auth.users(id) on delete restrict,
  published_by uuid references auth.users(id) on delete restrict,
  published_at timestamptz,
  superseded_by uuid references app.fund_commission_schedules(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from),
  check (internal_note is null or length(internal_note) <= 1000),
  check (
    (status = 'published' and published_by is not null and published_at is not null)
    or status <> 'published'
  )
);

create index fund_commission_schedules_offering_effective_idx
  on app.fund_commission_schedules(offering_id, effective_from desc);
create index fund_commission_schedules_current_idx
  on app.fund_commission_schedules(offering_id, effective_from desc, effective_to)
  where status = 'published';

alter table app.commission_entries
  add column fund_commission_schedule_id uuid
  references app.fund_commission_schedules(id) on delete set null;

create index commission_entries_schedule_id_idx
  on app.commission_entries(fund_commission_schedule_id)
  where fund_commission_schedule_id is not null;

create trigger fund_commission_schedules_set_updated_at
before update on app.fund_commission_schedules
for each row execute function private.set_updated_at();

create or replace function private.guard_published_fund_commission_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' and (
    new.offering_id is distinct from old.offering_id
    or new.gross_commission_bps is distinct from old.gross_commission_bps
    or new.effective_from is distinct from old.effective_from
    or new.internal_note is distinct from old.internal_note
    or new.created_by is distinct from old.created_by
  ) then
    raise exception 'Published fund commission schedules are immutable';
  end if;
  if old.status in ('superseded', 'withdrawn') then
    raise exception 'Closed fund commission schedules are immutable';
  end if;
  return new;
end;
$$;

create trigger fund_commission_schedules_guard_published
before update on app.fund_commission_schedules
for each row execute function private.guard_published_fund_commission_schedule();

create or replace function private.attach_fund_commission_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_offering_id text;
begin
  if new.fund_commission_schedule_id is not null then
    return new;
  end if;

  select offering.id::text
  into v_offering_id
  from app.offerings offering
  where offering.id::text = new.offering_id or offering.slug = new.offering_id
  limit 1;

  select schedule.id
  into new.fund_commission_schedule_id
  from app.fund_commission_schedules schedule
  where schedule.offering_id = coalesce(v_offering_id, new.offering_id)
    and schedule.status = 'published'
    and schedule.effective_from <= new.funded_at
    and (schedule.effective_to is null or schedule.effective_to >= new.funded_at)
  order by schedule.effective_from desc, schedule.published_at desc
  limit 1;

  return new;
end;
$$;

create trigger commission_entries_attach_fund_schedule
before insert on app.commission_entries
for each row execute function private.attach_fund_commission_schedule();

alter table app.fund_commission_schedules enable row level security;

create policy fund_commission_schedules_current_select
on app.fund_commission_schedules for select to authenticated
using (
  status = 'published'
  and effective_from <= current_date
  and (effective_to is null or effective_to >= current_date)
);

create policy fund_commission_schedules_finance_select
on app.fund_commission_schedules for select to authenticated
using (
  (select private.has_platform_role('finance_admin'::app.platform_role))
  or (select private.has_platform_role('platform_admin'::app.platform_role))
);

create or replace function app.create_fund_commission_schedule(
  p_offering_id text,
  p_gross_commission_bps numeric,
  p_effective_from date,
  p_internal_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := extensions.gen_random_uuid();
  v_offering_id text;
begin
  if not (
    private.has_platform_role('finance_admin'::app.platform_role)
    or private.has_platform_role('platform_admin'::app.platform_role)
  ) then
    raise exception 'Hunter North finance permission is required';
  end if;
  if p_gross_commission_bps is null
     or p_gross_commission_bps <= 0
     or p_gross_commission_bps > 10000
     or p_effective_from is null
     or length(coalesce(p_internal_note, '')) > 1000 then
    raise exception 'Invalid fund commission schedule';
  end if;

  select offering.id::text
  into v_offering_id
  from app.offerings offering
  where offering.id::text = trim(p_offering_id) or offering.slug = trim(p_offering_id)
  limit 1;
  if v_offering_id is null then
    raise exception 'Offering was not found';
  end if;

  insert into app.fund_commission_schedules(
    id, offering_id, gross_commission_bps, effective_from, internal_note, created_by
  ) values (
    v_id, v_offering_id, p_gross_commission_bps, p_effective_from,
    nullif(trim(p_internal_note), ''), auth.uid()
  );

  insert into app.audit_events(
    actor_user_id, action, entity_type, entity_id, summary, after_state
  ) values (
    auth.uid(), 'fund_commission_schedule.created', 'fund_commission_schedule',
    v_id::text, 'Fund commission schedule draft created.',
    pg_catalog.jsonb_build_object(
      'offering_id', v_offering_id,
      'gross_commission_bps', p_gross_commission_bps,
      'effective_from', p_effective_from
    )
  );
  return v_id;
end;
$$;

create or replace function app.publish_fund_commission_schedule(p_schedule_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_schedule app.fund_commission_schedules%rowtype;
  v_next_effective_from date;
begin
  if not (
    private.has_platform_role('finance_admin'::app.platform_role)
    or private.has_platform_role('platform_admin'::app.platform_role)
  ) then
    raise exception 'Hunter North finance permission is required';
  end if;

  select * into v_schedule
  from app.fund_commission_schedules
  where id = p_schedule_id
  for update;
  if v_schedule.id is null then
    raise exception 'Fund commission schedule was not found';
  end if;
  if v_schedule.status <> 'draft' then
    raise exception 'Only draft fund commission schedules may be published';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('fund-commission:' || v_schedule.offering_id, 0)
  );

  update app.fund_commission_schedules schedule
  set status = 'superseded', superseded_by = v_schedule.id
  where schedule.offering_id = v_schedule.offering_id
    and schedule.status = 'published'
    and schedule.effective_from = v_schedule.effective_from;

  update app.fund_commission_schedules schedule
  set effective_to = v_schedule.effective_from - 1
  where schedule.offering_id = v_schedule.offering_id
    and schedule.status = 'published'
    and schedule.effective_from < v_schedule.effective_from
    and (schedule.effective_to is null or schedule.effective_to >= v_schedule.effective_from);

  select min(schedule.effective_from)
  into v_next_effective_from
  from app.fund_commission_schedules schedule
  where schedule.offering_id = v_schedule.offering_id
    and schedule.status = 'published'
    and schedule.effective_from > v_schedule.effective_from;

  update app.fund_commission_schedules
  set status = 'published',
      effective_to = case
        when v_next_effective_from is null then null
        else v_next_effective_from - 1
      end,
      published_by = auth.uid(),
      published_at = now()
  where id = v_schedule.id;

  insert into app.audit_events(
    actor_user_id, action, entity_type, entity_id, summary, after_state
  ) values (
    auth.uid(), 'fund_commission_schedule.published', 'fund_commission_schedule',
    v_schedule.id::text, 'Fund commission schedule published.',
    pg_catalog.jsonb_build_object(
      'offering_id', v_schedule.offering_id,
      'gross_commission_bps', v_schedule.gross_commission_bps,
      'effective_from', v_schedule.effective_from,
      'effective_to', v_next_effective_from - 1
    )
  );
end;
$$;

create or replace function app.list_fund_commission_schedules_admin()
returns table (
  id uuid,
  offering_id text,
  gross_commission_bps numeric,
  status app.publication_status,
  effective_from date,
  effective_to date,
  internal_note text,
  created_by uuid,
  published_by uuid,
  published_at timestamptz,
  superseded_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (
    private.has_platform_role('finance_admin'::app.platform_role)
    or private.has_platform_role('platform_admin'::app.platform_role)
  ) then
    raise exception 'Hunter North finance permission is required';
  end if;
  return query
  select
    schedule.id, schedule.offering_id, schedule.gross_commission_bps,
    schedule.status, schedule.effective_from, schedule.effective_to,
    schedule.internal_note, schedule.created_by, schedule.published_by,
    schedule.published_at, schedule.superseded_by,
    schedule.created_at, schedule.updated_at
  from app.fund_commission_schedules schedule
  order by schedule.effective_from desc, schedule.created_at desc;
end;
$$;

create or replace view api.fund_commission_schedules
with (security_invoker = true) as
select
  id, offering_id, gross_commission_bps, status,
  effective_from, effective_to, published_at, created_at, updated_at
from app.fund_commission_schedules;

create or replace view api.commission_entries
with (security_invoker = true) as
select * from app.commission_entries;

create or replace function api.create_fund_commission_schedule(
  p_offering_id text,
  p_gross_commission_bps numeric,
  p_effective_from date,
  p_internal_note text default null
)
returns uuid
language sql
set search_path = ''
as $$
  select app.create_fund_commission_schedule(
    p_offering_id, p_gross_commission_bps, p_effective_from, p_internal_note
  );
$$;

create or replace function api.publish_fund_commission_schedule(p_schedule_id uuid)
returns void
language sql
set search_path = ''
as $$
  select app.publish_fund_commission_schedule(p_schedule_id);
$$;

create or replace function api.list_fund_commission_schedules_admin()
returns table (
  id uuid,
  offering_id text,
  gross_commission_bps numeric,
  status app.publication_status,
  effective_from date,
  effective_to date,
  internal_note text,
  created_by uuid,
  published_by uuid,
  published_at timestamptz,
  superseded_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
set search_path = ''
as $$
  select * from app.list_fund_commission_schedules_admin();
$$;

revoke execute on function private.guard_published_fund_commission_schedule() from public, anon, authenticated;
revoke execute on function private.attach_fund_commission_schedule() from public, anon, authenticated;
revoke execute on function app.create_fund_commission_schedule(text, numeric, date, text) from public, anon;
revoke execute on function app.publish_fund_commission_schedule(uuid) from public, anon;
revoke execute on function app.list_fund_commission_schedules_admin() from public, anon;
revoke execute on function api.create_fund_commission_schedule(text, numeric, date, text) from public, anon;
revoke execute on function api.publish_fund_commission_schedule(uuid) from public, anon;
revoke execute on function api.list_fund_commission_schedules_admin() from public, anon;

grant select on app.fund_commission_schedules to authenticated;
grant select(fund_commission_schedule_id) on app.commission_entries to authenticated;
grant select on api.fund_commission_schedules to authenticated;
grant select on api.commission_entries to authenticated;
grant execute on function app.create_fund_commission_schedule(text, numeric, date, text) to authenticated;
grant execute on function app.publish_fund_commission_schedule(uuid) to authenticated;
grant execute on function app.list_fund_commission_schedules_admin() to authenticated;
grant execute on function api.create_fund_commission_schedule(text, numeric, date, text) to authenticated;
grant execute on function api.publish_fund_commission_schedule(uuid) to authenticated;
grant execute on function api.list_fund_commission_schedules_admin() to authenticated;

grant all on app.fund_commission_schedules to service_role;

notify pgrst, 'reload schema';
