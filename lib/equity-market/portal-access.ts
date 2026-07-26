import type {
  InvestorReadinessAssessment,
  PartnerCommissionAllocationPercentage,
  PartnerTier,
} from "./types";
import { PROFESSIONAL_WORKSPACE_ENABLED } from "./feature-flags.ts";

export type PortalWorkspace = "investor" | "professional" | "operations";
export type PreviewPersona = "investor" | "applicant" | "partner" | "firm-admin" | "platform-admin";

export type FirmMembershipRole =
  | "representative"
  | "membership_admin"
  | "finance_admin";

export type OrganizationStatus = "pending" | "active" | "suspended" | "terminated";
export type MembershipStatus = "pending" | "active" | "suspended" | "ended";
export type PartnerApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected";
export type FirmAffiliationStatus =
  | "pending_firm"
  | "approved_by_firm"
  | "approved_by_hnc_fallback"
  | "rejected"
  | "suspended"
  | "ended";
export type LicenseVerificationStatus =
  | "pending"
  | "verified"
  | "mismatch"
  | "not_found"
  | "suspended"
  | "expired"
  | "revoked"
  | "manual_review";
export type PartnerAccountStatus =
  | "pending"
  | "active"
  | "suspended"
  | "expired"
  | "terminated";
export type CommissionStatus = "draft" | "approved" | "paid" | "void";
export type PlatformRole = "master_admin";
export type FirmOfferingStatus =
  | "proposed"
  | "due_diligence"
  | "approved"
  | "on_shelf"
  | "paused";

export type PortalUser = {
  id: string;
  firstName: string;
  middleNames?: string;
  lastName: string;
  displayName: string;
  email: string;
  locale: "en" | "tr";
  emailVerified: boolean;
  accountStatus: "active" | "suspended";
  accountIntent?: "investor" | "turkiye_licensed_professional_or_firm";
  investorAccountType?: "individual" | "entity";
  investorQualificationCategory?: "accredited" | "eligible" | "entity" | "review";
  onboardingStatus?: "pending" | "completed";
  residenceJurisdiction?: string;
  investmentObjective?: string;
  timeHorizon?: string;
  riskAcknowledgedAt?: string;
  contactConsentAt?: string;
  platformRoles: PlatformRole[];
};

export type ProfessionalProfileState =
  | "not_applied"
  | "in_review"
  | "action_required"
  | "approved_pending_activation"
  | "active"
  | "inactive";

export type Organization = {
  id: string;
  legalName: string;
  tradingName?: string;
  firmType: string;
  website?: string;
  businessDomain?: string;
  spkRegistration?: string;
  registeredAddress?: string;
  authorizedContact?: string;
  complianceContact?: string;
  authorizationEvidenceFilename?: string;
  status: OrganizationStatus;
};

export type OrganizationMembership = {
  id: string;
  organizationId: string;
  userId: string;
  roles: FirmMembershipRole[];
  status: MembershipStatus;
  workEmail: string;
  registeredName: string;
  licenceType?: string;
  maskedLicenceNumber?: string;
  verificationStatus: LicenseVerificationStatus;
  requestedAt: string;
  approvedAt?: string;
  endedAt?: string;
};

export type FirmAffiliation = {
  id: string;
  organizationId: string;
  userId: string;
  status: FirmAffiliationStatus;
  primary: boolean;
  approvedBy?: string;
  approvalReason?: string;
  approvedAt?: string;
  endedAt?: string;
};

export type PartnerApplication = {
  id: string;
  userId: string;
  organizationId: string;
  registeredFirstNames: string;
  registryLastName: string;
  normalizedRegistryLastName: string;
  jurisdiction?: string;
  licenceDocumentNumber: string;
  licenceType: string;
  professionalTitle: string;
  firmWorkEmail: string;
  evidenceFilename?: string;
  lookupConsent: boolean;
  accuracyConsent: boolean;
  status: PartnerApplicationStatus;
  submittedAt?: string;
  updatedAt: string;
};

