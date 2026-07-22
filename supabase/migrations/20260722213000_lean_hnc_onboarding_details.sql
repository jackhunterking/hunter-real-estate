-- Lean investor onboarding: the final details step now collects only country of
-- residence plus a single terms/privacy agreement. Investment objective and time
-- horizon are no longer asked, and the two separate acknowledgements collapse into
-- one consent. Relax app.complete_hnc_onboarding so those fields are optional.
--
-- The function signature is unchanged, so existing grants are preserved; the api.*
-- wrapper does not need to be touched. We re-grant at the end defensively.

create or replace function app.complete_hnc_onboarding(
  p_account_intent app.account_intent,
  p_investor_account_type app.investor_account_type,
  p_residence_jurisdiction text,
  p_investment_objective text,
  p_time_horizon text,
  p_risk_acknowledged boolean,
  p_contact_consent boolean
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if p_account_intent = 'investor' and p_investor_account_type is null then
    raise exception 'Investor account type is required';
  end if;
  -- Country of residence and the single agreement are the only hard requirements.
  if length(trim(coalesce(p_residence_jurisdiction, ''))) < 2
     or not coalesce(p_risk_acknowledged, false)
     or not coalesce(p_contact_consent, false) then
    raise exception 'Required onboarding fields are missing';
  end if;

  update app.profiles
  set account_intent = p_account_intent,
      investor_account_type = case
        when p_account_intent = 'investor' then p_investor_account_type
        else null
      end,
      onboarding_status = 'completed',
      residence_jurisdiction = trim(p_residence_jurisdiction),
      investment_objective = nullif(trim(coalesce(p_investment_objective, '')), ''),
      time_horizon = nullif(trim(coalesce(p_time_horizon, '')), ''),
      risk_acknowledged_at = now(),
      contact_consent_at = now()
  where user_id = auth.uid();

  if not found then
    raise exception 'Profile was not found';
  end if;
end;
$$;

revoke execute on function app.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) from public, anon;
grant execute on function app.complete_hnc_onboarding(
  app.account_intent, app.investor_account_type, text, text, text, boolean, boolean
) to authenticated;
