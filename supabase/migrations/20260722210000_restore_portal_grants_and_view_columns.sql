-- Restore portal read access broken by later migrations.
--
-- Root causes fixed here:
--   1. 20260716160800 ran `revoke all on all functions in schema private
--      from public, anon, authenticated`, which clobbered the EXECUTE grants
--      that 20260716160220 gave `authenticated` on the RLS helper functions.
--      Every RLS policy that calls them then failed with 42501
--      ("permission denied for function ...") for signed-in users.
--   2. `authenticated` lost SELECT on app.commission_entries, but the
--      security_invoker view api.commission_entries reads it as the caller,
--      so the portal snapshot failed with
--      "permission denied for table commission_entries".
--   3. api.investment_applications was created before several columns existed
--      on app.investment_applications, so the snapshot select of
--      account_type / preferred_contact_channel / contact_consent_at / note /
--      submitted_at failed with "column ... does not exist".

-- 1. Re-grant EXECUTE on the RLS helper functions (and only those) to
--    authenticated. The privileged email-job / admin functions in schema
--    private remain revoked.
grant execute on function private.has_platform_role(app.platform_role) to authenticated;
grant execute on function private.is_hunter_admin() to authenticated;
grant execute on function private.has_org_role(uuid, app.firm_membership_role[]) to authenticated;
grant execute on function private.is_active_org_member(uuid) to authenticated;
grant execute on function private.partner_is_active(uuid) to authenticated;
grant execute on function private.has_mfa() to authenticated;

-- 2. Restore SELECT on the commission table. RLS still filters rows per caller.
grant select on app.commission_entries to authenticated;

-- 3. Expose the columns the portal reads. Columns are appended so
--    create-or-replace keeps the existing output order intact.
create or replace view api.investment_applications with (security_invoker = true) as
  select id,
         user_id,
         offering_id,
         amount,
         status,
         created_at,
         updated_at,
         client_id,
         share_class_id,
         share_quantity,
         account_preference,
         consent_snapshot,
         account_type,
         preferred_contact_channel,
         contact_consent_at,
         note,
         submitted_at
  from app.investment_applications;

grant select on api.investment_applications to authenticated;

-- Reload PostgREST schema cache so the new columns/grants are picked up.
notify pgrst, 'reload schema';
