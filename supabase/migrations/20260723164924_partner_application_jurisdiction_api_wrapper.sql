-- The PostgREST-facing wrapper must forward the new jurisdiction field.
drop function if exists api.submit_partner_application(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text
);

create or replace function api.submit_partner_application(
  p_organization_id uuid, p_registered_first_names text, p_registry_last_name text,
  p_normalized_registry_last_name text, p_jurisdiction text, p_licence_document_number text,
  p_licence_type text, p_professional_title text, p_firm_work_email text,
  p_evidence_storage_path text default null,
  p_new_firm_legal_name text default null, p_new_firm_trading_name text default null,
  p_new_firm_type text default null, p_new_firm_website text default null,
  p_new_firm_business_domain text default null, p_new_firm_spk_registration text default null,
  p_new_firm_registered_address text default null, p_new_firm_authorized_contact text default null,
  p_new_firm_compliance_contact text default null, p_new_firm_evidence_storage_path text default null
) returns uuid language sql set search_path = '' as $$
  select app.submit_partner_application(
    p_organization_id, p_registered_first_names, p_registry_last_name,
    p_normalized_registry_last_name, p_jurisdiction, p_licence_document_number,
    p_licence_type, p_professional_title, p_firm_work_email, p_evidence_storage_path,
    p_new_firm_legal_name, p_new_firm_trading_name, p_new_firm_type,
    p_new_firm_website, p_new_firm_business_domain, p_new_firm_spk_registration,
    p_new_firm_registered_address, p_new_firm_authorized_contact,
    p_new_firm_compliance_contact, p_new_firm_evidence_storage_path
  );
$$;

grant execute on function api.submit_partner_application(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text
) to authenticated;
