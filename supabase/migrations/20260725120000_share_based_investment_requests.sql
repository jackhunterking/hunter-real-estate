-- Share-based investment requests.
--
-- An investor now indicates intent as a whole number of units of an offering's
-- share class. The client computes the affordable whole-unit count from the
-- published unit price (floor(budget / unitPrice)) and the resulting invested
-- amount (units × unitPrice); this RPC persists both. `share_quantity` is
-- recorded on the application so the portfolio can derive every figure from
-- units, not a free-floating dollar amount. This remains an indicative interest
-- that continues into human review — not an executed subscription.
--
-- The signature gains one parameter (`p_share_quantity`), so the previous
-- six-argument overload is dropped first: leaving both in place would make
-- PostgREST's function resolution ambiguous. `p_share_quantity` carries a
-- default so an amount-only caller (no usable unit price) still resolves.

drop function if exists api.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text
);
drop function if exists app.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text
);

create or replace function app.create_investment_request(
  p_offering_id text,
  p_amount numeric,
  p_account_type app.investor_account_type,
  p_preferred_contact_method app.contact_channel,
  p_contact_consent boolean,
  p_note text,
  p_share_quantity numeric default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if not coalesce(p_contact_consent, false) then
    raise exception 'Contact consent is required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Indicative amount must be positive';
  end if;
  if p_account_type is null or p_preferred_contact_method is null then
    raise exception 'Account type and preferred contact method are required';
  end if;
  if length(coalesce(p_note, '')) > 2000 then
    raise exception 'Note is too long';
  end if;
  -- Whole units only: you can only subscribe for shares you can pay for in full.
  if p_share_quantity is not null
     and (p_share_quantity <= 0 or p_share_quantity <> pg_catalog.trunc(p_share_quantity)) then
    raise exception 'Share quantity must be a positive whole number';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(auth.uid()::text || ':' || p_offering_id, 0)
  );

  if not exists (
    select 1
    from app.offerings offering
    join app.offering_content_versions version on version.id = offering.current_version_id
    where offering.id::text = p_offering_id
      and offering.status = 'published'
      and version.status = 'published'
      and version.effective_at <= now()
      and (version.withdrawal_at is null or version.withdrawal_at > now())
      and (offering.withdrawal_at is null or offering.withdrawal_at > now())
  ) then
    raise exception 'Published offering was not found';
  end if;

  if exists (
    select 1 from app.investment_applications application
    where application.user_id = auth.uid()
      and application.offering_id = p_offering_id
      and application.status in ('draft', 'submitted', 'compliance_review', 'approved_for_subscription', 'accepted')
  ) then
    raise exception 'An open request already exists for this fund';
  end if;

  insert into app.investment_applications(
    user_id, offering_id, amount, share_quantity, account_type, preferred_contact_channel,
    contact_consent_at, note, submitted_at, status
  ) values (
    auth.uid(), p_offering_id, p_amount, p_share_quantity, p_account_type,
    p_preferred_contact_method, now(), nullif(trim(p_note), ''), now(), 'submitted'
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function api.create_investment_request(
  p_offering_id text,
  p_amount numeric,
  p_account_type app.investor_account_type,
  p_preferred_contact_method app.contact_channel,
  p_contact_consent boolean,
  p_note text,
  p_share_quantity numeric default null
)
returns uuid
language sql
set search_path = ''
as $$
  select app.create_investment_request(
    p_offering_id, p_amount, p_account_type, p_preferred_contact_method,
    p_contact_consent, p_note, p_share_quantity
  );
$$;

revoke execute on function app.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text, numeric
) from public, anon;
revoke execute on function api.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text, numeric
) from public, anon;
grant execute on function app.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text, numeric
) to authenticated;
grant execute on function api.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text, numeric
) to authenticated;

notify pgrst, 'reload schema';
