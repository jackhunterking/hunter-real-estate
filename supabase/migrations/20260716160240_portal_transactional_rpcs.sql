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
    if length(trim(coalesce(p_new_firm_legal_name, ''))) = 0
       or length(trim(coalesce(p_new_firm_type, ''))) = 0 then
      raise exception 'New firm legal name and type are required';
    end if;
    v_organization_id := extensions.gen_random_uuid();
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
      trim(p_new_firm_type),
      nullif(trim(coalesce(p_new_firm_website, '')), ''),
      nullif(trim(coalesce(p_new_firm_business_domain, '')), ''),
      'pending',
      v_user_id
    );
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
  );

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

create or replace function app.decide_firm_membership(
  p_membership_id uuid,
  p_decision text,
  p_fallback_reason text default null,
  p_evidence_storage_path text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership app.organization_memberships%rowtype;
  v_is_hunter boolean := private.is_hunter_admin();
  v_is_firm_admin boolean;
  v_affiliation_status app.firm_affiliation_status;
  v_membership_status app.membership_status;
begin
  select * into v_membership
  from app.organization_memberships membership
  where membership.id = p_membership_id;
  if not found then raise exception 'Membership not found'; end if;

  v_is_firm_admin := private.has_org_role(
    v_membership.organization_id,
    array['membership_admin'::app.firm_membership_role]
  );
  if not v_is_hunter and not v_is_firm_admin then
    raise exception 'Membership administration permission is required';
  end if;
  if p_decision not in ('approve', 'reject', 'suspend') then
    raise exception 'Unsupported membership decision';
  end if;

  if p_fallback_reason is not null then
    if not v_is_hunter then raise exception 'Only Hunter North may use fallback approval'; end if;
    if length(trim(p_fallback_reason)) = 0 or p_evidence_storage_path is null then
      raise exception 'Fallback approval requires a written reason and evidence';
    end if;
  elsif p_decision = 'approve' and v_is_hunter and not v_is_firm_admin then
    raise exception 'Hunter North approval must be documented as fallback';
  end if;

  v_membership_status := case
    when p_decision = 'approve' then 'active'::app.membership_status
    when p_decision = 'reject' then 'ended'::app.membership_status
    else 'suspended'::app.membership_status
  end;
  v_affiliation_status := case
    when p_decision = 'approve' and p_fallback_reason is not null then 'approved_by_hnc_fallback'::app.firm_affiliation_status
    when p_decision = 'approve' then 'approved_by_firm'::app.firm_affiliation_status
    when p_decision = 'reject' then 'rejected'::app.firm_affiliation_status
    else 'suspended'::app.firm_affiliation_status
  end;

  update app.organization_memberships
  set
    status = v_membership_status,
    approved_by = case when p_decision = 'approve' then auth.uid() else approved_by end,
    approved_at = case when p_decision = 'approve' then now() else approved_at end,
    ended_at = case when p_decision = 'reject' then now() else ended_at end
  where id = p_membership_id;

  update app.firm_affiliations
  set
    status = v_affiliation_status,
    approval_reason = p_fallback_reason,
    ended_at = case when p_decision = 'reject' then now() else ended_at end
  where user_id = v_membership.user_id
    and organization_id = v_membership.organization_id
    and is_primary;

  if p_decision = 'approve'
     and exists (
       select 1
       from app.organizations organization
       where organization.id = v_membership.organization_id
         and organization.status = 'active'
     )
     and exists (
       select 1
       from app.partner_applications application
       where application.user_id = v_membership.user_id
         and application.organization_id = v_membership.organization_id
         and application.status = 'approved'
     )
     and (
       select event.result
       from app.license_verification_events event
       where event.user_id = v_membership.user_id
       order by event.verified_at desc, event.id desc
       limit 1
     ) = 'verified'::app.license_verification_status then
    insert into app.partner_accounts (
      user_id,
      organization_id,
      status,
      relationship_since
    ) values (
      v_membership.user_id,
      v_membership.organization_id,
      'active',
      current_date
    )
    on conflict (user_id)
    do update set
      organization_id = excluded.organization_id,
      status = 'active',
      relationship_since = coalesce(app.partner_accounts.relationship_since, current_date);
  elsif p_decision in ('reject', 'suspend') then
    update app.partner_accounts
    set status = 'suspended'
    where user_id = v_membership.user_id;
  end if;

  if p_evidence_storage_path is not null then
    insert into app.document_records (
      organization_id,
      bucket_id,
      storage_path,
      filename,
      access
    ) values (
      v_membership.organization_id,
      'partner-credentials',
      p_evidence_storage_path,
      regexp_replace(p_evidence_storage_path, '^.*/', ''),
      'internal'
    );
  end if;

  insert into app.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    summary
  ) values (
    auth.uid(),
    case when p_fallback_reason is null
      then 'firm_membership.' || p_decision
      else 'firm_membership.hnc_fallback_approved'
    end,
    'organization_membership',
    p_membership_id::text,
    coalesce(trim(p_fallback_reason), 'Firm membership decision recorded.')
  );
