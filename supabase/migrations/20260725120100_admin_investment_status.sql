-- Admin control over an investment request's transaction status.
--
-- Until now an application was only ever written as 'submitted' by the investor;
-- nothing advanced it through the lifecycle. Hunter staff need to move a request
-- through review to its funded (or declined) outcome — and the investor's
-- portfolio reflects that automatically, because a 'funded' application renders
-- as a held position. RLS already lets an admin update any application
-- (investments_owner_or_hunter_update); this RPC is the audited write path.
--
-- Security definer so the audit row is always written; the is_hunter_admin gate
-- is therefore the sole authorization check and must stay. Corrections are
-- permitted by design (an admin can revise any status) and every change is
-- audited; only a no-op is rejected.

create or replace function app.set_investment_status(
  p_application_id uuid,
  p_status app.investment_application_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous app.investment_application_status;
begin
  if not private.is_hunter_admin() then
    raise exception 'Only Hunter administrators can change an investment status';
  end if;

  select status into v_previous
  from app.investment_applications
  where id = p_application_id;

  if not found then
    raise exception 'Investment application was not found';
  end if;

  if v_previous = p_status then
    raise exception 'Investment application already has that status';
  end if;

  update app.investment_applications
  set status = p_status, updated_at = now()
  where id = p_application_id;

  insert into app.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    summary
  ) values (
    auth.uid(),
    'investment_application.' || p_status::text,
    'investment_application',
    p_application_id::text,
    'Investment status changed from ' || v_previous::text || ' to ' || p_status::text || ' by an administrator.'
  );
end;
$$;

create or replace function api.set_investment_status(
  p_application_id uuid,
  p_new_status text
)
returns void
language sql
set search_path = ''
as $$
  select app.set_investment_status(
    p_application_id,
    p_new_status::app.investment_application_status
  );
$$;

revoke execute on function app.set_investment_status(uuid, app.investment_application_status) from public, anon;
revoke execute on function api.set_investment_status(uuid, text) from public, anon;
grant execute on function app.set_investment_status(uuid, app.investment_application_status) to authenticated;
grant execute on function api.set_investment_status(uuid, text) to authenticated;

notify pgrst, 'reload schema';