export type LicenseVerificationEvent = {
  id: string;
  applicationId: string;
  userId: string;
  queriedLicenceNumber: string;
  queriedRegistryLastName: string;
  sourceUrl: string;
  result: LicenseVerificationStatus;
  returnedLicenceTypes: string[];
  returnedStatus?: string;
  renewalInformation?: string;
  employmentInformation?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerNotes?: string;
  evidenceFilename?: string;
  verifiedAt: string;
};

export type PartnerAccount = {
  id: string;
  userId: string;
  organizationId: string;
  status: PartnerAccountStatus;
  tier: PartnerTier;
  annualClearedCapital: number;
  relationshipSince?: string;
};

export type OrganizationOfferingAccess = {
  id: string;
  organizationId: string;
  offeringId: string;
  status: FirmOfferingStatus;
  effectiveAt?: string;
  pausedAt?: string;
};

export type CommissionEntry = {
  id: string;
  beneficiaryType: "representative" | "organization";
  beneficiaryUserId?: string;
  beneficiaryOrganizationId?: string;
  introducingRepresentativeId?: string;
  referralId?: string;
  redactedReferralReference: string;
  offeringId: string;
  grossDistributionCommissionAmount: number;
  allocationPercentage: PartnerCommissionAllocationPercentage;
  partnerTier: PartnerTier;
  amount: number;
  currency: string;
  earningPeriod: string;
  fundedAt: string;
  distributionCommissionReceivedAt: string;
  description: string;
  status: CommissionStatus;
  approvedAt?: string;
  paidAt?: string;
  paymentReference?: string;
  fundCommissionScheduleId?: string;
};

export type InvestmentApplication = {
  id: string;
  userId: string;
  offeringId: string;
  /** Invested amount (CAD) = shareQuantity × unit price, or a legacy indicative amount. */
  amount: number;
  /** The subscribed share class (primary class when a single class is on offer). */
  shareClassId?: string;
  /** Whole units the investor indicated intent to subscribe for. Absent on legacy rows. */
  shareQuantity?: number;
  accountType?: "individual" | "entity";
  preferredContactChannel?: "email" | "phone" | "whatsapp";
  contactConsentAt?: string;
  note?: string;
  submittedAt?: string;
  legacySource?: boolean;
  status:
    | "draft"
    | "submitted"
    | "compliance_review"
    | "approved_for_subscription"
    | "accepted"
    | "funded"
    | "declined"
    | "withdrawn"
    | "closed";
  updatedAt: string;
};

