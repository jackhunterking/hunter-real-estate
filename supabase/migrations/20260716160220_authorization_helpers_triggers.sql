create or replace function private.has_mfa()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function private.has_platform_role(required_role app.platform_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and private.has_mfa()
    and exists (
      select 1
      from app.platform_role_assignments assignment
      where assignment.user_id = (select auth.uid())
        and assignment.role = required_role
    );
$$;

create or replace function private.is_hunter_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and private.has_mfa()
    and exists (
      select 1
      from app.platform_role_assignments assignment
      where assignment.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_org_role(
  target_organization_id uuid,
  required_roles app.firm_membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and private.has_mfa()
    and exists (
      select 1
      from app.organization_memberships membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.roles && required_roles
    );
$$;

create or replace function private.is_active_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app.organization_memberships membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
    );
$$;

create or replace function private.partner_is_active(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null
    and private.has_mfa()
    and (
      target_user_id = (select auth.uid())
      or private.is_hunter_admin()
    )
    and exists (
      select 1
      from app.profiles profile
      where profile.user_id = target_user_id
        and profile.account_status = 'active'
    )
    and exists (
      select 1
      from auth.users auth_user
      where auth_user.id = target_user_id
        and auth_user.email_confirmed_at is not null
    )
    and exists (
      select 1
      from app.partner_applications application
      where application.user_id = target_user_id
        and application.status = 'approved'
    )
    and (
      select event.result
      from app.license_verification_events event
      where event.user_id = target_user_id
      order by event.verified_at desc, event.id desc
      limit 1
    ) = 'verified'::app.license_verification_status
    and exists (
      select 1
      from app.firm_affiliations affiliation
      join app.organizations organization
        on organization.id = affiliation.organization_id
      where affiliation.user_id = target_user_id
        and affiliation.is_primary
        and affiliation.status in ('approved_by_firm', 'approved_by_hnc_fallback')
        and organization.status = 'active'
    )
    and exists (
      select 1
      from app.partner_accounts account
      where account.user_id = target_user_id
        and account.status = 'active'
    );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.profiles (
    user_id,
    first_name,
    last_name,
    display_name,
    email,
    locale
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    trim(
      concat(
        coalesce(new.raw_user_meta_data ->> 'first_name', ''),
        ' ',
        coalesce(new.raw_user_meta_data ->> 'last_name', '')
      )
    ),
    coalesce(new.email, ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'tr' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function private.guard_membership_role_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.organization_id is distinct from old.organization_id then
    raise exception 'Membership ownership cannot be reassigned';
  end if;

  if new.roles is distinct from old.roles
     and not private.has_platform_role('platform_admin'::app.platform_role) then
    raise exception 'Only Hunter North platform administrators may change firm roles';
  end if;

  if not private.is_hunter_admin()
     and (
       new.work_email is distinct from old.work_email
       or new.registered_name is distinct from old.registered_name
       or new.licence_type is distinct from old.licence_type
       or new.masked_licence_number is distinct from old.masked_licence_number
       or new.verification_status is distinct from old.verification_status
       or new.requested_at is distinct from old.requested_at
     ) then
    raise exception 'Firm administrators may only decide membership status';
  end if;
  return new;
end;
$$;

create or replace function private.guard_profile_security_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.email is distinct from old.email then
    raise exception 'Profile identity fields cannot be changed here';
  end if;
  if new.account_status is distinct from old.account_status
     and not private.has_platform_role('platform_admin'::app.platform_role) then
    raise exception 'Only Hunter North may change account status';
  end if;
  return new;
end;
$$;

create or replace function private.guard_affiliation_decision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.organization_id is distinct from old.organization_id
     or new.is_primary is distinct from old.is_primary then
    raise exception 'Firm affiliation ownership cannot be changed';
  end if;

  if new.status = 'approved_by_hnc_fallback'
     and not private.is_hunter_admin() then
    raise exception 'Only Hunter North may record fallback approval';
  end if;

  if new.status = 'approved_by_hnc_fallback'
     and length(trim(coalesce(new.approval_reason, ''))) = 0 then
    raise exception 'Fallback approval requires a written reason';
  end if;

  if new.status in ('approved_by_firm', 'approved_by_hnc_fallback') then
    new.approved_by = auth.uid();
    new.approved_at = coalesce(new.approved_at, now());
  end if;
  return new;
end;
$$;

create or replace function private.prevent_append_only_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Append-only records cannot be updated or deleted';
end;
$$;

create trigger profiles_set_updated_at
before update on app.profiles
for each row execute function private.set_updated_at();

create trigger profiles_guard_security_fields
before update on app.profiles
for each row execute function private.guard_profile_security_fields();

create trigger organizations_set_updated_at
before update on app.organizations
for each row execute function private.set_updated_at();

create trigger partner_applications_set_updated_at
before update on app.partner_applications
for each row execute function private.set_updated_at();

create trigger regulatory_credentials_set_updated_at
before update on app.regulatory_credentials
for each row execute function private.set_updated_at();

create trigger partner_accounts_set_updated_at
before update on app.partner_accounts
for each row execute function private.set_updated_at();

create trigger organization_offering_access_set_updated_at
before update on app.organization_offering_access
for each row execute function private.set_updated_at();

create trigger referrals_set_updated_at
before update on app.referrals
for each row execute function private.set_updated_at();

create trigger investment_applications_set_updated_at
before update on app.investment_applications
for each row execute function private.set_updated_at();

create trigger commission_entries_set_updated_at
before update on app.commission_entries
for each row execute function private.set_updated_at();

create trigger organization_memberships_guard_roles
before update on app.organization_memberships
for each row execute function private.guard_membership_role_changes();

create trigger firm_affiliations_guard_decision
before update on app.firm_affiliations
for each row execute function private.guard_affiliation_decision();

create trigger license_verification_events_append_only
before update or delete on app.license_verification_events
for each row execute function private.prevent_append_only_change();

create trigger audit_events_append_only
before update or delete on app.audit_events
for each row execute function private.prevent_append_only_change();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on function private.has_platform_role(app.platform_role) to authenticated;
grant execute on function private.is_hunter_admin() to authenticated;
grant execute on function private.has_org_role(uuid, app.firm_membership_role[]) to authenticated;
grant execute on function private.is_active_org_member(uuid) to authenticated;
grant execute on function private.partner_is_active(uuid) to authenticated;
grant execute on function private.has_mfa() to authenticated;

alter table app.profiles enable row level security;
alter table app.platform_role_assignments enable row level security;
alter table app.organizations enable row level security;
alter table app.organization_private_details enable row level security;
alter table app.organization_memberships enable row level security;
alter table app.firm_affiliations enable row level security;
alter table app.partner_applications enable row level security;
alter table app.regulatory_credentials enable row level security;
alter table app.license_verification_events enable row level security;
alter table app.partner_accounts enable row level security;
alter table app.organization_offering_access enable row level security;
alter table app.referrals enable row level security;
alter table app.referral_status_history enable row level security;
alter table app.investment_applications enable row level security;
alter table app.commission_entries enable row level security;
alter table app.document_records enable row level security;
alter table app.audit_events enable row level security;

