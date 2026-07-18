create or replace function app.submit_partner_application(
  p_organization_id uuid,
  p_registered_first_names text,
  p_registry_last_name text,
  p_normalized_registry_last_name text,
  p_licence_document_number text,
  p_licence_type text,
  p_professional_title text,
  p_firm_work_email text,
  p_evidence_storage_path text default null,
  p_new_firm_legal_name text default null,
  p_new_firm_trading_name text default null,
  p_new_firm_type text default null,
  p_new_firm_website text default null,
  p_new_firm_business_domain text default null,
  p_new_firm_spk_registration text default null,
  p_new_firm_registered_address text default null,
  p_new_firm_authorized_contact text default null,
  p_new_firm_compliance_contact text default null,
  p_new_firm_evidence_storage_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid := p_organization_id;
  v_application_id uuid := extensions.gen_random_uuid();
  v_masked_licence text;
  v_created_organization boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if length(trim(coalesce(p_registered_first_names, ''))) = 0
     or length(trim(coalesce(p_registry_last_name, ''))) = 0
     or length(trim(coalesce(p_normalized_registry_last_name, ''))) = 0
     or length(trim(coalesce(p_licence_document_number, ''))) = 0
     or length(trim(coalesce(p_licence_type, ''))) = 0
     or length(trim(coalesce(p_professional_title, ''))) = 0
     or length(trim(coalesce(p_firm_work_email, ''))) = 0 then
    raise exception 'Required partner application fields are missing';
  end if;

  if exists (
    select 1
    from app.partner_applications application
    where application.user_id = v_user_id
      and application.status in ('submitted', 'under_review')
  ) then
    raise exception 'An active partner application already exists';
  end if;

  if v_organization_id is null then
    if length(trim(coalesce(p_new_firm_legal_name, ''))) = 0 then
      raise exception 'Firm name is required';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'partner-firm:' || pg_catalog.lower(pg_catalog.btrim(p_new_firm_legal_name)),
        0
      )
    );

    select organization.id
    into v_organization_id
    from app.organizations organization
    where pg_catalog.lower(organization.legal_name) =
      pg_catalog.lower(pg_catalog.btrim(p_new_firm_legal_name))
    limit 1;

    if v_organization_id is null then
      v_organization_id := extensions.gen_random_uuid();
      v_created_organization := true;
      insert into app.organizations (
        id,
        legal_name,
        trading_name,
        firm_type,
        website,
        business_domain,
        status,
        created_by
      ) values (
        v_organization_id,
        trim(p_new_firm_legal_name),
        nullif(trim(coalesce(p_new_firm_trading_name, '')), ''),
        coalesce(nullif(trim(coalesce(p_new_firm_type, '')), ''), 'pending_review'),
        nullif(trim(coalesce(p_new_firm_website, '')), ''),
        nullif(trim(coalesce(p_new_firm_business_domain, '')), ''),
        'pending',
        v_user_id
      );
    end if;

    if v_created_organization then
      insert into app.organization_private_details (
        organization_id,
        spk_registration,
        registered_address,
        authorized_contact,
        compliance_contact
      ) values (
        v_organization_id,
        nullif(trim(coalesce(p_new_firm_spk_registration, '')), ''),
        nullif(trim(coalesce(p_new_firm_registered_address, '')), ''),
        nullif(trim(coalesce(p_new_firm_authorized_contact, '')), ''),
        nullif(trim(coalesce(p_new_firm_compliance_contact, '')), '')
      );
      if p_new_firm_evidence_storage_path is not null then
        insert into app.document_records (
          owner_user_id,
          organization_id,
          bucket_id,
          storage_path,
          filename,
          access
        ) values (
          v_user_id,
          v_organization_id,
          'partner-credentials',
          p_new_firm_evidence_storage_path,
          regexp_replace(p_new_firm_evidence_storage_path, '^.*/', ''),
          'internal'
        );
      end if;
    end if;
  elsif not exists (
    select 1 from app.organizations organization where organization.id = v_organization_id
  ) then
    raise exception 'Selected firm does not exist';
  end if;

  if exists (
    select 1
    from app.firm_affiliations affiliation
    where affiliation.user_id = v_user_id
      and affiliation.is_primary
      and affiliation.status in ('approved_by_firm', 'approved_by_hnc_fallback')
      and affiliation.organization_id = v_organization_id
  ) then
    raise exception 'The selected firm is already the active primary association';
  end if;

  update app.firm_affiliations
  set status = 'ended', ended_at = now()
  where user_id = v_user_id
    and is_primary
    and status in ('approved_by_firm', 'approved_by_hnc_fallback');

  update app.organization_memberships
  set status = 'ended', ended_at = now()
  where user_id = v_user_id
    and status = 'active'
    and organization_id <> v_organization_id;

  update app.partner_accounts
  set status = 'pending'
  where user_id = v_user_id;

  v_masked_licence := case
    when length(trim(p_licence_document_number)) <= 4 then '••••'
    else left(trim(p_licence_document_number), 2)
      || repeat('•', greatest(length(trim(p_licence_document_number)) - 4, 3))
      || right(trim(p_licence_document_number), 2)
  end;

  insert into app.organization_memberships (
    organization_id,
    user_id,
    roles,
    status,
    work_email,
    registered_name,
    licence_type,
    masked_licence_number,
    verification_status
  ) values (
    v_organization_id,
    v_user_id,
    array['representative'::app.firm_membership_role],
    'pending',
    lower(trim(p_firm_work_email)),
    trim(p_registered_first_names) || ' ' || trim(p_registry_last_name),
    trim(p_licence_type),
    v_masked_licence,
    'pending'
  )
  on conflict (organization_id, user_id) do update
  set roles = excluded.roles,
      status = 'pending',
      work_email = excluded.work_email,
      registered_name = excluded.registered_name,
      licence_type = excluded.licence_type,
      masked_licence_number = excluded.masked_licence_number,
      verification_status = 'pending',
      requested_at = now(),
      approved_by = null,
      approved_at = null,
      ended_at = null;

  insert into app.firm_affiliations (
    organization_id,
    user_id,
    status,
    is_primary
  ) values (
    v_organization_id,
    v_user_id,
    'pending_firm',
    true
  );

  insert into app.partner_applications (
    id,
    user_id,
    organization_id,
    registered_first_names,
    registry_last_name,
    normalized_registry_last_name,
    licence_document_number,
    licence_type,
    professional_title,
    firm_work_email,
    evidence_storage_path,
    lookup_consent_at,
    accuracy_consent_at,
    status,
    submitted_at
  ) values (
    v_application_id,
    v_user_id,
    v_organization_id,
    trim(p_registered_first_names),
    trim(p_registry_last_name),
    trim(p_normalized_registry_last_name),
    trim(p_licence_document_number),
    trim(p_licence_type),
    trim(p_professional_title),
    lower(trim(p_firm_work_email)),
    p_evidence_storage_path,
    now(),
    now(),
    'submitted',
    now()
  );

  insert into app.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    summary
  ) values (
    v_user_id,
    'partner_application.submitted',
    'partner_application',
    v_application_id::text,
    'Partner application submitted for independent firm and SPL review.'
  );

  return v_application_id;
end;
$$;

drop policy if exists fund_commission_schedules_current_select
on app.fund_commission_schedules;

create policy fund_commission_schedules_current_select
on app.fund_commission_schedules for select to authenticated
using (
  status = 'published'
  and effective_from <= current_date
  and (effective_to is null or effective_to >= current_date)
  and (select private.partner_is_active((select auth.uid())))
);
