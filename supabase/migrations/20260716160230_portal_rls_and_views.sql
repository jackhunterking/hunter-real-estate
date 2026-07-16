create policy "profiles_select_own_or_hunter"
on app.profiles for select to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_hunter_admin())
);

create policy "profiles_update_own"
on app.profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "platform_roles_self_select_with_mfa"
on app.platform_role_assignments for select to authenticated
using (
  (
    user_id = (select auth.uid())
    and (select private.has_mfa())
  )
  or (select private.has_platform_role('platform_admin'))
);

create policy "platform_roles_platform_admin_write"
on app.platform_role_assignments for all to authenticated
using ((select private.has_platform_role('platform_admin')))
with check ((select private.has_platform_role('platform_admin')));

create policy "organizations_directory_or_related"
on app.organizations for select to authenticated
using (
  status = 'active'
  or (select private.is_active_org_member(id))
  or created_by = (select auth.uid())
  or (select private.is_hunter_admin())
);

create policy "organizations_create_pending"
on app.organizations for insert to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'pending'
);

create policy "organizations_hunter_update"
on app.organizations for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "organization_private_details_admin"
on app.organization_private_details for select to authenticated
using (
  (select private.has_org_role(
    organization_id,
    array['membership_admin'::app.firm_membership_role]
  ))
  or (select private.is_hunter_admin())
);

create policy "organization_private_details_hunter_write"
on app.organization_private_details for all to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "memberships_select_private_directory"
on app.organization_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_org_role(
    organization_id,
    array['membership_admin'::app.firm_membership_role]
  ))
  or (select private.is_hunter_admin())
);

create policy "memberships_request_own"
on app.organization_memberships for insert to authenticated
with check (
  user_id = (select auth.uid())
  and roles = array['representative'::app.firm_membership_role]
  and status = 'pending'
);

create policy "memberships_admin_decision"
on app.organization_memberships for update to authenticated
using (
  (select private.has_org_role(
    organization_id,
    array['membership_admin'::app.firm_membership_role]
  ))
  or (select private.is_hunter_admin())
)
with check (
  (select private.has_org_role(
    organization_id,
    array['membership_admin'::app.firm_membership_role]
  ))
  or (select private.is_hunter_admin())
);

create policy "affiliations_select_own_firm_admin_or_hunter"
on app.firm_affiliations for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_org_role(
    organization_id,
    array['membership_admin'::app.firm_membership_role]
  ))
  or (select private.is_hunter_admin())
);

create policy "affiliations_request_own"
on app.firm_affiliations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending_firm'
);

create policy "affiliations_decision"
on app.firm_affiliations for update to authenticated
using (
  (select private.has_org_role(
    organization_id,
    array['membership_admin'::app.firm_membership_role]
  ))
  or (select private.is_hunter_admin())
)
with check (
  (select private.has_org_role(
    organization_id,
    array['membership_admin'::app.firm_membership_role]
  ))
  or (select private.is_hunter_admin())
);

create policy "partner_applications_select_own_or_hunter"
on app.partner_applications for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_hunter_admin())
);

create policy "partner_applications_create_own"
on app.partner_applications for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted')
);

create policy "partner_applications_update_own_preapproval"
on app.partner_applications for update to authenticated
using (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted', 'changes_requested')
)
with check (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted', 'changes_requested')
);

create policy "partner_applications_hunter_update"
on app.partner_applications for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "credentials_select_own_or_hunter"
on app.regulatory_credentials for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_hunter_admin())
);

create policy "credentials_hunter_write"
on app.regulatory_credentials for all to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "verification_events_select_own_or_hunter"
on app.license_verification_events for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_hunter_admin())
);

create policy "verification_events_hunter_insert"
on app.license_verification_events for insert to authenticated
with check ((select private.is_hunter_admin()));

create policy "partner_accounts_select_owner_or_hunter"
on app.partner_accounts for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_hunter_admin())
);

create policy "partner_accounts_hunter_write"
on app.partner_accounts for all to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "offering_access_active_members"
on app.organization_offering_access for select to authenticated
using (
  (
    (select private.has_org_role(
      organization_id,
      array[
        'membership_admin'::app.firm_membership_role,
        'finance_admin'::app.firm_membership_role
      ]
    ))
    or (
      (select private.is_active_org_member(organization_id))
      and (select private.partner_is_active((select auth.uid())))
    )
  )
  or (select private.is_hunter_admin())
);

create policy "offering_access_hunter_write"
on app.organization_offering_access for all to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "referrals_owner_or_hunter_select"
on app.referrals for select to authenticated
using (
  (
    owner_user_id = (select auth.uid())
    and (select private.partner_is_active((select auth.uid())))
  )
  or (select private.is_hunter_admin())
);

create policy "referrals_owner_insert"
on app.referrals for insert to authenticated
with check (
  owner_user_id = (select auth.uid())
  and (select private.partner_is_active((select auth.uid())))
  and exists (
    select 1
    from app.firm_affiliations affiliation
    where affiliation.user_id = (select auth.uid())
      and affiliation.organization_id = firm_id
      and affiliation.is_primary
      and affiliation.status in ('approved_by_firm', 'approved_by_hnc_fallback')
  )
);

