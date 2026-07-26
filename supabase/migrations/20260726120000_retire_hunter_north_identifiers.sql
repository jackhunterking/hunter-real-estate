-- Retire the "Hunter North" / HNC codename from the database.
--
-- The product is Equity Market. "Hunter North Capital" was its name two
-- rebrands ago and survived in a permission helper, 50 RLS policy names, an
-- enum value, an RPC name and — the part users actually saw — 16 error
-- messages such as "Hunter North platform administrator permission is
-- required".
--
-- Ordering is deliberate and exploits how Postgres stores dependencies:
--
--   * RLS policy expressions and view definitions are parse trees that
--     reference a function by OID, so renaming the helper updates all of them
--     in place. No policy is dropped, so there is never an instant where a
--     table is readable without its policy.
--   * plpgsql bodies are stored as text and resolved at run time, so every
--     caller has to be regenerated explicitly. Those are rewritten from the
--     LIVE catalogue via pg_get_functiondef, not from this repo's migration
--     history — later migrations have already rewritten several bodies, so the
--     files are not the current truth.
--   * CREATE OR REPLACE and ALTER ... RENAME both keep the function OID, so
--     grants survive. That matters here: two past incidents in this project
--     were grant regressions that only surfaced through the portal.

-- ---------------------------------------------------------------------------
-- 1. The permission helper. Policies and views follow by OID.
-- ---------------------------------------------------------------------------
alter function private.is_hunter_admin() rename to is_platform_admin;

-- ---------------------------------------------------------------------------
-- 2. The affiliation status that carried the codename. Enum labels are stored
--    by OID too, so existing rows follow automatically (there are none today).
-- ---------------------------------------------------------------------------
alter type app.firm_affiliation_status
  rename value 'approved_by_hnc_fallback' to 'approved_by_platform_fallback';

-- ---------------------------------------------------------------------------
-- 3. The onboarding RPC.
-- ---------------------------------------------------------------------------
alter function app.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) rename to complete_portal_onboarding;

alter function api.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) rename to complete_portal_onboarding;

-- ---------------------------------------------------------------------------
-- 4. Every function body that still names the codename, regenerated from the
--    live catalogue with the substitutions applied.
-- ---------------------------------------------------------------------------
do $rewrite$
declare
  targets oid[];
  target oid;
  src text;
begin
  -- Collect first: the loop replaces functions, which would otherwise mutate
  -- the relation being scanned.
  select coalesce(array_agg(p.oid), '{}')
    into targets
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('app', 'api', 'private')
    and p.prokind = 'f'
    and p.prolang not in (select oid from pg_language where lanname in ('internal', 'c'))
    and (pg_get_functiondef(p.oid) ~* 'hunter' or pg_get_functiondef(p.oid) ~* 'hnc');

  foreach target in array targets loop
    src := pg_get_functiondef(target);

    -- User-visible messages. Longest first so a shorter pattern cannot strip
    -- the qualifier off a longer one.
    src := replace(src, 'Only Hunter North platform administrators may change firm roles',
                        'Only platform administrators may change firm roles');
    src := replace(src, 'Hunter North platform administrator permission is required',
                        'Platform administrator permission is required');
    src := replace(src, 'Hunter North administration permission is required',
                        'Platform administration permission is required');
    src := replace(src, 'Hunter North administrator permission is required',
                        'Platform administrator permission is required');
    src := replace(src, 'Hunter North compliance permission is required',
                        'Compliance permission is required');
    src := replace(src, 'Hunter North finance permission is required',
                        'Finance permission is required');
    src := replace(src, 'Hunter North approval must be documented as fallback',
                        'Platform approval must be documented as fallback');
    src := replace(src, 'Only Hunter North may record fallback approval',
                        'Only a platform administrator may record fallback approval');
    src := replace(src, 'Only Hunter North may use fallback approval',
                        'Only a platform administrator may use fallback approval');
    src := replace(src, 'Only Hunter North may change account status',
                        'Only a platform administrator may change account status');
    src := replace(src, 'Only Hunter administrators can change an investment status',
                        'Only platform administrators can change an investment status');

    -- Identifiers renamed above, referenced by name from plpgsql bodies.
    src := replace(src, 'is_hunter_admin', 'is_platform_admin');
    src := replace(src, 'approved_by_hnc_fallback', 'approved_by_platform_fallback');
    src := replace(src, 'complete_hnc_onboarding', 'complete_portal_onboarding');
    src := replace(src, 'v_is_hunter', 'v_is_platform_admin');

    -- Emitted values. Existing rows are deliberately NOT rewritten: audit_events
    -- is append-only (a trigger rejects UPDATE), and rewriting history would be
    -- the wrong fix even if it were allowed.
    src := replace(src, 'firm_membership.hnc_fallback_approved',
                        'firm_membership.platform_fallback_approved');
    src := replace(src, '''hunter-north-capital''', '''equity-market''');

    execute src;
  end loop;