export type ReferralRecord = {
  id: string;
  ownerUserId: string;
  firmId: string;
  accountType: "individual" | "entity";
  firstName: string;
  lastName: string;
  displayName: string;
  organization?: string;
  email: string;
  phone?: string;
  country: string;
  region?: string;
  city?: string;
  offeringId?: string;
  indicativeAmount?: number;
  status: "introduced" | "contacted" | "compliance-review" | "accepted" | "funded";
  contactConsentAt: string;
  accuracyConsentAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalDocumentRecord = {
  id: string;
  ownerUserId?: string;
  organizationId?: string;
  partnerApplicationId?: string;
  referralId?: string;
  bucketId: string;
  storagePath: string;
  filename: string;
  mimeType?: string;
  byteSize?: number;
  category?: string;
  access: "private_user" | "approved_partner" | "organization_assigned" | "internal";
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  occurredAt: string;
};

export type PortalDataset = {
  users: PortalUser[];
  organizations: Organization[];
  memberships: OrganizationMembership[];
  affiliations: FirmAffiliation[];
  partnerApplications: PartnerApplication[];
  licenseVerifications: LicenseVerificationEvent[];
  partnerAccounts: PartnerAccount[];
  offeringAccess: OrganizationOfferingAccess[];
  commissions: CommissionEntry[];
  investments: InvestmentApplication[];
  referrals: ReferralRecord[];
  qualificationAssessments: InvestorReadinessAssessment[];
  documents: PortalDocumentRecord[];
  auditEvents: AuditEvent[];
};

export type PortalAccessContext = {
  user: PortalUser;
  dataset: PortalDataset;
};

export const SPL_PUBLIC_SEARCH_URL = "https://lsts.spl.com.tr/bilgi-sorgulama";

export const emptyPortalDataset: PortalDataset = {
  users: [],
  organizations: [],
  memberships: [],
  affiliations: [],
  partnerApplications: [],
  licenseVerifications: [],
  partnerAccounts: [],
  offeringAccess: [],
  commissions: [],
  investments: [],
  referrals: [],
  qualificationAssessments: [],
  documents: [],
  auditEvents: [],
};

export function normalizeRegistrySurname(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");
}

export function maskLicenceNumber(value: string) {
  const clean = value.trim();
  if (clean.length <= 4) return "••••";
  return `${clean.slice(0, 2)}${"•".repeat(Math.max(clean.length - 4, 3))}${clean.slice(-2)}`;
}

export function hasPlatformRole(user: PortalUser, ...roles: PlatformRole[]) {
  // master_admin is a superset: it satisfies every platform-role check.
  if (user.platformRoles.includes("master_admin")) return true;
  return roles.some((role) => user.platformRoles.includes(role));
}

export function membershipForUser(dataset: PortalDataset, userId: string) {
  return dataset.memberships.find(
    (membership) => membership.userId === userId && membership.status === "active",
  );
}

export function organizationForUser(dataset: PortalDataset, userId: string) {
  const membership = membershipForUser(dataset, userId);
  return membership
    ? dataset.organizations.find((organization) => organization.id === membership.organizationId)
    : undefined;
}

export function latestPartnerApplication(dataset: PortalDataset, userId: string) {
  return [...dataset.partnerApplications]
    .filter((application) => application.userId === userId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
}

export function latestLicenseVerification(dataset: PortalDataset, userId: string) {
  return [...dataset.licenseVerifications]
    .filter((verification) => verification.userId === userId)
    .sort((a, b) => Date.parse(b.verifiedAt) - Date.parse(a.verifiedAt))[0];
}

export function partnerActivationIssues({ user, dataset }: PortalAccessContext) {
  const application = latestPartnerApplication(dataset, user.id);
  const verification = latestLicenseVerification(dataset, user.id);
  const affiliation = dataset.affiliations.find(
    (item) =>
      item.userId === user.id &&
      item.primary &&
      (item.status === "approved_by_firm" || item.status === "approved_by_hnc_fallback"),
  );
  const organization = affiliation
    ? dataset.organizations.find((item) => item.id === affiliation.organizationId)
    : undefined;
  const account = dataset.partnerAccounts.find((item) => item.userId === user.id);
  const issues: string[] = [];

  if (user.accountStatus !== "active" || !user.emailVerified) issues.push("investor-account");
  if (application?.status !== "approved") issues.push("partner-application");
  if (verification?.result !== "verified") issues.push("spl-verification");
  if (!affiliation) issues.push("firm-affiliation");
  if (organization?.status !== "active") issues.push("firm-status");
  if (account?.status !== "active") issues.push("partner-account");

  return issues;
}

export function isPartnerActive(context: PortalAccessContext) {
  return partnerActivationIssues(context).length === 0;
}

export function professionalProfileState(
  context: PortalAccessContext,
): ProfessionalProfileState {
  if (isPartnerActive(context)) return "active";

  const account = context.dataset.partnerAccounts.find(
    (item) => item.userId === context.user.id,
  );
  if (
    account?.status === "suspended" ||
    account?.status === "expired" ||
    account?.status === "terminated" ||
    account?.status === "active"
  ) {
    return "inactive";
  }

  const application = latestPartnerApplication(context.dataset, context.user.id);
  if (!application) return "not_applied";
  if (application.status === "draft" || application.status === "changes_requested") {
    return "action_required";
  }
  if (application.status === "rejected") return "action_required";
  if (application.status === "approved") return "approved_pending_activation";
  return "in_review";
}

export function firmRoles(context: PortalAccessContext) {
  return membershipForUser(context.dataset, context.user.id)?.roles ?? [];
}

/**
 * Which workspaces a user may open.
 *
 * A `master_admin` is platform staff and can open all three, because operating
 * the platform means being able to see exactly what each audience sees — an
 * admin who cannot open the professional workspace cannot check what a partner
 * is being shown.
 *
 * This grants VISIBILITY ONLY. It deliberately does not make staff a partner:
 * `isPartnerActive` still requires a real approved application, a verified
 * licence, an active firm affiliation and an active partner account, and that
 * is what commission allocation and firm membership continue to gate on (see
 * `partnerActivationIssues` and `createCommission`). A staff member with no
 * partner account sees the professional screens in their empty state, which is
 * the honest rendering — it is not a claim that they are licensed.
 *
 * Account status and a verified email remain hard requirements for everyone.
 */
export function canUseWorkspace(context: PortalAccessContext, workspace: PortalWorkspace) {
  if (context.user.accountStatus !== "active") return false;
  if (!context.user.emailVerified) return false;
  // The professional / partner "middle layer" is paused this phase. Gate it here,
  // ahead of the master_admin short-circuit, so it is hidden for staff too.
  if (workspace === "professional" && !PROFESSIONAL_WORKSPACE_ENABLED) return false;
  if (hasPlatformRole(context.user, "master_admin")) return true;
  if (workspace === "investor") return true;
  if (workspace === "professional") return isPartnerActive(context);
  return false;
}

export function availableWorkspaces(context: PortalAccessContext): PortalWorkspace[] {
  return (["investor", "professional", "operations"] as const).filter((workspace) =>
    canUseWorkspace(context, workspace),
  );
}

export function canAccessPath(context: PortalAccessContext, pathname: string) {
  if (pathname.endsWith("/home") || pathname.endsWith("/profile") || pathname.includes("/firm")) {
    return availableWorkspaces(context).length > 0;
  }
  if (pathname.includes("/operations") || pathname.includes("/admin")) {
    return canUseWorkspace(context, "operations");
  }
  if (pathname.includes("/resources")) {
    return canUseWorkspace(context, "investor") || canUseWorkspace(context, "professional");
  }
  if (
    pathname.includes("/clients") ||
    pathname.includes("/commissions") ||
    pathname.includes("/professional") ||
    pathname.includes("/partner-program") ||
    (pathname.includes("/partner") && !pathname.includes("/partner/apply"))
  ) {
    return canUseWorkspace(context, "professional");
  }
  return canUseWorkspace(context, "investor");
}

export function defaultPortalPath(context: PortalAccessContext) {
  // Staff land in their normal workspace, not the console: the Admin console is
  // reached deliberately from Profile, never by simply signing in.
  if (canUseWorkspace(context, "professional")) return "/professional";
  return "/portfolio";
}

export function visibleCommissions(context: PortalAccessContext) {
  if (hasPlatformRole(context.user, "master_admin")) {
    return context.dataset.commissions;
  }

  return context.dataset.commissions.filter((entry) => {
    if (entry.status !== "approved" && entry.status !== "paid") return false;
    return entry.beneficiaryType === "representative" && entry.beneficiaryUserId === context.user.id;
  });
}

export function visibleMemberDirectory(context: PortalAccessContext) {
  if (!hasPlatformRole(context.user, "master_admin")) return [];
  return context.dataset.memberships;
}

export function offeringAccessForUser(context: PortalAccessContext) {
  const organization = organizationForUser(context.dataset, context.user.id);
  if (!organization) return [];
  return context.dataset.offeringAccess.filter(
    (access) =>
      access.organizationId === organization.id &&
      (access.status === "approved" || access.status === "on_shelf"),
  );
}
