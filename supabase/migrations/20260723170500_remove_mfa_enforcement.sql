-- Owner directive (2026-07-23): remove MFA (aal2) enforcement.
--
-- private.has_mfa() previously required the session's `aal` claim to equal
-- 'aal2'. The owner operates the platform without enrolling MFA, so this gate
-- blocked every admin action (offering authoring, operations, learning content,
-- commissions) via private.is_hunter_admin(), and also fed private.has_org_role
-- and private.partner_is_active. Returning `true` removes the second-factor
-- requirement everywhere those helpers are used.
--
-- To RE-ENABLE MFA later, restore the original body:
--   select coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
--
-- Idempotent (create or replace).
create or replace function private.has_mfa()
returns boolean
language sql
stable
set search_path = ''
as $$
  select true;
$$;
