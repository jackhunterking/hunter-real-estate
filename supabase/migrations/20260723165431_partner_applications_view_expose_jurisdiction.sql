-- The data-API view must expose the new jurisdiction column, otherwise the
-- portal snapshot read fails and the whole layout 404s. Appended at the end
-- because CREATE OR REPLACE VIEW cannot insert a column mid-list.
create or replace view api.partner_applications with (security_invoker=true) as
 select id,
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
    submitted_at,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at,
    jurisdiction
   from app.partner_applications;
