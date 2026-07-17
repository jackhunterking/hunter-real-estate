create type app.account_intent as enum (
  'investor',
  'turkiye_licensed_professional_or_firm'
);

create type app.investor_account_type as enum ('individual', 'entity');
create type app.onboarding_status as enum ('pending', 'completed');
create type app.investment_interest_status as enum (
  'new',
  'contacted',
  'qualified',
  'closed'
);
create type app.contact_channel as enum ('email', 'phone', 'whatsapp');

alter table app.profiles
  add column account_intent app.account_intent,
  add column investor_account_type app.investor_account_type,
  add column onboarding_status app.onboarding_status not null default 'pending',
  add column residence_jurisdiction text,
  add column investment_objective text,
  add column time_horizon text,
  add column risk_acknowledged_at timestamptz,
  add column contact_consent_at timestamptz;

create or replace function private.enforce_offering_version_progression()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status <> 'draft' then
    raise exception 'New offering versions must begin as draft';
  end if;
  if tg_op = 'UPDATE' and new.status <> old.status and not (
    (old.status = 'draft' and new.status in ('in_review', 'withdrawn'))
    or (old.status = 'in_review' and new.status in ('draft', 'approved', 'withdrawn'))
    or (old.status = 'approved' and new.status in ('in_review', 'published', 'withdrawn'))
    or (old.status = 'published' and new.status in ('superseded', 'withdrawn'))
  ) then
    raise exception 'Invalid offering publication transition: % to %', old.status, new.status;
  end if;
  if new.status in ('approved', 'published') and (
    new.author_id is null or new.reviewer_id is null or new.compliance_owner_id is null
  ) then
    raise exception 'Approved offering versions require author, reviewer, and compliance owner';
  end if;
  if new.status = 'published' and (
    new.effective_at is null or new.published_at is null
  ) then
    raise exception 'Published offering versions require effective and published dates';
  end if;
  return new;
end;
$$;

create trigger offering_content_versions_enforce_progression
before insert or update of status on app.offering_content_versions
for each row execute function private.enforce_offering_version_progression();

create table app.investment_interest_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offering_id uuid not null references app.offerings(id) on delete restrict,
  message text check (message is null or length(message) <= 2000),
  preferred_channel app.contact_channel not null,
  contact_consent_at timestamptz not null,
  status app.investment_interest_status not null default 'new',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewer_notes text check (reviewer_notes is null or length(reviewer_notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_interest_requests_user_id_idx
  on app.investment_interest_requests(user_id, created_at desc);
create index investment_interest_requests_status_idx
  on app.investment_interest_requests(status, created_at desc);
create unique index one_open_interest_per_user_offering
  on app.investment_interest_requests(user_id, offering_id)
  where status in ('new', 'contacted', 'qualified');

create trigger investment_interest_requests_set_updated_at
before update on app.investment_interest_requests
for each row execute function private.set_updated_at();

alter table app.investment_interest_requests enable row level security;

create policy investment_interest_requests_owner_select
on app.investment_interest_requests for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_hunter_admin())
);

create policy investment_interest_requests_owner_insert
on app.investment_interest_requests for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'new'
  and reviewed_by is null
  and reviewer_notes is null
);

create policy investment_interest_requests_hunter_update
on app.investment_interest_requests for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy investment_interest_requests_hunter_delete
on app.investment_interest_requests for delete to authenticated
using ((select private.is_hunter_admin()));

grant select, insert on app.investment_interest_requests to authenticated;
grant update, delete on app.investment_interest_requests to authenticated;

create or replace view api.profiles with (security_invoker = true) as
select * from app.profiles;

create view api.investment_interest_requests with (security_invoker = true) as
select
  id, user_id, offering_id, message, preferred_channel, contact_consent_at,
  status, created_at, updated_at
from app.investment_interest_requests;