create policy "referrals_owner_or_hunter_update"
on app.referrals for update to authenticated
using (
  (
    owner_user_id = (select auth.uid())
    and (select private.partner_is_active((select auth.uid())))
  )
  or (select private.is_hunter_admin())
)
with check (
  (
    owner_user_id = (select auth.uid())
    and (select private.partner_is_active((select auth.uid())))
  )
  or (select private.is_hunter_admin())
);

create policy "referral_history_owner_or_hunter_select"
on app.referral_status_history for select to authenticated
using (
  exists (
    select 1
    from app.referrals referral
    where referral.id = referral_id
      and referral.owner_user_id = (select auth.uid())
  )
  or (select private.is_hunter_admin())
);

create policy "referral_history_owner_or_hunter_insert"
on app.referral_status_history for insert to authenticated
with check (
  changed_by = (select auth.uid())
  and (
    exists (
      select 1
      from app.referrals referral
      where referral.id = referral_id
        and referral.owner_user_id = (select auth.uid())
    )
    or (select private.is_hunter_admin())
  )
);

create policy "investments_owner_or_hunter_select"
on app.investment_applications for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_hunter_admin())
);

create policy "investments_owner_create"
on app.investment_applications for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted')
);

create policy "investments_owner_update_preapproval"
on app.investment_applications for update to authenticated
using (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted')
)
with check (
  user_id = (select auth.uid())
  and status in ('draft', 'submitted')
);

create policy "investments_hunter_update"
on app.investment_applications for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "commissions_beneficiary_or_hunter_select"
on app.commission_entries for select to authenticated
using (
  (select private.has_platform_role('finance_admin'))
  or (select private.has_platform_role('platform_admin'))
  or (
    status in ('approved', 'paid')
    and beneficiary_type = 'representative'
    and beneficiary_user_id = (select auth.uid())
    and (select private.partner_is_active((select auth.uid())))
  )
  or (
    status in ('approved', 'paid')
    and beneficiary_type = 'organization'
    and (select private.has_org_role(
      beneficiary_organization_id,
      array['finance_admin'::app.firm_membership_role]
    ))
  )
);

create policy "commissions_hunter_write"
on app.commission_entries for all to authenticated
using (
  (select private.has_platform_role('finance_admin'))
  or (select private.has_platform_role('platform_admin'))
)
with check (
  (select private.has_platform_role('finance_admin'))
  or (select private.has_platform_role('platform_admin'))
);

create policy "documents_owner_org_or_hunter_select"
on app.document_records for select to authenticated
using (
  owner_user_id = (select auth.uid())
  or (
    organization_id is not null
    and access = 'organization_assigned'
    and (
      (select private.has_org_role(
        organization_id,
        array[
          'membership_admin'::app.firm_membership_role,
          'finance_admin'::app.firm_membership_role
        ]
      ))
      or (
        (select private.is_active_org_member(organization_id))
        and (select private.partner_is_active((select auth.uid())))
      )
    )
  )
  or (select private.is_hunter_admin())
);

create policy "documents_owner_insert"
on app.document_records for insert to authenticated
with check (
  owner_user_id = (select auth.uid())
  and access = 'private_user'
);

create policy "documents_hunter_write"
on app.document_records for all to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));

create policy "audit_hunter_select"
on app.audit_events for select to authenticated
using ((select private.is_hunter_admin()));

create policy "audit_hunter_insert"
on app.audit_events for insert to authenticated
with check ((select private.is_hunter_admin()));

create view app.firm_membership_directory
with (security_invoker = true)
as
select
  membership.id,
  membership.organization_id,
  membership.user_id,
  membership.registered_name,
  membership.work_email,
  membership.licence_type,
  membership.masked_licence_number,
  membership.verification_status,
  membership.status,
  membership.roles,
  membership.requested_at,
  membership.approved_at,
  membership.ended_at
from app.organization_memberships membership;

create view app.firm_commission_directory
with (security_invoker = true)
as
select
  commission.id,
  commission.beneficiary_organization_id as organization_id,
  commission.redacted_referral_reference,
  commission.offering_id,
  commission.gross_distribution_commission_amount,
  commission.allocation_percentage,
  commission.tier_at_funding,
  commission.amount,
  commission.currency,
  commission.earning_period,
  commission.funded_at,
  commission.distribution_commission_received_at,
  commission.status,
  commission.approved_at,
  commission.paid_at,
  commission.payment_reference
from app.commission_entries commission
where commission.beneficiary_type = 'organization';

create view app.partner_access_status
with (security_invoker = true)
as
select
  profile.user_id,
  application.status as partner_application_status,
  verification.result as license_verification_status,
  affiliation.status as firm_affiliation_status,
  organization.status as organization_status,
  account.status as partner_account_status,
  private.partner_is_active(profile.user_id) as partner_is_active
from app.profiles profile
left join lateral (
  select item.status
  from app.partner_applications item
  where item.user_id = profile.user_id
  order by item.updated_at desc, item.id desc
  limit 1
) application on true
left join lateral (
  select item.result
  from app.license_verification_events item
  where item.user_id = profile.user_id
  order by item.verified_at desc, item.id desc
  limit 1
) verification on true
left join lateral (
  select item.organization_id, item.status
  from app.firm_affiliations item
  where item.user_id = profile.user_id
    and item.is_primary
  order by item.created_at desc, item.id desc
  limit 1
) affiliation on true
left join app.organizations organization
  on organization.id = affiliation.organization_id
left join app.partner_accounts account
  on account.user_id = profile.user_id;

