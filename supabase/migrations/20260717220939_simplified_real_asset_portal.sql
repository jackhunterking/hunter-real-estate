alter table app.investment_applications
  add column account_type app.investor_account_type,
  add column preferred_contact_channel app.contact_channel,
  add column contact_consent_at timestamptz,
  add column note text check (note is null or length(note) <= 2000),
  add column submitted_at timestamptz;

create index investment_applications_open_request_idx
  on app.investment_applications(user_id, offering_id)
  where status in ('draft', 'submitted', 'compliance_review', 'approved_for_subscription', 'accepted');

create or replace function app.create_investment_request(
  p_offering_id text,
  p_amount numeric,
  p_account_type app.investor_account_type,
  p_preferred_contact_method app.contact_channel,
  p_contact_consent boolean,
  p_note text
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
    user_id, offering_id, amount, account_type, preferred_contact_channel,
    contact_consent_at, note, submitted_at, status
  ) values (
    auth.uid(), p_offering_id, p_amount, p_account_type,
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
  p_note text
)
returns uuid
language sql
set search_path = ''
as $$
  select app.create_investment_request(
    p_offering_id, p_amount, p_account_type, p_preferred_contact_method,
    p_contact_consent, p_note
  );
$$;

drop view if exists api.operations_queue;
create view api.operations_queue with (security_invoker = true) as
select
  'investment:' || application.id::text as id,
  'requests'::text as module,
  application.user_id::text as title,
  application.offering_id || ' · ' || application.amount::text || ' CAD' as summary,
  application.status::text as status,
  application.updated_at as occurred_at,
  'compliance_admin'::text as required_role,
  pg_catalog.jsonb_build_object(
    'user_id', application.user_id,
    'offering_id', application.offering_id,
    'amount', application.amount,
    'account_type', application.account_type,
    'preferred_contact_channel', application.preferred_contact_channel,
    'contact_consent_at', application.contact_consent_at,
    'note', application.note,
    'submitted_at', application.submitted_at
  ) as payload
from app.investment_applications application
where private.has_platform_role('compliance_admin') or private.has_platform_role('platform_admin')
union all
select
  'professional:' || application.id::text,
  'professional',
  trim(application.registered_first_names || ' ' || application.registry_last_name),
  application.professional_title || ' · ' || application.firm_work_email,
  application.status::text,
  application.updated_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'user_id', application.user_id,
    'organization_id', application.organization_id,
    'licence_document_number', application.licence_document_number,
    'licence_type', application.licence_type
  )
from app.partner_applications application
where private.has_platform_role('compliance_admin') or private.has_platform_role('platform_admin')
union all
select
  'licence:' || verification.id::text,
  'licences',
  verification.queried_registry_last_name,
  verification.queried_licence_number || ' · ' || verification.source_url,
  verification.result::text,
  verification.verified_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'application_id', verification.application_id,
    'user_id', verification.user_id,
    'reviewer_id', verification.reviewer_id,
    'reviewer_notes', verification.reviewer_notes
  )
from app.license_verification_events verification
where private.has_platform_role('compliance_admin') or private.has_platform_role('platform_admin')
union all
select
  'firm:' || organization.id::text,
  'firms',
  organization.legal_name,
  organization.firm_type,
  organization.status::text,
  organization.updated_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'trading_name', organization.trading_name,
    'website', organization.website,
    'business_domain', organization.business_domain
  )
from app.organizations organization
where private.has_platform_role('compliance_admin') or private.has_platform_role('platform_admin')
union all
select
  'payment:' || commission.id::text,
  'payments',
  commission.redacted_referral_reference,
  commission.amount::text || ' ' || commission.currency,
  commission.status::text,
  coalesce(commission.paid_at, commission.approved_at, commission.created_at),
  'finance_admin',
  pg_catalog.jsonb_build_object(
    'beneficiary_type', commission.beneficiary_type,
    'beneficiary_user_id', commission.beneficiary_user_id,
    'beneficiary_organization_id', commission.beneficiary_organization_id,
    'offering_id', commission.offering_id,
    'payment_reference', commission.payment_reference
  )
from app.commission_entries commission
where private.has_platform_role('finance_admin') or private.has_platform_role('platform_admin')
union all
select
  'lead:' || lead.id::text,
  'leads',
  contact.email,
  lead.submission_type::text || ' · ' || coalesce(lead.source, ''),
  lead.status::text,
  lead.submitted_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'contact_id', contact.id,
    'first_name', contact.first_name,
    'last_name', contact.last_name,
    'phone', contact.phone,
    'assigned_to', lead.assigned_to,
    'follow_up_at', lead.follow_up_at
  )
from app.lead_submissions lead
join app.contacts contact on contact.id = lead.contact_id
where lead.deleted_at is null
  and contact.deleted_at is null
  and (private.has_platform_role('compliance_admin') or private.has_platform_role('platform_admin'))
union all
select
  'audit:' || event.id::text,
  'audit',
  event.action,
  event.summary,
  event.entity_type,
  event.occurred_at,
  'platform_admin',
  pg_catalog.jsonb_build_object(
    'actor_user_id', event.actor_user_id,
    'entity_id', event.entity_id,
    'request_id', event.request_id
  )
from app.audit_events event
where private.is_hunter_admin();

revoke all on api.operations_queue from public, anon;
grant select on api.operations_queue to authenticated;

revoke execute on function app.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text
) from public, anon;
revoke execute on function api.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text
) from public, anon;
grant execute on function app.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text
) to authenticated;
grant execute on function api.create_investment_request(
  text, numeric, app.investor_account_type, app.contact_channel, boolean, text
) to authenticated;

notify pgrst, 'reload schema';
