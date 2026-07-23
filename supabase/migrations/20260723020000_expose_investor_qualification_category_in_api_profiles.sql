-- Expose investor_qualification_category through the api.profiles view.
--
-- 20260722220000_investor_qualification_category added
-- investor_qualification_category to app.profiles but did not update the
-- security_invoker view api.profiles, which the app reads (the Supabase client
-- is bound to the `api` schema). loadPortalSnapshot() selects
-- investor_qualification_category from `profiles`, so PostgREST failed the whole
-- snapshot query with "column profiles.investor_qualification_category does not
-- exist". That threw during the portal layout's server render, so every signed-in
-- user hit a server-side exception immediately after signing in.
--
-- Recreate the view with the existing columns in their current order plus the
-- new column appended, so create-or-replace keeps the output order intact.

create or replace view api.profiles with (security_invoker = true) as
  select user_id,
         first_name,
         middle_names,
         last_name,
         display_name,
         email,
         locale,
         account_status,
         created_at,
         updated_at,
         account_intent,
         investor_account_type,
         onboarding_status,
         residence_jurisdiction,
         investment_objective,
         time_horizon,
         risk_acknowledged_at,
         contact_consent_at,
         investor_qualification_category
  from app.profiles;

grant select on api.profiles to authenticated;

-- Reload PostgREST schema cache so the new column is picked up immediately.
notify pgrst, 'reload schema';
