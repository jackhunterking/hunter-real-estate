-- Admin console: the read views and write RPCs behind the consolidated
-- /hunter-advisory/admin page.
--
-- Motivation: several things a master admin must control had no screen at all,
-- because they had no API to build one on. Granting `master_admin` was a SQL-only
-- operation; `app.taxonomies` — which drives investment tagging, filtering and
-- the map — was editable only by writing a migration. This closes those gaps and
-- adds read-only windows onto the remaining operational tables.
--
-- Two view patterns are used, and the difference matters:
--   * Views over `app.*` use `security_invoker = true` and are gated by
--     `where private.is_hunter_admin()`. RLS on the base table still applies.
--   * Views over `private.*` (email delivery) CANNOT use security_invoker —
--     `authenticated` has no rights in that schema at all. They run as the view
--     owner and the admin gate in the WHERE clause is therefore the ONLY thing
--     standing between a signed-in user and the data. Treat that predicate as
--     load-bearing; it is verified by the grants smoke test.
--
-- All statements are idempotent (MCP apply + later `supabase db push` both run).

-- 1. Users & roles ------------------------------------------------------------
-- The platform had no user directory of any kind. This is the sensitive view in
-- this migration: it exposes email addresses and account state.
--
-- It joins `auth.users` for verification and last-sign-in, which `authenticated`
-- cannot read, so this view CANNOT be security_invoker either — the admin
-- predicate in the WHERE clause is the only gate. Same rule as the email view
-- below: do not remove it, and it is covered by the grants smoke test.
drop view if exists api.admin_users;
create view api.admin_users as
select
  p.user_id,
  p.display_name,
  p.first_name,
  p.last_name,
  p.email,
  p.locale,
  p.account_status,
  p.account_intent,
  p.onboarding_status,
  p.investor_account_type,
  p.investor_qualification_category,
  p.created_at,
  (u.email_confirmed_at is not null) as email_verified,
  u.last_sign_in_at,
  coalesce(
    (select array_agg(r.role::text order by r.role::text)
       from app.platform_role_assignments r where r.user_id = p.user_id),
    '{}'::text[]
  ) as platform_roles,
  s.partner_application_status::text as partner_application_status,
  s.license_verification_status::text as license_verification_status,
  s.firm_affiliation_status::text as firm_affiliation_status,
  s.partner_account_status::text as partner_account_status,
  coalesce(s.partner_is_active, false) as partner_is_active
from app.profiles p
join auth.users u on u.id = p.user_id
left join app.partner_access_status s on s.user_id = p.user_id
where (select private.is_hunter_admin());

revoke all on api.admin_users from public, anon;
grant select on api.admin_users to authenticated;

-- 2. Role guard ---------------------------------------------------------------
-- Two ways to lock everyone out of the platform, both now refused server-side
-- rather than only in the UI: removing the last remaining admin, and an admin
-- revoking their own role. The service role keeps its escape hatch so a genuine
-- lockout can still be repaired.
create or replace function private.set_platform_role(
  p_user_id uuid,
  p_role app.platform_role,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_is_service_role boolean := coalesce(auth.role(), '') = 'service_role';
  v_remaining integer;
begin
  if not v_is_service_role and not private.is_hunter_admin() then
    raise exception 'Hunter North platform administrator permission is required';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'The target user does not exist';
  end if;

  if not p_enabled and not v_is_service_role then
    if p_user_id = v_actor_user_id then
      raise exception 'You cannot remove your own platform administrator role';
    end if;
    select count(*) into v_remaining
      from app.platform_role_assignments
     where role = p_role and user_id <> p_user_id;
    if v_remaining = 0 then
      raise exception 'At least one platform administrator must remain';
    end if;
  end if;

  if p_enabled then
    insert into app.platform_role_assignments(user_id, role, assigned_by)
    values (p_user_id, p_role, v_actor_user_id)
    on conflict (user_id, role) do update
      set assigned_by = excluded.assigned_by, assigned_at = now();
  else
    delete from app.platform_role_assignments where user_id = p_user_id and role = p_role;
  end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, summary, metadata)
  values (
    v_actor_user_id,
    case when p_enabled then 'platform_role.granted' else 'platform_role.revoked' end,
    'profile', p_user_id,
    case when p_enabled then 'Platform role granted.' else 'Platform role revoked.' end,
    jsonb_build_object('role', p_role, 'enabled', p_enabled)
  );
end;
$$;

-- 3. Taxonomies ---------------------------------------------------------------
-- `usage_count` is what makes retirement safe to offer in the UI: a key that a
-- published content_snapshot still cites must keep resolving.
create or replace view api.admin_taxonomies with (security_invoker = true) as
select
  t.id,
  t.kind,
  t.key,
  t.label,
  t.color,
  t.sort_order,
  t.updated_at,
  (select count(*) from app.offering_taxonomies ot where ot.kind = t.kind and ot.key = t.key) as usage_count
