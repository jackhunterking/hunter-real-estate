-- Persist the investor's computed qualification band so the portal can show it
-- and let investors re-run the self-check from their profile.
--
-- Onboarding previously stored only the coarse investor_account_type
-- (individual | entity); the accredited / eligible band the self-check computes
-- was never saved. This adds a nullable band column plus a dedicated RPC pair so
-- the profile re-check can overwrite it. The onboarding RPC
-- (app.complete_hnc_onboarding) is deliberately left untouched — its signature
-- and grants are unchanged — and the onboarding route calls this new RPC as a
-- second step, so no existing grant is disturbed.

alter table app.profiles
  add column if not exists investor_qualification_category text
    check (investor_qualification_category in ('accredited', 'eligible', 'entity', 'review'));

create or replace function app.set_investor_qualification(
  p_investor_account_type app.investor_account_type,
  p_qualification_category text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if p_qualification_category is not null
     and p_qualification_category not in ('accredited', 'eligible', 'entity', 'review') then
    raise exception 'Invalid qualification category';
  end if;

  update app.profiles
  set investor_account_type = p_investor_account_type,
      investor_qualification_category = p_qualification_category
  where user_id = auth.uid();

  if not found then
    raise exception 'Profile was not found';
  end if;
end;
$$;

create or replace function api.set_investor_qualification(
  p_investor_account_type app.investor_account_type,
  p_qualification_category text
)
returns void language sql set search_path = '' as $$
  select app.set_investor_qualification(p_investor_account_type, p_qualification_category);
$$;

revoke execute on function app.set_investor_qualification(
  app.investor_account_type, text
) from public, anon;
revoke execute on function api.set_investor_qualification(
  app.investor_account_type, text
) from public, anon;

grant execute on function app.set_investor_qualification(
  app.investor_account_type, text
) to authenticated;
grant execute on function api.set_investor_qualification(
  app.investor_account_type, text
) to authenticated;
