import "server-only";

import {
  emptyPortalDataset,
  type PortalDataset,
  type PortalUser,
} from "./portal-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PortalSnapshot = {
  user: PortalUser;
  dataset: PortalDataset;
};

function rows<T>(result: { data: T[] | null; error: unknown }) {
  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function loadPortalSnapshot(): Promise<PortalSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const claimsResult = await supabase.auth.getClaims();
  const userId = claimsResult.data?.claims?.sub;
  if (claimsResult.error || !userId) return null;

  const [
    authUserResult,
    profilesResult,
    rolesResult,
    organizationsResult,
    privateOrganizationsResult,
    membershipsResult,
    affiliationsResult,
    applicationsResult,
    verificationsResult,
    accountsResult,
    offeringAccessResult,
    commissionsResult,
    investmentsResult,
    legacyInterestsResult,
    referralsResult,
    documentsResult,
    auditResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("profiles")
      .select("user_id,first_name,middle_names,last_name,display_name,email,locale,account_status,account_intent,investor_account_type,investor_qualification_category,onboarding_status,residence_jurisdiction,investment_objective,time_horizon,risk_acknowledged_at,contact_consent_at"),
    supabase
      .from("platform_role_assignments")
      .select("user_id,role"),
    supabase
      .from("organizations")
      .select("id,legal_name,trading_name,firm_type,website,business_domain,status"),
    supabase
      .from("organization_private_details")
      .select("organization_id,spk_registration,registered_address,authorized_contact,compliance_contact"),
    supabase
      .from("firm_membership_directory")
      .select("id,organization_id,user_id,roles,status,work_email,registered_name,licence_type,masked_licence_number,verification_status,requested_at,approved_at,ended_at"),
    supabase
      .from("firm_affiliations")
      .select("id,organization_id,user_id,status,is_primary,approved_by,approval_reason,approved_at,ended_at"),
    supabase
      .from("partner_applications")
      .select("id,user_id,organization_id,registered_first_names,registry_last_name,normalized_registry_last_name,jurisdiction,licence_document_number,licence_type,professional_title,firm_work_email,evidence_storage_path,lookup_consent_at,accuracy_consent_at,status,submitted_at,updated_at"),
    supabase
      .from("license_verification_events")
      .select("id,application_id,user_id,queried_licence_number,queried_registry_last_name,source_url,result,returned_licence_types,returned_status,renewal_information,employment_information,reviewer_id,reviewer_notes,evidence_storage_path,verified_at"),
    supabase
      .from("partner_accounts")
      .select("id,user_id,organization_id,status,tier,annual_cleared_capital,relationship_since"),
    supabase
      .from("organization_offering_access")
      .select("id,organization_id,offering_id,status,effective_at,paused_at"),
    supabase
      .from("commission_entries")
      .select("id,beneficiary_type,beneficiary_user_id,beneficiary_organization_id,redacted_referral_reference,offering_id,gross_distribution_commission_amount,allocation_percentage,tier_at_funding,amount,currency,earning_period,funded_at,distribution_commission_received_at,status,approved_at,paid_at,payment_reference,fund_commission_schedule_id"),
    supabase
      .from("investment_applications")
      .select("id,user_id,offering_id,amount,account_type,preferred_contact_channel,contact_consent_at,note,submitted_at,status,updated_at"),
    supabase
      .from("investment_interest_requests")
      .select("id,user_id,offering_id,status,preferred_channel,message,created_at,updated_at"),
    supabase
      .from("referrals")
      .select("id,owner_user_id,firm_id,client_account_type,client_first_name,client_last_name,client_display_name,client_organization,client_email,client_phone,country,region,city,offering_id,indicative_amount,status,contact_consent_at,accuracy_consent_at,created_at,updated_at"),
    supabase
      .from("document_records")
      .select("id,owner_user_id,organization_id,partner_application_id,referral_id,bucket_id,storage_path,filename,document_category,mime_type,byte_size,access,created_at"),
    supabase
      .from("audit_events")
      .select("id,actor_user_id,action,entity_type,entity_id,summary,occurred_at"),
  ]);

  const profiles = rows(profilesResult);
  const roleRows = rows(rolesResult);
  const users: PortalUser[] = profiles.map((profile) => ({
    id: profile.user_id,
    firstName: profile.first_name,
    middleNames: profile.middle_names ?? undefined,
    lastName: profile.last_name,
    displayName: profile.display_name || `${profile.first_name} ${profile.last_name}`.trim(),
    email: profile.email,
    locale: profile.locale === "en" ? "en" : "tr",
    emailVerified: Boolean(authUserResult.data.user?.email_confirmed_at) || profile.user_id !== userId,
    accountStatus: profile.account_status === "suspended" ? "suspended" : "active",
    accountIntent: profile.account_intent ?? undefined,
    investorAccountType: profile.investor_account_type ?? undefined,
    investorQualificationCategory:
      (profile.investor_qualification_category as PortalUser["investorQualificationCategory"]) ?? undefined,
    onboardingStatus: profile.onboarding_status,
    residenceJurisdiction: profile.residence_jurisdiction ?? undefined,
    investmentObjective: profile.investment_objective ?? undefined,
    timeHorizon: profile.time_horizon ?? undefined,
    riskAcknowledgedAt: profile.risk_acknowledged_at ?? undefined,
    contactConsentAt: profile.contact_consent_at ?? undefined,
    platformRoles: roleRows
      .filter((role) => role.user_id === profile.user_id)
      .map((role) => role.role),
  }));
  const currentProfile = users.find((user) => user.id === userId);
  if (!currentProfile) return null;

  const privateByOrganization = new Map(
    rows(privateOrganizationsResult).map((item) => [item.organization_id, item]),
  );
  const dataset: PortalDataset = {
    ...emptyPortalDataset,
    users,
    organizations: rows(organizationsResult).map((organization) => {
      const privateDetails = privateByOrganization.get(organization.id);
      return {
        id: organization.id,
        legalName: organization.legal_name,
        tradingName: organization.trading_name ?? undefined,
        firmType: organization.firm_type,
        website: organization.website ?? undefined,
        businessDomain: organization.business_domain ?? undefined,
        spkRegistration: privateDetails?.spk_registration ?? undefined,
        registeredAddress: privateDetails?.registered_address ?? undefined,
        authorizedContact: privateDetails?.authorized_contact ?? undefined,
        complianceContact: privateDetails?.compliance_contact ?? undefined,
        status: organization.status,
      };
    }),
    memberships: rows(membershipsResult).map((membership) => ({
      id: membership.id,
      organizationId: membership.organization_id,
      userId: membership.user_id,
      roles: membership.roles,
      status: membership.status,
      workEmail: membership.work_email,
      registeredName: membership.registered_name,
      licenceType: membership.licence_type ?? undefined,
      maskedLicenceNumber: membership.masked_licence_number ?? undefined,
      verificationStatus: membership.verification_status,
      requestedAt: membership.requested_at,
      approvedAt: membership.approved_at ?? undefined,
      endedAt: membership.ended_at ?? undefined,
    })),
    affiliations: rows(affiliationsResult).map((affiliation) => ({
      id: affiliation.id,
      organizationId: affiliation.organization_id,
      userId: affiliation.user_id,
      status: affiliation.status,
      primary: affiliation.is_primary,
      approvedBy: affiliation.approved_by ?? undefined,
      approvalReason: affiliation.approval_reason ?? undefined,
      approvedAt: affiliation.approved_at ?? undefined,
      endedAt: affiliation.ended_at ?? undefined,
    })),
    partnerApplications: rows(applicationsResult).map((application) => ({
      id: application.id,
      userId: application.user_id,
      organizationId: application.organization_id,
      registeredFirstNames: application.registered_first_names,
      registryLastName: application.registry_last_name,
      normalizedRegistryLastName: application.normalized_registry_last_name,
      jurisdiction: application.jurisdiction ?? undefined,
      licenceDocumentNumber: application.licence_document_number,
      licenceType: application.licence_type,
      professionalTitle: application.professional_title,
      firmWorkEmail: application.firm_work_email,
      evidenceFilename: application.evidence_storage_path?.split("/").at(-1),
      lookupConsent: Boolean(application.lookup_consent_at),
      accuracyConsent: Boolean(application.accuracy_consent_at),
      status: application.status,
      submittedAt: application.submitted_at ?? undefined,
      updatedAt: application.updated_at,
    })),
    licenseVerifications: rows(verificationsResult).map((verification) => ({
      id: verification.id,
      applicationId: verification.application_id,
      userId: verification.user_id,
      queriedLicenceNumber: verification.queried_licence_number,
      queriedRegistryLastName: verification.queried_registry_last_name,
      sourceUrl: verification.source_url,
      result: verification.result,
      returnedLicenceTypes: verification.returned_licence_types,
      returnedStatus: verification.returned_status ?? undefined,
      renewalInformation: verification.renewal_information ?? undefined,
      employmentInformation: verification.employment_information ?? undefined,
      reviewerId: verification.reviewer_id,
      reviewerName: users.find((user) => user.id === verification.reviewer_id)?.displayName,
      reviewerNotes: verification.reviewer_notes ?? undefined,
      evidenceFilename: verification.evidence_storage_path?.split("/").at(-1),
      verifiedAt: verification.verified_at,
    })),
    partnerAccounts: rows(accountsResult).map((account) => ({
      id: account.id,
      userId: account.user_id,
      organizationId: account.organization_id,
      status: account.status,
      tier: account.tier === "managing_partner" ? "managingPartner" : account.tier,
      annualClearedCapital: Number(account.annual_cleared_capital),
      relationshipSince: account.relationship_since ?? undefined,
    })),
    offeringAccess: rows(offeringAccessResult).map((access) => ({
      id: access.id,
      organizationId: access.organization_id,
      offeringId: access.offering_id,
      status: access.status,
      effectiveAt: access.effective_at ?? undefined,
      pausedAt: access.paused_at ?? undefined,
    })),
    commissions: rows(commissionsResult).map((commission) => ({
      id: commission.id,
      beneficiaryType: commission.beneficiary_type,
      beneficiaryUserId: commission.beneficiary_user_id ?? undefined,
      beneficiaryOrganizationId: commission.beneficiary_organization_id ?? undefined,
      redactedReferralReference: commission.redacted_referral_reference,
      offeringId: commission.offering_id,
      grossDistributionCommissionAmount: Number(
        commission.gross_distribution_commission_amount,
      ),
      allocationPercentage: Number(commission.allocation_percentage) as 30 | 40 | 50,
      partnerTier:
        commission.tier_at_funding === "managing_partner"
          ? "managingPartner"
          : commission.tier_at_funding,
      amount: Number(commission.amount),
      currency: commission.currency,
      earningPeriod: commission.earning_period,
      fundedAt: commission.funded_at,
      distributionCommissionReceivedAt: commission.distribution_commission_received_at,
      description: "",
      status: commission.status,
      approvedAt: commission.approved_at ?? undefined,
      paidAt: commission.paid_at ?? undefined,
      paymentReference: commission.payment_reference ?? undefined,
      fundCommissionScheduleId: commission.fund_commission_schedule_id ?? undefined,
    })),
    investments: [
      ...rows(investmentsResult).map((investment) => ({
      id: investment.id,
      userId: investment.user_id,
      offeringId: investment.offering_id,
      amount: Number(investment.amount),
      accountType: investment.account_type ?? undefined,
      preferredContactChannel: investment.preferred_contact_channel ?? undefined,
      contactConsentAt: investment.contact_consent_at ?? undefined,
      note: investment.note ?? undefined,
      submittedAt: investment.submitted_at ?? undefined,
      status: investment.status,
      updatedAt: investment.updated_at,
      })),
      ...rows(legacyInterestsResult).map((interest) => ({
        id: `legacy-interest:${interest.id}`,
        userId: interest.user_id,
        offeringId: interest.offering_id,
        amount: 0,
        preferredContactChannel: interest.preferred_channel,
        note: interest.message ?? undefined,
        submittedAt: interest.created_at,
        status: interest.status === "new" ? "submitted" as const : interest.status === "closed" ? "closed" as const : "compliance_review" as const,
        updatedAt: interest.updated_at,
        legacySource: true,
      })),
    ],
    referrals: rows(referralsResult).map((referral) => ({
      id: referral.id,
      ownerUserId: referral.owner_user_id,
      firmId: referral.firm_id,
      accountType: referral.client_account_type,
      firstName: referral.client_first_name,
      lastName: referral.client_last_name,
      displayName: referral.client_display_name,
      organization: referral.client_organization ?? undefined,
      email: referral.client_email,
      phone: referral.client_phone ?? undefined,
      country: referral.country,
      region: referral.region ?? undefined,
      city: referral.city ?? undefined,
      offeringId: referral.offering_id ?? undefined,
      indicativeAmount:
        referral.indicative_amount === null ? undefined : Number(referral.indicative_amount),
      status: referral.status,
      contactConsentAt: referral.contact_consent_at,
      accuracyConsentAt: referral.accuracy_consent_at,
      createdAt: referral.created_at,
      updatedAt: referral.updated_at,
    })),
    // referral_qualification_assessments was removed by the lean partner-program
    // migration; the portal no longer sources qualification data from it.
    qualificationAssessments: [],
    documents: rows(documentsResult).map((document) => ({
      id: document.id,
      ownerUserId: document.owner_user_id ?? undefined,
      organizationId: document.organization_id ?? undefined,
      partnerApplicationId: document.partner_application_id ?? undefined,
      referralId: document.referral_id ?? undefined,
      bucketId: document.bucket_id,
      storagePath: document.storage_path,
      filename: document.filename,
      category: document.document_category ?? undefined,
      mimeType: document.mime_type ?? undefined,
      byteSize: document.byte_size === null ? undefined : Number(document.byte_size),
      access: document.access,
      createdAt: document.created_at,
    })),
    auditEvents: rows(auditResult).map((event) => ({
      id: event.id,
      actorUserId: event.actor_user_id,
      action: event.action,
      entityType: event.entity_type,
      entityId: event.entity_id,
      summary: event.summary,
      occurredAt: event.occurred_at,
    })),
  };

  return { user: currentProfile, dataset };
}