create or replace function app.complete_hnc_onboarding(
  p_account_intent app.account_intent,
  p_investor_account_type app.investor_account_type,
  p_residence_jurisdiction text,
  p_investment_objective text,
  p_time_horizon text,
  p_risk_acknowledged boolean,
  p_contact_consent boolean
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if p_account_intent = 'investor' and p_investor_account_type is null then
    raise exception 'Investor account type is required';
  end if;
  if length(trim(coalesce(p_residence_jurisdiction, ''))) < 2
     or length(trim(coalesce(p_investment_objective, ''))) < 2
     or length(trim(coalesce(p_time_horizon, ''))) < 2
     or not p_risk_acknowledged
     or not p_contact_consent then
    raise exception 'Required onboarding fields are missing';
  end if;

  update app.profiles
  set account_intent = p_account_intent,
      investor_account_type = case
        when p_account_intent = 'investor' then p_investor_account_type
        else null
      end,
      onboarding_status = 'completed',
      residence_jurisdiction = trim(p_residence_jurisdiction),
      investment_objective = trim(p_investment_objective),
      time_horizon = trim(p_time_horizon),
      risk_acknowledged_at = now(),
      contact_consent_at = now()
  where user_id = auth.uid();

  if not found then
    raise exception 'Profile was not found';
  end if;
end;
$$;

create or replace function app.create_investment_interest(
  p_offering_id uuid,
  p_message text,
  p_preferred_channel app.contact_channel,
  p_contact_consent boolean
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or not p_contact_consent then
    raise exception 'Authentication and contact consent are required';
  end if;
  if not exists (
    select 1 from app.offerings offering
    join app.offering_content_versions version
      on version.id = offering.current_version_id
    where offering.id = p_offering_id
      and offering.status = 'published'
      and version.status = 'published'
      and version.effective_at <= now()
      and (version.withdrawal_at is null or version.withdrawal_at > now())
      and (offering.withdrawal_at is null or offering.withdrawal_at > now())
  ) then
    raise exception 'Published offering was not found';
  end if;

  insert into app.investment_interest_requests(
    user_id, offering_id, message, preferred_channel, contact_consent_at
  ) values (
    auth.uid(), p_offering_id, nullif(trim(p_message), ''),
    p_preferred_channel, now()
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function app.set_investment_interest_status(
  p_interest_id uuid,
  p_status app.investment_interest_status,
  p_reviewer_notes text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_hunter_admin() then
    raise exception 'Hunter North administrator permission is required';
  end if;
  update app.investment_interest_requests
  set status = p_status,
      reviewer_notes = nullif(trim(p_reviewer_notes), ''),
      reviewed_by = auth.uid()
  where id = p_interest_id;
  if not found then raise exception 'Interest request was not found'; end if;
end;
$$;

create or replace function app.list_investment_interest_admin()
returns table (
  id uuid,
  user_id uuid,
  offering_id uuid,
  message text,
  preferred_channel app.contact_channel,
  status app.investment_interest_status,
  reviewer_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_hunter_admin() then
    raise exception 'Hunter North administrator permission is required';
  end if;
  return query
  select
    interest.id, interest.user_id, interest.offering_id, interest.message,
    interest.preferred_channel, interest.status, interest.reviewer_notes,
    interest.created_at, interest.updated_at
  from app.investment_interest_requests interest
  order by interest.created_at desc;
end;
$$;

create or replace function api.complete_hnc_onboarding(
  p_account_intent app.account_intent,
  p_investor_account_type app.investor_account_type,
  p_residence_jurisdiction text,
  p_investment_objective text,
  p_time_horizon text,
  p_risk_acknowledged boolean,
  p_contact_consent boolean
)
returns void language sql set search_path = '' as $$
  select app.complete_hnc_onboarding(
    p_account_intent, p_investor_account_type, p_residence_jurisdiction,
    p_investment_objective, p_time_horizon, p_risk_acknowledged,
    p_contact_consent
  );
$$;

create or replace function api.create_investment_interest(
  p_offering_id uuid,
  p_message text,
  p_preferred_channel app.contact_channel,
  p_contact_consent boolean
)
returns uuid language sql set search_path = '' as $$
  select app.create_investment_interest(
    p_offering_id, p_message, p_preferred_channel, p_contact_consent
  );
$$;

create or replace function api.set_investment_interest_status(
  p_interest_id uuid,
  p_status app.investment_interest_status,
  p_reviewer_notes text
)
returns void language sql set search_path = '' as $$
  select app.set_investment_interest_status(
    p_interest_id, p_status, p_reviewer_notes
  );
$$;

create or replace function api.list_investment_interest_admin()
returns table (
  id uuid,
  user_id uuid,
  offering_id uuid,
  message text,
  preferred_channel app.contact_channel,
  status app.investment_interest_status,
  reviewer_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
set search_path = ''
as $$
  select * from app.list_investment_interest_admin();
$$;

revoke execute on function app.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) from public, anon;
revoke execute on function app.create_investment_interest(
  uuid, text, app.contact_channel, boolean
) from public, anon;
revoke execute on function app.set_investment_interest_status(
  uuid, app.investment_interest_status, text
) from public, anon;
revoke execute on function app.list_investment_interest_admin() from public, anon;
revoke execute on function api.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) from public, anon;
revoke execute on function api.create_investment_interest(
  uuid, text, app.contact_channel, boolean
) from public, anon;
revoke execute on function api.set_investment_interest_status(
  uuid, app.investment_interest_status, text
) from public, anon;
revoke execute on function api.list_investment_interest_admin() from public, anon;

grant execute on function api.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) to authenticated;
grant execute on function app.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) to authenticated;
grant execute on function app.create_investment_interest(
  uuid, text, app.contact_channel, boolean
) to authenticated;
grant execute on function app.set_investment_interest_status(
  uuid, app.investment_interest_status, text
) to authenticated;
grant execute on function app.list_investment_interest_admin() to authenticated;
grant execute on function api.create_investment_interest(
  uuid, text, app.contact_channel, boolean
) to authenticated;
grant execute on function api.set_investment_interest_status(
  uuid, app.investment_interest_status, text
) to authenticated;
grant execute on function api.list_investment_interest_admin() to authenticated;

grant select on api.profiles to authenticated;
grant select on api.investment_interest_requests to authenticated;

notify pgrst, 'reload schema';