end;
$$;

create or replace function app.record_license_verification(
  p_application_id uuid,
  p_result app.license_verification_status,
  p_returned_licence_types text[],
  p_returned_status text,
  p_renewal_information text default null,
  p_employment_information text default null,
  p_reviewer_notes text default null,
  p_evidence_storage_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application app.partner_applications%rowtype;
  v_event_id uuid := extensions.gen_random_uuid();
  v_can_activate boolean;
begin
  if not private.is_hunter_admin() then
    raise exception 'Hunter North compliance permission is required';
  end if;
  if p_result = 'pending' then
    raise exception 'A completed verification result is required';
  end if;

  select * into v_application
  from app.partner_applications application
  where application.id = p_application_id;
  if not found then raise exception 'Partner application not found'; end if;

  insert into app.license_verification_events (
    id,
    application_id,
    user_id,
    queried_licence_number,
    queried_registry_last_name,
    source_url,
    result,
    returned_licence_types,
    returned_status,
    renewal_information,
    employment_information,
    reviewer_id,
    reviewer_notes,
    evidence_storage_path
  ) values (
    v_event_id,
    v_application.id,
    v_application.user_id,
    v_application.licence_document_number,
    v_application.registry_last_name,
    'https://lsts.spl.com.tr/bilgi-sorgulama',
    p_result,
    coalesce(p_returned_licence_types, '{}'),
    nullif(trim(coalesce(p_returned_status, '')), ''),
    nullif(trim(coalesce(p_renewal_information, '')), ''),
    nullif(trim(coalesce(p_employment_information, '')), ''),
    auth.uid(),
    nullif(trim(coalesce(p_reviewer_notes, '')), ''),
    p_evidence_storage_path
  );

  insert into app.regulatory_credentials (
    user_id,
    organization_id,
    licence_document_number,
    registry_last_name,
    licence_type,
    professional_title,
    status,
    last_verified_at
  ) values (
    v_application.user_id,
    v_application.organization_id,
    v_application.licence_document_number,
    v_application.registry_last_name,
    v_application.licence_type,
    v_application.professional_title,
    p_result,
    now()
  )
  on conflict (user_id, licence_document_number)
  do update set
    organization_id = excluded.organization_id,
    registry_last_name = excluded.registry_last_name,
    licence_type = excluded.licence_type,
    professional_title = excluded.professional_title,
    status = excluded.status,
    last_verified_at = excluded.last_verified_at;

  update app.partner_applications
  set
    status = case when p_result = 'verified' then 'approved' else 'under_review' end,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = v_application.id;

  update app.organization_memberships
  set verification_status = p_result
  where user_id = v_application.user_id
    and organization_id = v_application.organization_id;

  select p_result = 'verified'
    and exists (
      select 1
      from app.firm_affiliations affiliation
      where affiliation.user_id = v_application.user_id
        and affiliation.organization_id = v_application.organization_id
        and affiliation.is_primary
        and affiliation.status in ('approved_by_firm', 'approved_by_hnc_fallback')
    )
    and exists (
      select 1
      from app.organizations organization
      where organization.id = v_application.organization_id
        and organization.status = 'active'
    )
  into v_can_activate;

  insert into app.partner_accounts (
    user_id,
    organization_id,
    status,
    relationship_since
  ) values (
    v_application.user_id,
    v_application.organization_id,
    case when v_can_activate then 'active' else 'pending' end,
    case when v_can_activate then current_date else null end
  )
  on conflict (user_id)
  do update set
    organization_id = excluded.organization_id,
    status = case
      when v_can_activate then 'active'::app.partner_account_status
      when app.partner_accounts.status = 'active' then 'suspended'::app.partner_account_status
      else 'pending'::app.partner_account_status
    end,
    relationship_since = case
      when v_can_activate then coalesce(app.partner_accounts.relationship_since, current_date)
      else app.partner_accounts.relationship_since
    end;

  insert into app.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    summary
  ) values (
    auth.uid(),
    'license_verification.recorded',
    'partner_application',
    v_application.id::text,
    'SPL verification result recorded as ' || p_result::text || '.'
  );

  return v_event_id;
