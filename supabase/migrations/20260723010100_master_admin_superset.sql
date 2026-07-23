-- A holder of 'master_admin' passes has_platform_role() for ANY required role.
-- This preserves every existing RLS policy / RPC check unchanged while letting
-- one role stand in for platform_admin + compliance_admin (+ finance_admin).
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
        and (
          assignment.role = required_role
          or assignment.role = 'master_admin'::app.platform_role
        )
    );
$$;
