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
begin
  if not v_is_service_role
     and not private.has_platform_role('platform_admin'::app.platform_role) then
    raise exception 'Hunter North platform administrator permission is required';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'The target user does not exist';
  end if;

  if p_enabled then
    insert into app.platform_role_assignments(user_id, role, assigned_by)
    values (p_user_id, p_role, v_actor_user_id)
    on conflict (user_id, role) do update
    set assigned_by = excluded.assigned_by,
        assigned_at = now();
  else
    delete from app.platform_role_assignments
    where user_id = p_user_id and role = p_role;
  end if;

  insert into private.audit_events(
    actor_user_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    v_actor_user_id,
    case when p_enabled then 'platform_role.granted' else 'platform_role.revoked' end,
    'profile',
    p_user_id,
    case when p_enabled then 'Platform role granted.' else 'Platform role revoked.' end,
    jsonb_build_object('role', p_role, 'enabled', p_enabled)
  );
end;
$$;

revoke execute on function private.set_platform_role(uuid, app.platform_role, boolean)
from public, anon;
grant execute on function private.set_platform_role(uuid, app.platform_role, boolean)
to authenticated, service_role;

create or replace function api.set_platform_role(
  p_user_id uuid,
  p_role app.platform_role,
  p_enabled boolean
)
returns void
language sql
set search_path = ''
as $$
  select private.set_platform_role(p_user_id, p_role, p_enabled);
$$;

revoke execute on function api.set_platform_role(uuid, app.platform_role, boolean)
from public, anon;
grant execute on function api.set_platform_role(uuid, app.platform_role, boolean)
to authenticated, service_role;

notify pgrst, 'reload schema';