end;
$$;

create or replace function app.decide_organization(
  p_organization_id uuid,
  p_status app.organization_status,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_hunter_admin() then
    raise exception 'Hunter North administration permission is required';
  end if;
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'A review reason is required';
  end if;
  update app.organizations set status = p_status where id = p_organization_id;
  if not found then raise exception 'Organization not found'; end if;
  insert into app.audit_events (
    actor_user_id, action, entity_type, entity_id, summary
  ) values (
    auth.uid(), 'organization.' || p_status::text, 'organization', p_organization_id::text, trim(p_reason)
  );
end;
$$;

create or replace function app.assign_firm_membership_roles(
  p_membership_id uuid,
  p_roles app.firm_membership_role[],
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_platform_role('platform_admin'::app.platform_role) then
    raise exception 'Hunter North platform administrator permission is required';
  end if;
  if cardinality(p_roles) = 0 then
    raise exception 'A firm membership must retain at least one role';
  end if;
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'A role-assignment reason is required';
  end if;
  update app.organization_memberships set roles = p_roles where id = p_membership_id;
  if not found then raise exception 'Membership not found'; end if;
  insert into app.audit_events (
    actor_user_id, action, entity_type, entity_id, summary
  ) values (
    auth.uid(),
    'organization_membership.roles_assigned',
    'organization_membership',
    p_membership_id::text,
    trim(p_reason) || ' Roles: ' || array_to_string(p_roles, ', ') || '.'
  );
end;
$$;

create or replace function app.create_commission_entry(
  p_beneficiary_type app.commission_beneficiary_type,
  p_beneficiary_user_id uuid,
  p_beneficiary_organization_id uuid,
  p_introducing_representative_id uuid,
  p_referral_id uuid,
  p_redacted_referral_reference text,
  p_offering_id text,
  p_gross_distribution_commission_amount numeric,
  p_currency char(3),
  p_earning_period text,
  p_funded_at date,
  p_distribution_commission_received_at date,
  p_description text,
  p_status app.commission_status default 'draft'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := extensions.gen_random_uuid();
  v_partner_tier app.partner_tier;
  v_partner_organization_id uuid;
  v_allocation_percentage numeric(5, 2);
  v_amount numeric(16, 2);
begin
  if not (
    private.has_platform_role('finance_admin'::app.platform_role)
    or private.has_platform_role('platform_admin'::app.platform_role)
  ) then
    raise exception 'Hunter North finance permission is required';
  end if;
  if p_status not in ('draft', 'approved') then
    raise exception 'New commissions may only be draft or approved';
  end if;
  if p_introducing_representative_id is null
     or p_gross_distribution_commission_amount <= 0
     or p_funded_at is null
     or p_distribution_commission_received_at is null
     or p_funded_at > p_distribution_commission_received_at
     or p_distribution_commission_received_at > current_date
     or length(trim(coalesce(p_redacted_referral_reference, ''))) = 0
     or length(trim(coalesce(p_offering_id, ''))) = 0
     or length(trim(coalesce(p_earning_period, ''))) = 0
     or length(trim(coalesce(p_description, ''))) = 0 then
    raise exception 'Required commission fields are missing';
  end if;

  select account.tier, account.organization_id
  into v_partner_tier, v_partner_organization_id
  from app.partner_accounts account
  where account.user_id = p_introducing_representative_id
    and account.status = 'active';

  if v_partner_tier is null then
    raise exception 'An active partner account is required for commission allocation';
  end if;

  if p_beneficiary_type = 'representative'
     and p_beneficiary_user_id is distinct from p_introducing_representative_id then
    raise exception 'The individual beneficiary must be the introducing representative';
  end if;
  if p_beneficiary_type = 'organization'
     and p_beneficiary_organization_id is distinct from v_partner_organization_id then
    raise exception 'The organization beneficiary must match the partner firm';
  end if;

  v_allocation_percentage := case v_partner_tier
    when 'associate' then 30
    when 'principal' then 40
    when 'managing_partner' then 50
  end;
  v_amount := round(
    p_gross_distribution_commission_amount * v_allocation_percentage / 100,
    2
  );

  insert into app.commission_entries (
    id,
    beneficiary_type,
    beneficiary_user_id,
    beneficiary_organization_id,
    introducing_representative_id,
    referral_id,
    redacted_referral_reference,
    offering_id,
    gross_distribution_commission_amount,
    allocation_percentage,
    tier_at_funding,
    amount,
    currency,
    earning_period,
    funded_at,
    distribution_commission_received_at,
    description,
    status,
    approved_by,
    approved_at,
    created_by
  ) values (
    v_id,
    p_beneficiary_type,
    p_beneficiary_user_id,
    p_beneficiary_organization_id,
    p_introducing_representative_id,
    p_referral_id,
    trim(p_redacted_referral_reference),
    trim(p_offering_id),
    p_gross_distribution_commission_amount,
    v_allocation_percentage,
    v_partner_tier,
    v_amount,
    upper(p_currency),
    trim(p_earning_period),
    p_funded_at,
    p_distribution_commission_received_at,
    trim(p_description),
    p_status,
    case when p_status = 'approved' then auth.uid() else null end,
    case when p_status = 'approved' then now() else null end,
    auth.uid()
  );

  insert into app.audit_events (
    actor_user_id, action, entity_type, entity_id, summary
  ) values (
    auth.uid(),
    'commission.created',
    'commission',
    v_id::text,
    'Fund distribution commission allocated at ' || v_allocation_percentage::text || '%.'
  );
  return v_id;
end;
$$;

create or replace function app.set_commission_status(
  p_commission_id uuid,
  p_status app.commission_status,
  p_payment_reference text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (
    private.has_platform_role('finance_admin'::app.platform_role)
    or private.has_platform_role('platform_admin'::app.platform_role)
  ) then
    raise exception 'Hunter North finance permission is required';
  end if;
  if p_status not in ('approved', 'paid', 'void') then
    raise exception 'Unsupported commission status';
  end if;
  if p_status = 'paid' and length(trim(coalesce(p_payment_reference, ''))) = 0 then
    raise exception 'Paid commissions require a payment reference';
  end if;

  update app.commission_entries
  set
    status = p_status,
    approved_by = case when p_status = 'approved' then auth.uid() else approved_by end,
    approved_at = case when p_status = 'approved' then now() else approved_at end,
    paid_at = case when p_status = 'paid' then now() else paid_at end,
    payment_reference = case when p_status = 'paid' then trim(p_payment_reference) else payment_reference end
  where id = p_commission_id;
  if not found then raise exception 'Commission not found'; end if;

  insert into app.audit_events (
    actor_user_id, action, entity_type, entity_id, summary
  ) values (
    auth.uid(),
    'commission.' || p_status::text,
    'commission',
    p_commission_id::text,
    'Fund distribution commission status changed to ' || p_status::text || '.'
  );
end;
$$;

create or replace function app.create_referral(
  p_client_account_type text,
  p_client_first_name text,
  p_client_last_name text,
  p_client_display_name text,
  p_client_organization text,
  p_client_email text,
  p_client_phone text,
  p_country text,
  p_region text,
  p_city text,
  p_offering_id text,
  p_indicative_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_firm_id uuid;
  v_referral_id uuid := extensions.gen_random_uuid();
begin
  if not private.partner_is_active(v_user_id) then
    raise exception 'An active partner account is required';
  end if;
  if p_client_account_type not in ('individual', 'entity')
     or length(trim(coalesce(p_client_first_name, ''))) = 0
     or length(trim(coalesce(p_client_last_name, ''))) = 0
     or length(trim(coalesce(p_client_email, ''))) = 0
     or length(trim(coalesce(p_country, ''))) = 0 then
    raise exception 'Required referral fields are missing';
  end if;

  select affiliation.organization_id into v_firm_id
  from app.firm_affiliations affiliation
  where affiliation.user_id = v_user_id
    and affiliation.is_primary
    and affiliation.status in ('approved_by_firm', 'approved_by_hnc_fallback')
  order by affiliation.approved_at desc nulls last, affiliation.created_at desc
  limit 1;
  if v_firm_id is null then raise exception 'An approved primary firm is required'; end if;

  insert into app.referrals (
    id,
    owner_user_id,
    firm_id,
    client_account_type,
    client_first_name,
    client_last_name,
    client_display_name,
    client_organization,
    client_email,
    client_phone,
    country,
    region,
    city,
    offering_id,
    indicative_amount,
    status,
    contact_consent_at,
    accuracy_consent_at
  ) values (
    v_referral_id,
    v_user_id,
    v_firm_id,
    p_client_account_type,
    trim(p_client_first_name),
    trim(p_client_last_name),
    trim(p_client_display_name),
    nullif(trim(coalesce(p_client_organization, '')), ''),
    lower(trim(p_client_email)),
    nullif(trim(coalesce(p_client_phone, '')), ''),
    trim(p_country),
    nullif(trim(coalesce(p_region, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(trim(coalesce(p_offering_id, '')), ''),
    p_indicative_amount,
    'introduced',
    now(),
    now()
  );

  insert into app.referral_status_history (
    referral_id, status, changed_by, note
  ) values (
    v_referral_id, 'introduced', v_user_id, 'Referral created by the individual representative.'
  );
  insert into app.audit_events (
    actor_user_id, action, entity_type, entity_id, summary
  ) values (
    v_user_id, 'referral.created', 'referral', v_referral_id::text, 'Individual-owned referral created.'
  );
  return v_referral_id;
end;
$$;

create or replace function app.mark_referral_contacted(p_referral_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if not private.partner_is_active(v_user_id) then
    raise exception 'An active partner account is required';
  end if;
  update app.referrals
  set status = 'contacted'
  where id = p_referral_id
    and owner_user_id = v_user_id
    and status = 'introduced';
  if not found then raise exception 'Referral cannot be marked contacted'; end if;
  insert into app.referral_status_history (
    referral_id, status, changed_by, note
  ) values (
    p_referral_id, 'contacted', v_user_id, 'Contact confirmed by the owning representative.'
  );
end;
$$;

create or replace function app.register_referral_document(
  p_referral_id uuid,
  p_storage_path text,
  p_filename text,
  p_document_category text,
  p_mime_type text,
  p_byte_size bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_user_id uuid;
  v_document_id uuid := extensions.gen_random_uuid();
begin
  select referral.owner_user_id into v_owner_user_id
  from app.referrals referral
  where referral.id = p_referral_id;
  if v_owner_user_id is null then raise exception 'Referral not found'; end if;
  if v_owner_user_id <> v_user_id and not private.is_hunter_admin() then
    raise exception 'Referral document permission is required';
  end if;
  if v_owner_user_id = v_user_id and not private.partner_is_active(v_user_id) then
    raise exception 'An active partner account is required';
  end if;
  if length(trim(coalesce(p_storage_path, ''))) = 0
     or split_part(p_storage_path, '/', 1) <> v_owner_user_id::text then
    raise exception 'Invalid private storage path';
  end if;

  insert into app.document_records (
    id,
    owner_user_id,
    referral_id,
    bucket_id,
    storage_path,
    filename,
    document_category,
    mime_type,
    byte_size,
    access
  ) values (
    v_document_id,
    v_owner_user_id,
    p_referral_id,
    'investor-documents',
    p_storage_path,
    trim(p_filename),
    nullif(trim(coalesce(p_document_category, '')), ''),
    nullif(trim(coalesce(p_mime_type, '')), ''),
    p_byte_size,
    'private_user'
  );
  return v_document_id;
end;
$$;

