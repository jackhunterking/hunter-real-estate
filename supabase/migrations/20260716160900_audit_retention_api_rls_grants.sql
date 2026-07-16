create table private.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table private.retention_actions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('reviewed', 'anonymized', 'deleted', 'held', 'released')),
  performed_by uuid references auth.users(id),
  reason text not null,
  occurred_at timestamptz not null default now()
);

create trigger private_audit_events_append_only
before update or delete on private.audit_events
for each row execute function private.prevent_append_only_change();

create trigger retention_actions_append_only
before update or delete on private.retention_actions
for each row execute function private.prevent_append_only_change();

create or replace function api.submit_guide_request(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid;
  v_submission_id uuid := gen_random_uuid();
  v_job_id uuid;
  v_email text := lower(trim(p_input ->> 'email'));
begin
  if v_email = '' or p_input ->> 'guide' not in ('alici', 'satici') then
    raise exception 'Invalid guide request';
  end if;

  insert into app.contacts(email, first_name, last_name, preferred_language)
  values (
    v_email::extensions.citext,
    nullif(trim(p_input ->> 'first_name'), ''),
    nullif(trim(p_input ->> 'last_name'), ''),
    case when p_input ->> 'language' = 'en' then 'en' else 'tr' end
  )
  on conflict (email) do update set
    first_name = coalesce(excluded.first_name, app.contacts.first_name),
    last_name = coalesce(excluded.last_name, app.contacts.last_name),
    preferred_language = coalesce(excluded.preferred_language, app.contacts.preferred_language),
    updated_at = now()
  returning id into v_contact_id;

  insert into app.lead_submissions(
    id, contact_id, submission_type, source, payload, consent_snapshot, submitted_at
  ) values (
    v_submission_id,
    v_contact_id,
    'guide',
    coalesce(nullif(trim(p_input ->> 'source'), ''), 'website-guide'),
    jsonb_build_object(
      'guide', p_input ->> 'guide',
      'language', coalesce(p_input ->> 'language', 'tr')
    ),
    jsonb_build_object(
      'purpose', 'requested-guide-delivery',
      'marketing_consent', false,
      'captured_at', coalesce(p_input ->> 'submitted_at', now()::text)
    ),
    coalesce((p_input ->> 'submitted_at')::timestamptz, now())
  );

  v_job_id := private.enqueue_email(
    'guide_delivery', 'lead_submission', v_submission_id, v_email,
    'guide-delivery', '1',
    jsonb_build_object(
      'guide', p_input ->> 'guide',
      'language', coalesce(p_input ->> 'language', 'tr')
    )
  );

  insert into private.audit_events(action, entity_type, entity_id, summary)
  values ('lead.guide_submitted', 'lead_submission', v_submission_id, 'Guide request stored and delivery queued.');

  return jsonb_build_object('submission_id', v_submission_id, 'email_job_id', v_job_id);
end;
$$;

create or replace function api.submit_capital_intake(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid;
  v_submission_id uuid := gen_random_uuid();
  v_job_id uuid;
  v_recipient text;
  v_email text := lower(trim(p_input ->> 'email'));
begin
  insert into app.contacts(
    email, first_name, last_name, phone, preferred_language, country, city
  ) values (
    v_email::extensions.citext,
    nullif(trim(p_input ->> 'firstName'), ''),
    nullif(trim(p_input ->> 'lastName'), ''),
    nullif(trim(p_input ->> 'phone'), ''),
    case p_input ->> 'preferredLanguage'
      when 'English' then 'en' when 'Turkish' then 'tr' else 'both' end,
    nullif(trim(p_input ->> 'country'), ''),
    nullif(trim(p_input ->> 'city'), '')
  )
  on conflict (email) do update set
    first_name = coalesce(excluded.first_name, app.contacts.first_name),
    last_name = coalesce(excluded.last_name, app.contacts.last_name),
    phone = coalesce(excluded.phone, app.contacts.phone),
    preferred_language = coalesce(excluded.preferred_language, app.contacts.preferred_language),
    country = coalesce(excluded.country, app.contacts.country),
    city = coalesce(excluded.city, app.contacts.city),
    updated_at = now()
  returning id into v_contact_id;

  insert into app.lead_submissions(
    id, contact_id, submission_type, source, payload, consent_snapshot, submitted_at
  ) values (
    v_submission_id, v_contact_id, 'capital_intake', 'hunter-north-capital',
    p_input - 'contactConsent' - 'documentConsent' - 'riskConsent',
    jsonb_build_object(
      'contact', p_input -> 'contactConsent',
      'documents', p_input -> 'documentConsent',
      'risk', p_input -> 'riskConsent',
      'captured_at', coalesce(p_input ->> 'submitted_at', now()::text)
    ),
    coalesce((p_input ->> 'submitted_at')::timestamptz, now())
  );

  select recipient::text into v_recipient
  from private.notification_preferences
  where category = 'capital_intake' and enabled;
  v_job_id := private.enqueue_email(
    'capital_intake_alert', 'lead_submission', v_submission_id,
    coalesce(v_recipient, 'hello@jackhunter.com'),
    'capital-intake-alert', '1', '{}'::jsonb
  );
  insert into private.audit_events(action, entity_type, entity_id, summary)
  values ('lead.capital_intake_submitted', 'lead_submission', v_submission_id, 'Capital intake stored and reviewer notification queued.');
  return jsonb_build_object('submission_id', v_submission_id, 'email_job_id', v_job_id);
end;
$$;

create or replace function api.submit_investor_readiness(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid;
  v_submission_id uuid := gen_random_uuid();
  v_assessment_id uuid := gen_random_uuid();
  v_job_id uuid;
  v_recipient text;
  v_email text := lower(trim(p_input ->> 'email'));
begin
  insert into app.contacts(email, first_name, last_name, phone, country, city)
  values (
    v_email::extensions.citext,
    nullif(trim(p_input ->> 'firstName'), ''),
    nullif(trim(p_input ->> 'lastName'), ''),
    nullif(trim(p_input ->> 'phone'), ''),
    case when p_input ->> 'jurisdiction' = 'ontario' then 'Canada' else 'Turkey' end,
    nullif(trim(p_input ->> 'city'), '')
  )
  on conflict (email) do update set
    first_name = coalesce(excluded.first_name, app.contacts.first_name),
    last_name = coalesce(excluded.last_name, app.contacts.last_name),
    phone = coalesce(excluded.phone, app.contacts.phone),
    country = coalesce(excluded.country, app.contacts.country),
    city = coalesce(excluded.city, app.contacts.city),
    updated_at = now()
  returning id into v_contact_id;

  insert into app.lead_submissions(
    id, contact_id, submission_type, source, payload, consent_snapshot, submitted_at
  ) values (
    v_submission_id, v_contact_id, 'investor_readiness', 'public-readiness-tool',
    jsonb_build_object(
      'offering_id', p_input ->> 'offeringId',
      'share_class_id', p_input ->> 'shareClassId',
      'jurisdiction', p_input ->> 'jurisdiction',
      'preliminary_category', p_input ->> 'preliminary_category',
      'ruleset_id', p_input ->> 'ruleset_id'
    ),
    jsonb_build_object(
      'contact', p_input -> 'contactConsent',
      'accuracy', p_input -> 'accuracyConsent',
      'captured_at', coalesce(p_input ->> 'calculated_at', now()::text)
    ),
    coalesce((p_input ->> 'calculated_at')::timestamptz, now())
  );

  insert into app.investor_readiness_assessments(
    id, lead_submission_id, offering_id, offering_version_id, jurisdiction,
    ruleset_id, ruleset_version, input_snapshot, preliminary_category,
    qualifying_criteria, warnings, acknowledgement_snapshot, calculated_at
  ) values (
    v_assessment_id, v_submission_id, p_input ->> 'offeringId',
    p_input ->> 'offering_version_id', p_input ->> 'jurisdiction',
    p_input ->> 'ruleset_id', p_input ->> 'ruleset_version',
    p_input -> 'immutable_input_snapshot', p_input ->> 'preliminary_category',
    coalesce(p_input -> 'qualificationCriteria', '[]'::jsonb),
    coalesce(p_input -> 'warnings', '[]'::jsonb),
    jsonb_build_object(
      'contact', p_input -> 'contactConsent',
      'accuracy', p_input -> 'accuracyConsent'
    ),
    coalesce((p_input ->> 'calculated_at')::timestamptz, now())
  );

  select recipient::text into v_recipient
  from private.notification_preferences
  where category = 'investor_readiness' and enabled;
  v_job_id := private.enqueue_email(
    'investor_readiness_alert', 'lead_submission', v_submission_id,
    coalesce(v_recipient, 'hello@jackhunter.com'),
    'readiness-alert', '1', '{}'::jsonb
  );
  insert into private.audit_events(action, entity_type, entity_id, summary)
  values ('lead.readiness_submitted', 'lead_submission', v_submission_id, 'Readiness assessment stored and reviewer notification queued.');
  return jsonb_build_object('submission_id', v_submission_id, 'email_job_id', v_job_id);
end;
$$;

create or replace function api.get_email_job(p_job_id uuid)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', job.id,
    'recipient', job.recipient,
    'category', job.category,
    'templateKey', job.template_key,
    'templateVersion', job.template_version,
    'relatedEntityId', job.related_entity_id,
    'variables', job.variables
  )
  from private.email_jobs job
  where job.id = p_job_id
    and job.status in ('queued', 'sending', 'delayed');
$$;

create or replace function api.claim_email_jobs(p_limit integer default 20)
returns table(id uuid)
language sql
security definer
set search_path = ''
as $$
  with eligible as (
    select job.id
    from private.email_jobs job
    where job.status in ('queued', 'delayed')
      and job.next_retry_at <= now()
    order by job.next_retry_at, job.created_at
    for update skip locked
    limit greatest(1, least(p_limit, 100))
  )
  update private.email_jobs job
  set status = 'sending', attempt_count = attempt_count + 1
  from eligible
  where job.id = eligible.id
  returning job.id;
$$;

create or replace function api.mark_email_job_sent(p_job_id uuid, p_resend_email_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.email_jobs
  set status = 'sent', resend_email_id = p_resend_email_id,
      sent_at = coalesce(sent_at, now()), last_error_code = null
  where id = p_job_id and status in ('queued', 'sending', 'delayed');
$$;

create or replace function api.mark_email_job_failed(p_job_id uuid, p_reason text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.email_jobs
  set
    attempt_count = case when status = 'sending' then attempt_count else attempt_count + 1 end,
    status = case
      when (case when status = 'sending' then attempt_count else attempt_count + 1 end) >= 8
        then 'failed'::app.email_job_status
      else 'queued'::app.email_job_status
    end,
    next_retry_at = now() + make_interval(
      mins => least(360, power(2, least(8, attempt_count + 1))::integer)
    ),
    last_error_code = nullif(trim(p_reason), ''),
    failed_at = case when attempt_count + 1 >= 8 then now() else failed_at end,
    completed_at = case when attempt_count + 1 >= 8 then now() else completed_at end
  where id = p_job_id
    and status not in ('delivered', 'bounced', 'complained', 'suppressed', 'cancelled');
$$;

create or replace function api.record_resend_event(
  p_event_id text,
  p_event_type text,
  p_event_at timestamptz,
  p_resend_email_id text,
  p_recipient text,
  p_event_data jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status app.email_job_status;
begin
  insert into private.resend_events(event_id, resend_email_id, event_type, event_at, event_data)
  values (p_event_id, p_resend_email_id, p_event_type, p_event_at, coalesce(p_event_data, '{}'::jsonb))
  on conflict (event_id) do nothing;
  if not found then return false; end if;

  v_status := case p_event_type
    when 'email.sent' then 'sent'::app.email_job_status
    when 'email.delivered' then 'delivered'::app.email_job_status
    when 'email.delivery_delayed' then 'delayed'::app.email_job_status
    when 'email.failed' then 'failed'::app.email_job_status
    when 'email.bounced' then 'bounced'::app.email_job_status
    when 'email.complained' then 'complained'::app.email_job_status
    when 'email.suppressed' then 'suppressed'::app.email_job_status
    else null
  end;

  if v_status is not null then
    update private.email_jobs
    set status = v_status,
        last_event_at = p_event_at,
        sent_at = case when v_status = 'sent' then coalesce(sent_at, p_event_at) else sent_at end,
        delivered_at = case when v_status = 'delivered' then p_event_at else delivered_at end,
        failed_at = case when v_status in ('failed', 'bounced', 'complained', 'suppressed') then p_event_at else failed_at end,
        completed_at = case when v_status in ('delivered', 'failed', 'bounced', 'complained', 'suppressed') then p_event_at else completed_at end
    where resend_email_id = p_resend_email_id
      and (last_event_at is null or last_event_at <= p_event_at);
  end if;

  if p_event_type in ('email.bounced', 'email.complained', 'email.suppressed')
     and nullif(trim(p_recipient), '') is not null then
    insert into private.email_suppressions(email, reason, source_event_id, suppressed_at)
    values (
      lower(trim(p_recipient))::extensions.citext,
      replace(p_event_type, 'email.', ''),
      p_event_id,
      p_event_at
    )
    on conflict (email) do update set
      reason = excluded.reason,
      source_event_id = excluded.source_event_id,
      suppressed_at = greatest(private.email_suppressions.suppressed_at, excluded.suppressed_at),
      cleared_at = null;
    update app.contacts
    set email_deliverability = case p_event_type
      when 'email.bounced' then 'bounced'::app.email_deliverability_status
      when 'email.complained' then 'complained'::app.email_deliverability_status
      else 'suppressed'::app.email_deliverability_status end,
      updated_at = now()
    where email = lower(trim(p_recipient))::extensions.citext;
  end if;
  return true;
end;
$$;

create or replace function private.update_lead(
  p_lead_id uuid,
  p_status app.lead_status,
  p_assigned_to uuid,
  p_follow_up_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_hunter_admin() then
    raise exception 'Hunter North administrator permission is required';
  end if;
  update app.lead_submissions
  set status = p_status,
      assigned_to = p_assigned_to,
      follow_up_at = p_follow_up_at,
      updated_at = now()
  where id = p_lead_id and deleted_at is null;
  if not found then raise exception 'Lead not found'; end if;
  insert into app.lead_activity_events(
    lead_submission_id, actor_user_id, event_type, details
  ) values (
    p_lead_id, auth.uid(), 'lead.updated',
    jsonb_build_object(
      'status', p_status,
      'assigned_to', p_assigned_to,
      'follow_up_at', p_follow_up_at
    )
  );
  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, summary)
  values (auth.uid(), 'lead.updated', 'lead_submission', p_lead_id, 'Lead assignment, follow-up, or status updated.');
end;
$$;

create or replace function private.add_lead_note(p_lead_id uuid, p_note text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note_id uuid := gen_random_uuid();
begin
  if not private.is_hunter_admin() then
    raise exception 'Hunter North administrator permission is required';
  end if;
  if length(trim(coalesce(p_note, ''))) = 0 then
    raise exception 'A note is required';
  end if;
  insert into app.lead_notes(id, lead_submission_id, author_user_id, note)
  values (v_note_id, p_lead_id, auth.uid(), trim(p_note));
  insert into app.lead_activity_events(
    lead_submission_id, actor_user_id, event_type
  ) values (p_lead_id, auth.uid(), 'lead.note_added');
  return v_note_id;
end;
$$;

create view api.profiles with (security_invoker = true) as select * from app.profiles;
create view api.platform_role_assignments with (security_invoker = true) as select * from app.platform_role_assignments;
create view api.organizations with (security_invoker = true) as select * from app.organizations;
create view api.organization_private_details with (security_invoker = true) as select * from app.organization_private_details;
create view api.firm_membership_directory with (security_invoker = true) as select * from app.firm_membership_directory;
create view api.firm_affiliations with (security_invoker = true) as select * from app.firm_affiliations;
create view api.partner_applications with (security_invoker = true) as select * from app.partner_applications;
create view api.license_verification_events with (security_invoker = true) as select * from app.license_verification_events;
create view api.partner_accounts with (security_invoker = true) as select * from app.partner_accounts;
create view api.organization_offering_access with (security_invoker = true) as select * from app.organization_offering_access;
create view api.commission_entries with (security_invoker = true) as select * from app.commission_entries;
create view api.investment_applications with (security_invoker = true) as select * from app.investment_applications;
create view api.referrals with (security_invoker = true) as select * from app.referrals;
create view api.document_records with (security_invoker = true) as select * from app.document_records;
create view api.audit_events with (security_invoker = true) as select * from app.audit_events;

create view api.admin_leads with (security_invoker = true) as
select
  lead.id,
  lead.submission_type,
  lead.status,
  lead.source,
  lead.assigned_to,
  lead.follow_up_at,
  lead.submitted_at,
  contact.email,
  contact.first_name,
  contact.last_name,
  contact.phone,
  contact.preferred_language,
  contact.country,
  contact.city,
  contact.email_deliverability
from app.lead_submissions lead
join app.contacts contact on contact.id = lead.contact_id
where lead.deleted_at is null and contact.deleted_at is null;

create view api.published_offerings with (security_invoker = true) as
select
  offering.id,
  offering.slug,
  offering.manager_id,
  version.id as version_id,
  version.version,
  version.content_snapshot,
  version.effective_at,
  version.published_at
from app.offerings offering
join app.offering_content_versions version on version.id = offering.current_version_id
where offering.status = 'published'
  and version.status = 'published'
  and version.effective_at <= now()
  and (version.withdrawal_at is null or version.withdrawal_at > now())
  and (offering.withdrawal_at is null or offering.withdrawal_at > now());

create view api.published_guide_assets with (security_invoker = true) as
select guide_key, language, version, bucket_id, storage_path
from app.guide_assets
where status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now());

create or replace function api.submit_partner_application(
  p_organization_id uuid, p_registered_first_names text, p_registry_last_name text,
  p_normalized_registry_last_name text, p_licence_document_number text, p_licence_type text,
  p_professional_title text, p_firm_work_email text, p_evidence_storage_path text default null,
  p_new_firm_legal_name text default null, p_new_firm_trading_name text default null,
  p_new_firm_type text default null, p_new_firm_website text default null,
  p_new_firm_business_domain text default null, p_new_firm_spk_registration text default null,
  p_new_firm_registered_address text default null, p_new_firm_authorized_contact text default null,
  p_new_firm_compliance_contact text default null, p_new_firm_evidence_storage_path text default null
) returns uuid language sql set search_path = '' as $$
  select app.submit_partner_application(
    p_organization_id, p_registered_first_names, p_registry_last_name,
    p_normalized_registry_last_name, p_licence_document_number, p_licence_type,
    p_professional_title, p_firm_work_email, p_evidence_storage_path,
    p_new_firm_legal_name, p_new_firm_trading_name, p_new_firm_type,
    p_new_firm_website, p_new_firm_business_domain, p_new_firm_spk_registration,
    p_new_firm_registered_address, p_new_firm_authorized_contact,
    p_new_firm_compliance_contact, p_new_firm_evidence_storage_path
  );
$$;
create or replace function api.decide_firm_membership(
  p_membership_id uuid, p_decision text, p_fallback_reason text default null,
  p_evidence_storage_path text default null
) returns void language sql set search_path = '' as $$
  select app.decide_firm_membership(p_membership_id, p_decision, p_fallback_reason, p_evidence_storage_path);
$$;
create or replace function api.record_license_verification(
  p_application_id uuid, p_result app.license_verification_status,
  p_returned_licence_types text[], p_returned_status text,
  p_renewal_information text default null, p_employment_information text default null,
  p_reviewer_notes text default null, p_evidence_storage_path text default null
) returns uuid language sql set search_path = '' as $$
  select app.record_license_verification(
    p_application_id, p_result, p_returned_licence_types, p_returned_status,
    p_renewal_information, p_employment_information, p_reviewer_notes,
    p_evidence_storage_path
  );
$$;
create or replace function api.decide_organization(
  p_organization_id uuid, p_status app.organization_status, p_reason text
) returns void language sql set search_path = '' as $$
  select app.decide_organization(p_organization_id, p_status, p_reason);
$$;
create or replace function api.assign_firm_membership_roles(
  p_membership_id uuid, p_roles app.firm_membership_role[], p_reason text
) returns void language sql set search_path = '' as $$
  select app.assign_firm_membership_roles(p_membership_id, p_roles, p_reason);
$$;
create or replace function api.create_commission_entry(
  p_beneficiary_type app.commission_beneficiary_type,
  p_beneficiary_user_id uuid, p_beneficiary_organization_id uuid,
  p_introducing_representative_id uuid, p_referral_id uuid,
  p_redacted_referral_reference text, p_offering_id text,
  p_gross_distribution_commission_amount numeric, p_currency char,
  p_earning_period text, p_funded_at date,
  p_distribution_commission_received_at date, p_description text,
  p_status app.commission_status default 'draft'
) returns uuid language sql set search_path = '' as $$
  select app.create_commission_entry(
    p_beneficiary_type, p_beneficiary_user_id, p_beneficiary_organization_id,
    p_introducing_representative_id, p_referral_id, p_redacted_referral_reference,
    p_offering_id, p_gross_distribution_commission_amount, p_currency,
    p_earning_period, p_funded_at, p_distribution_commission_received_at,
    p_description, p_status
  );
$$;
create or replace function api.set_commission_status(
  p_commission_id uuid, p_status app.commission_status,
  p_payment_reference text default null
) returns void language sql set search_path = '' as $$
  select app.set_commission_status(p_commission_id, p_status, p_payment_reference);
$$;
create or replace function api.create_referral(
  p_client_account_type text, p_client_first_name text, p_client_last_name text,
  p_client_display_name text, p_client_organization text, p_client_email text,
  p_client_phone text, p_country text, p_region text, p_city text,
  p_offering_id text, p_indicative_amount numeric
) returns uuid language sql set search_path = '' as $$
  select app.create_referral(
    p_client_account_type, p_client_first_name, p_client_last_name,
    p_client_display_name, p_client_organization, p_client_email,
    p_client_phone, p_country, p_region, p_city, p_offering_id,
    p_indicative_amount
  );
$$;
create or replace function api.mark_referral_contacted(p_referral_id uuid)
returns void language sql set search_path = '' as $$
  select app.mark_referral_contacted(p_referral_id);
$$;
create or replace function api.register_referral_document(
  p_referral_id uuid, p_storage_path text, p_filename text,
  p_document_category text, p_mime_type text, p_byte_size bigint
) returns uuid language sql set search_path = '' as $$
  select app.register_referral_document(
    p_referral_id, p_storage_path, p_filename, p_document_category,
    p_mime_type, p_byte_size
  );
$$;
create or replace function api.update_lead(
  p_lead_id uuid, p_status app.lead_status, p_assigned_to uuid,
  p_follow_up_at timestamptz
) returns void language sql set search_path = '' as $$
  select private.update_lead(p_lead_id, p_status, p_assigned_to, p_follow_up_at);
$$;
create or replace function api.add_lead_note(p_lead_id uuid, p_note text)
returns uuid language sql set search_path = '' as $$
  select private.add_lead_note(p_lead_id, p_note);
$$;

revoke execute on all functions in schema api from public, anon, authenticated;
grant execute on function api.submit_guide_request(jsonb) to service_role;
grant execute on function api.submit_capital_intake(jsonb) to service_role;
grant execute on function api.submit_investor_readiness(jsonb) to service_role;
grant execute on function api.get_email_job(uuid) to service_role;
grant execute on function api.claim_email_jobs(integer) to service_role;
grant execute on function api.mark_email_job_sent(uuid, text) to service_role;
grant execute on function api.mark_email_job_failed(uuid, text) to service_role;
grant execute on function api.record_resend_event(text, text, timestamptz, text, text, jsonb) to service_role;

grant select on all tables in schema api to authenticated;
grant select on api.published_offerings to anon;
grant select on api.published_guide_assets to anon, service_role;
grant execute on function api.submit_partner_application(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function api.decide_firm_membership(uuid,text,text,text) to authenticated;
grant execute on function api.record_license_verification(uuid,app.license_verification_status,text[],text,text,text,text,text) to authenticated;
grant execute on function api.decide_organization(uuid,app.organization_status,text) to authenticated;
grant execute on function api.assign_firm_membership_roles(uuid,app.firm_membership_role[],text) to authenticated;
grant execute on function api.create_commission_entry(app.commission_beneficiary_type,uuid,uuid,uuid,uuid,text,text,numeric,char,text,date,date,text,app.commission_status) to authenticated;
grant execute on function api.set_commission_status(uuid,app.commission_status,text) to authenticated;
grant execute on function api.create_referral(text,text,text,text,text,text,text,text,text,text,text,numeric) to authenticated;
grant execute on function api.mark_referral_contacted(uuid) to authenticated;
grant execute on function api.register_referral_document(uuid,text,text,text,text,bigint) to authenticated;
grant execute on function private.update_lead(uuid,app.lead_status,uuid,timestamptz) to authenticated;
grant execute on function private.add_lead_note(uuid,text) to authenticated;
grant execute on function api.update_lead(uuid,app.lead_status,uuid,timestamptz) to authenticated;
grant execute on function api.add_lead_note(uuid,text) to authenticated;

grant all on all tables in schema private to service_role;
grant all on all sequences in schema private to service_role;