from app.taxonomies t
where (select private.is_hunter_admin());

revoke all on api.admin_taxonomies from public, anon;
grant select on api.admin_taxonomies to authenticated;

create or replace function api.upsert_taxonomy(
  p_kind text,
  p_key text,
  p_label jsonb,
  p_color text default null,
  p_sort_order integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not (private.is_hunter_admin() or (select auth.jwt() ->> 'role') = 'service_role') then
    raise exception 'Content administration is required';
  end if;
  if coalesce(p_key, '') = '' or coalesce(p_kind, '') = '' then
    raise exception 'A taxonomy needs a kind and a key';
  end if;
  if coalesce(p_label ->> 'en', '') = '' or coalesce(p_label ->> 'tr', '') = '' then
    raise exception 'A taxonomy label must be provided in both English and Turkish';
  end if;

  insert into app.taxonomies (kind, key, label, color, sort_order)
  values (p_kind, p_key, p_label, p_color, coalesce(p_sort_order, 0))
  on conflict (kind, key) do update set
    label = excluded.label,
    color = excluded.color,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function api.retire_taxonomy(p_kind text, p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uses integer;
begin
  if not (private.is_hunter_admin() or (select auth.jwt() ->> 'role') = 'service_role') then
    raise exception 'Content administration is required';
  end if;
  select count(*) into v_uses
    from app.offering_taxonomies ot where ot.kind = p_kind and ot.key = p_key;
  if v_uses > 0 then
    raise exception 'This tag is used by % investment(s) and cannot be retired', v_uses;
  end if;
  delete from app.taxonomies where kind = p_kind and key = p_key;
end;
$$;

revoke all on function api.upsert_taxonomy(text, text, jsonb, text, integer) from public, anon;
grant execute on function api.upsert_taxonomy(text, text, jsonb, text, integer) to authenticated, service_role;
revoke all on function api.retire_taxonomy(text, text) from public, anon;
grant execute on function api.retire_taxonomy(text, text) to authenticated, service_role;

-- 4. Read-only operational windows --------------------------------------------
create or replace view api.admin_investment_interests with (security_invoker = true) as
select
  i.id, i.user_id, i.offering_id, i.message, i.preferred_channel,
  i.contact_consent_at, i.status::text as status, i.reviewer_notes,
  i.created_at, i.updated_at,
  p.display_name, p.email
from app.investment_interest_requests i
left join app.profiles p on p.user_id = i.user_id
where (select private.is_hunter_admin());

revoke all on api.admin_investment_interests from public, anon;
grant select on api.admin_investment_interests to authenticated;

create or replace view api.admin_firm_memberships with (security_invoker = true) as
select
  m.id, m.organization_id, m.user_id, m.roles, m.status::text as status,
  m.work_email, m.registered_name, m.licence_type, m.masked_licence_number,
  m.verification_status::text as verification_status,
  m.requested_at, m.approved_at, m.ended_at,
  o.legal_name as organization_name,
  p.display_name
from app.organization_memberships m
left join app.organizations o on o.id = m.organization_id
left join app.profiles p on p.user_id = m.user_id
where (select private.is_hunter_admin());

revoke all on api.admin_firm_memberships from public, anon;
grant select on api.admin_firm_memberships to authenticated;

create or replace view api.admin_legal_documents with (security_invoker = true) as
select
  l.id, l.document_key, l.language, l.version, l.status::text as status,
  l.effective_at, l.published_at, l.withdrawal_at, l.created_at
from app.legal_document_versions l
where (select private.is_hunter_admin());

revoke all on api.admin_legal_documents from public, anon;
grant select on api.admin_legal_documents to authenticated;

-- Email delivery lives in `private`, where `authenticated` holds no rights, so
-- this view CANNOT be security_invoker. It runs as its owner and the admin
-- predicate below is the only gate — do not remove it. The message body is
-- deliberately not exposed; only routing and delivery state.
drop view if exists api.admin_email_delivery;
create view api.admin_email_delivery as
select
  j.id,
  j.category,
  j.related_entity_type,
  j.related_entity_id,
  j.recipient,
  j.template_key,
  j.status,
  j.attempt_count,
  j.last_error_code,
  j.created_at,
  j.sent_at,
  j.delivered_at,
  j.failed_at,
  j.last_event_at,
  (select s.reason from private.email_suppressions s
    where s.email = j.recipient and s.cleared_at is null limit 1) as suppression_reason
from private.email_jobs j
where (select private.is_hunter_admin());

revoke all on api.admin_email_delivery from public, anon;
grant select on api.admin_email_delivery to authenticated;

notify pgrst, 'reload schema';
