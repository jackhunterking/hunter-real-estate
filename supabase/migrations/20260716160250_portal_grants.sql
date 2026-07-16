revoke execute on function app.submit_partner_application(
  uuid, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, text
) from public;
revoke execute on function app.decide_firm_membership(uuid, text, text, text) from public;
revoke execute on function app.record_license_verification(
  uuid, app.license_verification_status, text[], text, text, text, text, text
) from public;
revoke execute on function app.decide_organization(
  uuid, app.organization_status, text
) from public;
revoke execute on function app.assign_firm_membership_roles(
  uuid, app.firm_membership_role[], text
) from public;
revoke execute on function app.create_commission_entry(
  app.commission_beneficiary_type, uuid, uuid, uuid, uuid, text, text, numeric, char, text, date, date, text, app.commission_status
) from public;
revoke execute on function app.set_commission_status(
  uuid, app.commission_status, text
) from public;
revoke execute on function app.create_referral(
  text, text, text, text, text, text, text, text, text, text, text, numeric
) from public;
revoke execute on function app.mark_referral_contacted(uuid) from public;
revoke execute on function app.register_referral_document(
  uuid, text, text, text, text, bigint
) from public;

revoke all on all tables in schema app from anon, authenticated;
revoke all on all sequences in schema app from anon, authenticated;

grant select, update on app.profiles to authenticated;
grant select on app.platform_role_assignments to authenticated;
grant select on app.organizations to authenticated;
grant select on app.organization_private_details to authenticated;
grant select on app.organization_memberships to authenticated;
grant select on app.firm_affiliations to authenticated;
grant select on app.partner_applications to authenticated;
grant select on app.regulatory_credentials to authenticated;
grant select on app.license_verification_events to authenticated;
grant select on app.partner_accounts to authenticated;
grant select, insert, update on app.organization_offering_access to authenticated;
grant select on app.referrals to authenticated;
grant select on app.referral_status_history to authenticated;
grant select, insert, update on app.investment_applications to authenticated;
grant select (
  id,
  beneficiary_type,
  beneficiary_user_id,
  beneficiary_organization_id,
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
  status,
  approved_at,
  paid_at,
  payment_reference,
  created_at,
  updated_at
) on app.commission_entries to authenticated;
grant select on app.document_records to authenticated;
grant select on app.audit_events to authenticated;
grant select on app.firm_membership_directory to authenticated;
grant select on app.firm_commission_directory to authenticated;
grant select on app.partner_access_status to authenticated;
grant execute on function app.submit_partner_application(
  uuid, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, text
) to authenticated;
grant execute on function app.decide_firm_membership(uuid, text, text, text) to authenticated;
grant execute on function app.record_license_verification(
  uuid, app.license_verification_status, text[], text, text, text, text, text
) to authenticated;
grant execute on function app.decide_organization(
  uuid, app.organization_status, text
) to authenticated;
grant execute on function app.assign_firm_membership_roles(
  uuid, app.firm_membership_role[], text
) to authenticated;
grant execute on function app.create_commission_entry(
  app.commission_beneficiary_type, uuid, uuid, uuid, uuid, text, text, numeric, char, text, date, date, text, app.commission_status
) to authenticated;
grant execute on function app.set_commission_status(
  uuid, app.commission_status, text
) to authenticated;
grant execute on function app.create_referral(
  text, text, text, text, text, text, text, text, text, text, text, numeric
) to authenticated;
grant execute on function app.mark_referral_contacted(uuid) to authenticated;
grant execute on function app.register_referral_document(
  uuid, text, text, text, text, bigint
) to authenticated;
grant usage, select on all sequences in schema app to authenticated;

grant all on all tables in schema app to service_role;
grant all on all sequences in schema app to service_role;