end
$rewrite$;

-- ---------------------------------------------------------------------------
-- 5. Policy names. Renaming leaves the expression untouched, so no policy is
--    ever absent. Verified beforehand: none of the 50 new names collides with
--    an existing policy on the same table.
-- ---------------------------------------------------------------------------
do $policies$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname,
           replace(policyname, 'hunter', 'platform') as new_name
    from pg_policies
    where policyname like '%hunter%'
    order by schemaname, tablename, policyname
  loop
    execute format(
      'alter policy %I on %I.%I rename to %I',
      pol.policyname, pol.schemaname, pol.tablename, pol.new_name
    );
  end loop;
end
$policies$;

-- ---------------------------------------------------------------------------
-- 6. Deprecated alias for the onboarding RPC, so a browser tab loaded before
--    the deploy keeps working through the rollout window. Created after the
--    rewrite in step 4 so that pass cannot pick it up by its own name.
--    TODO: drop once the app has shipped on complete_portal_onboarding.
-- ---------------------------------------------------------------------------
create function api.complete_hnc_onboarding(
  p_account_intent app.account_intent,
  p_investor_account_type app.investor_account_type,
  p_residence_jurisdiction text,
  p_investment_objective text,
  p_time_horizon text,
  p_risk_acknowledged boolean,
  p_contact_consent boolean
) returns void
language sql
security invoker
set search_path = ''
as $alias$
  select api.complete_portal_onboarding(
    p_account_intent, p_investor_account_type, p_residence_jurisdiction,
    p_investment_objective, p_time_horizon, p_risk_acknowledged, p_contact_consent
  );
$alias$;

comment on function api.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) is 'Deprecated alias for api.complete_portal_onboarding. Drop after the Equity Market rename has shipped.';

revoke all on function api.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) from public;

grant execute on function api.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Assert the rename is complete. A silent partial rename would leave a user
--    reading "Hunter North" in an error message on a site that no longer uses
--    the name, so fail the migration instead.
-- ---------------------------------------------------------------------------
do $verify$
declare
  leftovers text;
begin
  select string_agg(name, ', ') into leftovers
  from (
    select n.nspname || '.' || p.proname as name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('app', 'api', 'private')
      and p.prokind = 'f'
      and p.prolang not in (select oid from pg_language where lanname in ('internal', 'c'))
      -- The deprecated alias in step 6 is expected; jackhunter.com is the
      -- real-estate site's contact address, not the portal's brand.
      and p.proname <> 'complete_hnc_onboarding'
      and (
        regexp_replace(pg_get_functiondef(p.oid), 'jackhunter\.com', '', 'gi') ~* 'hunter'
        or pg_get_functiondef(p.oid) ~* 'hnc'
      )
    union all
    select 'policy ' || policyname from pg_policies where policyname like '%hunter%'
    union all
    select 'view ' || schemaname || '.' || viewname from pg_views
    where schemaname in ('app', 'api', 'public') and definition ~* 'hunter'
  ) s;

  if leftovers is not null then
    raise exception 'Hunter North identifiers remain after the rename: %', leftovers;
  end if;
end
$verify$;

-- Function names in the api schema changed, so PostgREST has to re-read the
-- schema or the renamed RPC is not callable.
notify pgrst, 'reload schema';
