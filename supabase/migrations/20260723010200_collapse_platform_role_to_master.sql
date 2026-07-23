-- Collapse app.platform_role to a single 'master_admin' role.
--
-- Every prior platform-role check (platform_admin / compliance_admin /
-- finance_admin) is rewritten to private.is_hunter_admin() — "holds any
-- app.platform_role_assignments row + MFA" — which is semantically identical
-- once master_admin is the only platform role. Rewrites are done dynamically
-- from each object's own catalog definition (regexp on has_platform_role calls)
-- so they are faithful, not hand-retyped.
--
-- NOTE: app.firm_membership_role ('finance_admin','membership_admin',
-- 'representative') is a DIFFERENT enum used for firm-level roles and is
-- intentionally left untouched. Only app.platform_role is collapsed.
--
-- The final enum drop is self-checking: if any object still references an old
-- label, `drop type ... __old` fails and this atomic migration rolls back.

-- 1) Rewrite function bodies (all except the enum-typed functions handled below).
do $rewrite_funcs$
declare r record; newdef text;
begin
  for r in
    select p.oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.prokind = 'f'
      and n.nspname in ('app','api','private')
      and not (n.nspname = 'private' and p.proname in ('has_platform_role','set_platform_role'))
      and not (n.nspname = 'api' and p.proname = 'set_platform_role')
      and pg_get_functiondef(p.oid) ~ 'has_platform_role\(''(platform_admin|compliance_admin|finance_admin)''::app\.platform_role'
  loop
    newdef := regexp_replace(
      pg_get_functiondef(r.oid),
      'private\.has_platform_role\(''(platform_admin|compliance_admin|finance_admin)''::app\.platform_role\)',
      'private.is_hunter_admin()',
      'g'
    );
    execute newdef;
  end loop;
end
$rewrite_funcs$;

-- 2) Rewrite RLS policies the same way.
do $rewrite_pols$
declare r record; q text; wc text; ddl text;
begin
  for r in
    select * from pg_policies
    where coalesce(qual,'') || coalesce(with_check,'')
          ~ 'has_platform_role\(''(platform_admin|compliance_admin|finance_admin)''::app\.platform_role'
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    ddl := format('create policy %I on %I.%I as %s for %s to %s',
      r.policyname, r.schemaname, r.tablename,
      lower(r.permissive), lower(r.cmd),
      array_to_string(r.roles::text[], ', ')
    );
    if r.qual is not null then
      q := regexp_replace(r.qual,
        'private\.has_platform_role\(''(platform_admin|compliance_admin|finance_admin)''::app\.platform_role\)',
        'private.is_hunter_admin()', 'g');
      ddl := ddl || format(' using (%s)', q);
    end if;
    if r.with_check is not null then
      wc := regexp_replace(r.with_check,
        'private\.has_platform_role\(''(platform_admin|compliance_admin|finance_admin)''::app\.platform_role\)',
        'private.is_hunter_admin()', 'g');
      ddl := ddl || format(' with check (%s)', wc);
    end if;
    execute ddl;
  end loop;
end
$rewrite_pols$;

-- 2b) Rewrite views (api.operations_queue) the same way. The 'compliance_admin'
--     ::text label columns are plain text (no enum dependency) and are left as-is;
--     only the has_platform_role() gates in WHERE clauses are rewritten.
do $rewrite_views$
declare r record; newdef text;
begin
  for r in
    select c.oid, n.nspname, c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'v' and n.nspname in ('api','app','private')
      and pg_get_viewdef(c.oid, true) ~ 'has_platform_role\(''(platform_admin|compliance_admin|finance_admin)''::app\.platform_role'
  loop
    newdef := regexp_replace(
      pg_get_viewdef(r.oid, true),
      'private\.has_platform_role\(''(platform_admin|compliance_admin|finance_admin)''::app\.platform_role\)',
      'private.is_hunter_admin()', 'g');
    execute format('create or replace view %I.%I with (security_invoker = true) as %s',
      r.nspname, r.relname, newdef);
  end loop;
end
$rewrite_views$;

-- 3) Drop the enum-typed functions (obsolete, or to be recreated on the new type).
drop function if exists private.has_platform_role(app.platform_role);
drop function if exists api.set_platform_role(uuid, app.platform_role, boolean);
drop function if exists private.set_platform_role(uuid, app.platform_role, boolean);

-- 4) Drop the view that reads the role column.
drop view if exists api.platform_role_assignments;

-- 5) Reduce the enum to a single value.
alter type app.platform_role rename to platform_role__old;
create type app.platform_role as enum ('master_admin');
alter table app.platform_role_assignments
  alter column role type app.platform_role using role::text::app.platform_role;
drop type app.platform_role__old;

-- 6) Recreate the api view (security_invoker) + grants.
create view api.platform_role_assignments with (security_invoker = true) as
  select id, user_id, role, assigned_by, assigned_at from app.platform_role_assignments;
revoke all on api.platform_role_assignments from public, anon;
grant select on api.platform_role_assignments to authenticated;

-- 7) Recreate the role-assignment RPCs on the single-value enum (is_hunter_admin gate).
create or replace function private.set_platform_role(p_user_id uuid, p_role app.platform_role, p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $fn$
declare
  v_actor_user_id uuid := auth.uid();
  v_is_service_role boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if not v_is_service_role and not private.is_hunter_admin() then
    raise exception 'Hunter North platform administrator permission is required';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'The target user does not exist';
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
$fn$;

create or replace function api.set_platform_role(p_user_id uuid, p_role app.platform_role, p_enabled boolean)
returns void language sql set search_path = '' as $fn$
  select private.set_platform_role(p_user_id, p_role, p_enabled);
$fn$;

revoke all on function private.set_platform_role(uuid, app.platform_role, boolean) from public;
revoke all on function api.set_platform_role(uuid, app.platform_role, boolean) from public;
grant execute on function private.set_platform_role(uuid, app.platform_role, boolean) to authenticated, service_role;
grant execute on function api.set_platform_role(uuid, app.platform_role, boolean) to authenticated, service_role;
