"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  canAccessPath,
  canUseWorkspace,
  latestLicenseVerification,
  latestPartnerApplication,
  maskLicenceNumber,
  membershipForUser,
  normalizeRegistrySurname,
  organizationForUser,
  partnerActivationIssues,
  visibleCommissions,
  visibleMemberDirectory,
  type CommissionEntry,
  type FirmMembershipRole,
  type FirmAffiliationStatus,
  type LicenseVerificationStatus,
  type Organization,
  type PartnerApplication,
  type PortalAccessContext as AccessContext,
  emptyPortalDataset,
  type PortalDataset,
  type PortalUser,
  type PreviewPersona,
} from "@/lib/capital/portal-access";
import { calculateFundDistributionCommission } from "@/lib/capital/commissions";

/**
 * Neutral placeholder used only in dev-preview mode (no Supabase session).
 * Production always has a real snapshot, so this never ships to a tenant. It
 * carries no realistic PII and no roles — the portal shows the empty investor
 * experience.
 */
const PREVIEW_PLACEHOLDER_USER: PortalUser = {
  id: "preview",
  firstName: "Preview",
  lastName: "",
  displayName: "Preview",
  email: "preview@localhost",
  locale: "en",
  emailVerified: true,
  accountStatus: "active",
  accountIntent: "investor",
  investorAccountType: "individual",
  onboardingStatus: "completed",
  platformRoles: [],
};
import { portalRequest } from "@/lib/capital/portal-client";

export type PartnerApplicationInput = {
  firmName: string;
  registeredFirstNames: string;
  registryLastName: string;
  licenceDocumentNumber: string;
  licenceType: string;
  professionalTitle: string;
  firmWorkEmail: string;
  lookupConsent: boolean;
  accuracyConsent: boolean;
};

export type LicenseVerificationInput = {
  result: LicenseVerificationStatus;
  returnedLicenceTypes: string[];
  returnedStatus?: string;
  renewalInformation?: string;
  employmentInformation?: string;
  reviewerNotes?: string;
  evidenceFilename?: string;
};

export type NewCommissionInput = Omit<
  CommissionEntry,
  | "id"
  | "partnerTier"
  | "allocationPercentage"
  | "amount"
  | "status"
  | "approvedAt"
  | "paidAt"
  | "paymentReference"
> & {
  introducingRepresentativeId: string;
  status?: CommissionEntry["status"];
};

export type PortalAccountView = "investor" | "professional";

type PortalAccessValue = {
  dataset: PortalDataset;
  currentUser: PortalUser;
  context: AccessContext;
  previewPersona: PreviewPersona;
  previewEnabled: boolean;
  backendConfigured: boolean;
  currentApplication?: PartnerApplication;
  currentVerification: ReturnType<typeof latestLicenseVerification>;
  currentMembership: ReturnType<typeof membershipForUser>;
  currentOrganization: ReturnType<typeof organizationForUser>;
  activationIssues: string[];
  commissions: CommissionEntry[];
  memberDirectory: ReturnType<typeof visibleMemberDirectory>;
  accountView: PortalAccountView;
  setAccountView: (view: PortalAccountView) => void;
  setPreviewPersona: (persona: PreviewPersona) => void;
  canAccess: (pathname: string) => boolean;
  submitPartnerApplication: (input: PartnerApplicationInput) => Promise<string>;
  decideMembership: (
    membershipId: string,
    decision: "approve" | "reject" | "suspend",
    fallbackReason?: string,
    evidenceStoragePath?: string,
  ) => Promise<void>;
  decideOrganization: (
    organizationId: string,
    status: Organization["status"],
    reason: string,
  ) => Promise<void>;
  assignMembershipRoles: (
    membershipId: string,
    roles: FirmMembershipRole[],
    reason: string,
  ) => Promise<void>;
  recordLicenseVerification: (
    applicationId: string,
    input: LicenseVerificationInput,
  ) => Promise<void>;
  createCommission: (input: NewCommissionInput) => Promise<void>;
  markCommissionPaid: (commissionId: string, paymentReference: string) => Promise<void>;
  updateCommissionStatus: (
    commissionId: string,
    status: "approved" | "void",
  ) => Promise<void>;
};

const PortalAccessContext = createContext<PortalAccessValue | null>(null);

function timestamp() {
  return new Date().toISOString();
}

function copyDataset(dataset: PortalDataset): PortalDataset {
  return {
    ...dataset,
    users: [...dataset.users],
    organizations: [...dataset.organizations],
    memberships: [...dataset.memberships],
    affiliations: [...dataset.affiliations],
    partnerApplications: [...dataset.partnerApplications],
    licenseVerifications: [...dataset.licenseVerifications],
    partnerAccounts: [...dataset.partnerAccounts],
    offeringAccess: [...dataset.offeringAccess],
    commissions: [...dataset.commissions],
    investments: [...dataset.investments],
    referrals: [...dataset.referrals],
    qualificationAssessments: [...dataset.qualificationAssessments],
    documents: [...dataset.documents],
    auditEvents: [...dataset.auditEvents],
  };
}

export function PortalAccessProvider({
  children,
  initialDataset = emptyPortalDataset,
  initialUser,
  previewEnabled = true,
  backendConfigured = false,
}: {
  children: React.ReactNode;
  initialDataset?: PortalDataset;
  initialUser?: PortalUser;
  previewEnabled?: boolean;
  backendConfigured?: boolean;
}) {
  const [dataset, setDataset] = useState<PortalDataset>(() => copyDataset(initialDataset));
  const [previewPersona, setPreviewPersonaState] = useState<PreviewPersona>("investor");
  const [accountView, setAccountViewState] = useState<PortalAccountView>("investor");

  useEffect(() => {
    if (!previewEnabled) return;
    try {
      const savedPersona = window.localStorage.getItem("hnc-preview-persona") as PreviewPersona | null;
      if (savedPersona) setPreviewPersonaState(savedPersona);
    } catch {
      // Preview state remains deterministic when local storage is unavailable.
    }
  }, [previewEnabled]);

  const currentUser = initialUser ?? PREVIEW_PLACEHOLDER_USER;
  const context = useMemo(() => ({ user: currentUser, dataset }), [currentUser, dataset]);

  useEffect(() => {
    if (previewEnabled) {
      setAccountViewState(previewPersona === "investor" ? "investor" : "professional");
      return;
    }

    let saved: PortalAccountView | null = null;
    try {
      const stored = window.localStorage.getItem("hnc-account-view");
      if (stored === "investor" || stored === "professional") saved = stored;
    } catch {
      // Use the authorized default when storage is unavailable.
    }
    if (saved && canUseWorkspace(context, saved)) {
      setAccountViewState(saved);
      return;
    }
    setAccountViewState(canUseWorkspace(context, "professional") ? "professional" : "investor");
  }, [context, previewEnabled, previewPersona]);

  function setPreviewPersona(persona: PreviewPersona) {
    if (!previewEnabled) return;
    setPreviewPersonaState(persona);
    try {
      window.localStorage.setItem("hnc-preview-persona", persona);
    } catch {
      // Preview still changes for the active visit.
    }
  }

  function setAccountView(view: PortalAccountView) {
    if (previewEnabled) {
      setAccountViewState(view);
      setPreviewPersona(view === "investor" ? "investor" : "partner");
    } else {
      if (!canUseWorkspace(context, view)) return;
      setAccountViewState(view);
    }
    try {
      window.localStorage.setItem("hnc-account-view", view);
    } catch {
      // The selection remains active for this visit.
    }
  }

  async function persistPortalAction(
    action: string,
    payload: Record<string, unknown>,
  ) {
    return portalRequest(action, payload);
  }

  async function submitPartnerApplication(input: PartnerApplicationInput) {
    if (
      !input.registeredFirstNames.trim() ||
      !input.registryLastName.trim() ||
      !input.licenceDocumentNumber.trim() ||
      !input.licenceType.trim() ||
      !input.professionalTitle.trim() ||
      !input.firmName.trim() ||
      !input.firmWorkEmail.trim() ||
      !input.lookupConsent ||
      !input.accuracyConsent
    ) {
      throw new Error("Required partner application fields are missing.");
    }
    if (backendConfigured) {
      const data = await persistPortalAction("submitPartnerApplication", {
        firmName: input.firmName.trim(),
        registeredFirstNames: input.registeredFirstNames.trim(),
        registryLastName: input.registryLastName.trim(),
        normalizedRegistryLastName: normalizeRegistrySurname(input.registryLastName),
        licenceDocumentNumber: input.licenceDocumentNumber.trim(),
        licenceType: input.licenceType.trim(),
        professionalTitle: input.professionalTitle.trim(),
        firmWorkEmail: input.firmWorkEmail.trim().toLocaleLowerCase("en"),
      });
      window.location.reload();
      return String(data);
    }
    const now = timestamp();
    const applicationId = `application-${Date.now()}`;
    let organizationId: string | undefined;
    setDataset((current) => {
      const next = copyDataset(current);
      const normalizedFirmName = input.firmName.trim().toLocaleLowerCase("en");
      organizationId = next.organizations.find(
        (organization) =>
          organization.legalName.trim().toLocaleLowerCase("en") === normalizedFirmName,
      )?.id;
      if (!organizationId) {
        organizationId = `org-${Date.now()}`;
        next.organizations.unshift({
          id: organizationId,
          legalName: input.firmName.trim(),
          firmType: "pending_review",
          status: "pending",
        });
      }
      if (!organizationId) throw new Error("An organization is required");

      next.partnerApplications.unshift({
        id: applicationId,
        userId: currentUser.id,
        organizationId,
        registeredFirstNames: input.registeredFirstNames.trim(),
        registryLastName: input.registryLastName.trim(),
        normalizedRegistryLastName: normalizeRegistrySurname(input.registryLastName),
        licenceDocumentNumber: input.licenceDocumentNumber.trim(),
        licenceType: input.licenceType,
        professionalTitle: input.professionalTitle.trim(),
        firmWorkEmail: input.firmWorkEmail.trim().toLocaleLowerCase("en"),
        lookupConsent: input.lookupConsent,
        accuracyConsent: input.accuracyConsent,
        status: "submitted",
        submittedAt: now,
        updatedAt: now,
      });
      next.memberships.unshift({
        id: `member-${Date.now()}`,
        organizationId,
        userId: currentUser.id,
        roles: ["representative"],
        status: "pending",
        workEmail: input.firmWorkEmail.trim().toLocaleLowerCase("en"),
        registeredName: `${input.registeredFirstNames.trim()} ${input.registryLastName.trim()}`,
        licenceType: input.licenceType,
        maskedLicenceNumber: maskLicenceNumber(input.licenceDocumentNumber),
        verificationStatus: "pending",
        requestedAt: now,
      });
      next.affiliations.unshift({
        id: `affiliation-${Date.now()}`,
        organizationId,
        userId: currentUser.id,
        status: "pending_firm",
        primary: true,
      });
      next.auditEvents.unshift({
        id: `audit-${Date.now()}`,
        actorUserId: currentUser.id,
        action: "partner_application.submitted",
        entityType: "partner_application",
        entityId: applicationId,
        summary: "Partner application submitted for firm and SPL review.",
        occurredAt: now,
      });
      return next;
    });
    return applicationId;
  }

  async function decideMembership(
    membershipId: string,
    decision: "approve" | "reject" | "suspend",
    fallbackReason?: string,
    evidenceStoragePath?: string,
  ) {
    if (backendConfigured) {
      await persistPortalAction("decideMembership", {
        membershipId,
        decision,
        fallbackReason: fallbackReason || null,
        evidenceStoragePath: evidenceStoragePath || null,
      });
      window.location.reload();
      return;
    }
    const now = timestamp();
    setDataset((current) => {
      const membership = current.memberships.find((item) => item.id === membershipId);
      if (!membership) return current;
      const next = copyDataset(current);
      const affiliationStatus: FirmAffiliationStatus =
        decision === "approve"
          ? fallbackReason
            ? "approved_by_hnc_fallback"
            : "approved_by_firm"
          : decision === "reject"
            ? "rejected"
            : "suspended";
      next.memberships = next.memberships.map((item) =>
        item.id === membershipId
          ? {
              ...item,
              status:
                decision === "approve"
                  ? "active"
                  : decision === "reject"
                    ? "ended"
                    : "suspended",
              approvedAt: decision === "approve" ? now : item.approvedAt,
              endedAt: decision === "reject" ? now : item.endedAt,
            }
          : item,
      );
      next.affiliations = next.affiliations.map((item) =>
        item.userId === membership.userId &&
        item.organizationId === membership.organizationId &&
        item.primary
          ? {
              ...item,
              status: affiliationStatus,
              approvedBy: currentUser.id,
              approvalReason: fallbackReason,
              approvedAt: decision === "approve" ? now : item.approvedAt,
              endedAt: decision === "reject" ? now : item.endedAt,
            }
          : item,
      );
      next.auditEvents.unshift({
        id: `audit-${Date.now()}`,
        actorUserId: currentUser.id,
        action: `firm_membership.${decision}`,
        entityType: "organization_membership",
        entityId: membershipId,
        summary: fallbackReason
          ? `Hunter & Hunter Investment Advisors fallback approval recorded: ${fallbackReason}`
          : `Firm membership ${decision} decision recorded.`,
        occurredAt: now,
      });
      return next;
    });
  }

  async function recordLicenseVerification(
    applicationId: string,
    input: LicenseVerificationInput,
  ) {
    if (backendConfigured) {
      await persistPortalAction("recordLicenseVerification", {
        applicationId,
        ...input,
        evidenceStoragePath: input.evidenceFilename || null,
      });
      window.location.reload();
      return;
    }
    const now = timestamp();
    setDataset((current) => {
      const application = current.partnerApplications.find((item) => item.id === applicationId);
      if (!application) return current;
      const next = copyDataset(current);
      next.licenseVerifications.unshift({
        id: `verification-${Date.now()}`,
        applicationId,
        userId: application.userId,
        queriedLicenceNumber: application.licenceDocumentNumber,
        queriedRegistryLastName: application.registryLastName,
        sourceUrl: "https://lsts.spl.com.tr/bilgi-sorgulama",
        result: input.result,
        returnedLicenceTypes: input.returnedLicenceTypes,
        returnedStatus: input.returnedStatus,
        renewalInformation: input.renewalInformation,
        employmentInformation: input.employmentInformation,
        reviewerId: currentUser.id,
        reviewerName: currentUser.displayName,
        reviewerNotes: input.reviewerNotes,
        evidenceFilename: input.evidenceFilename,
        verifiedAt: now,
      });
      next.partnerApplications = next.partnerApplications.map((item) =>
        item.id === applicationId
          ? {
              ...item,
              status: input.result === "verified" ? "approved" : "under_review",
              updatedAt: now,
            }
          : item,
      );
      next.memberships = next.memberships.map((item) =>
        item.userId === application.userId && item.organizationId === application.organizationId
          ? { ...item, verificationStatus: input.result }
          : item,
      );

      const affiliation = next.affiliations.find(
        (item) =>
          item.userId === application.userId &&
          item.organizationId === application.organizationId &&
          item.primary,
      );
      const organization = next.organizations.find(
        (item) => item.id === application.organizationId,
      );
      const canActivate =
        input.result === "verified" &&
        (affiliation?.status === "approved_by_firm" ||
          affiliation?.status === "approved_by_hnc_fallback") &&
        organization?.status === "active";
      const existingAccount = next.partnerAccounts.find(
        (item) => item.userId === application.userId,
      );
      if (existingAccount) {
        next.partnerAccounts = next.partnerAccounts.map((item) =>
          item.id === existingAccount.id
            ? { ...item, status: canActivate ? "active" : "suspended" }
            : item,
        );
      } else if (canActivate) {
        next.partnerAccounts.unshift({
          id: `partner-${Date.now()}`,
          userId: application.userId,
          organizationId: application.organizationId,
          status: "active",
          tier: "associate",
          annualClearedCapital: 0,
          relationshipSince: now.slice(0, 10),
        });
      }
      next.auditEvents.unshift({
        id: `audit-${Date.now()}`,
        actorUserId: currentUser.id,
        action: "license_verification.recorded",
        entityType: "partner_application",
        entityId: applicationId,
        summary: `SPL lookup result recorded as ${input.result}.`,
        occurredAt: now,
      });
      return next;
    });
  }

  async function decideOrganization(
    organizationId: string,
    status: Organization["status"],
    reason: string,
  ) {
    if (!reason.trim()) throw new Error("A review reason is required.");
    if (backendConfigured) {
      await persistPortalAction("decideOrganization", {
        organizationId,
        status,
        reason: reason.trim(),
      });
      window.location.reload();
      return;
    }
    const now = timestamp();
    setDataset((current) => {
      if (!current.organizations.some((item) => item.id === organizationId)) return current;
      const next = copyDataset(current);
      next.organizations = next.organizations.map((item) =>
        item.id === organizationId ? { ...item, status } : item,
      );
      next.auditEvents.unshift({
        id: `audit-${Date.now()}`,
        actorUserId: currentUser.id,
        action: `organization.${status}`,
        entityType: "organization",
        entityId: organizationId,
        summary: reason.trim(),
        occurredAt: now,
      });
      return next;
    });
  }

  async function assignMembershipRoles(
    membershipId: string,
    roles: FirmMembershipRole[],
    reason: string,
  ) {
    if (!reason.trim()) throw new Error("A role-assignment reason is required.");
    if (backendConfigured) {
      await persistPortalAction("assignMembershipRoles", {
        membershipId,
        roles,
        reason: reason.trim(),
      });
      window.location.reload();
      return;
    }
    const now = timestamp();
    setDataset((current) => {
      if (!current.memberships.some((item) => item.id === membershipId)) return current;
      const next = copyDataset(current);
      next.memberships = next.memberships.map((item) =>
        item.id === membershipId
          ? { ...item, roles: [...new Set(roles)] }
          : item,
      );
      next.auditEvents.unshift({
        id: `audit-${Date.now()}`,
        actorUserId: currentUser.id,
        action: "organization_membership.roles_assigned",
        entityType: "organization_membership",
        entityId: membershipId,
        summary: `${reason.trim()} Roles: ${roles.join(", ")}.`,
        occurredAt: now,
      });
      return next;
    });
  }

  async function createCommission(input: NewCommissionInput) {
    if (backendConfigured) {
      await persistPortalAction("createCommission", input);
      window.location.reload();
      return;
    }
    const account = dataset.partnerAccounts.find(
      (item) =>
        item.userId === input.introducingRepresentativeId &&
        item.status === "active",
    );
    if (!account) {
      throw new Error("An active partner account is required for commission allocation.");
    }
    if (
      input.beneficiaryType === "representative" &&
      input.beneficiaryUserId !== input.introducingRepresentativeId
    ) {
      throw new Error("The individual beneficiary must be the introducing representative.");
    }
    if (
      input.beneficiaryType === "organization" &&
      input.beneficiaryOrganizationId !== account.organizationId
    ) {
      throw new Error("The organization beneficiary must match the partner's approved firm.");
    }
    const allocation = calculateFundDistributionCommission(
      input.grossDistributionCommissionAmount,
      account.tier,
    );
    const now = timestamp();
    const commissionId = `commission-${Date.now()}`;
    setDataset((current) => ({
      ...copyDataset(current),
      commissions: [
        {
          ...input,
          ...allocation,
          id: commissionId,
          status: input.status ?? "draft",
          approvedAt: input.status === "approved" ? now : undefined,
        },
        ...current.commissions,
      ],
      auditEvents: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: currentUser.id,
          action: "commission.created",
          entityType: "commission",
          entityId: commissionId,
          summary: `Fund distribution commission allocated at ${allocation.allocationPercentage}%.`,
          occurredAt: now,
        },
        ...current.auditEvents,
      ],
    }));
  }

  async function markCommissionPaid(commissionId: string, paymentReference: string) {
    if (!paymentReference.trim()) throw new Error("A payment reference is required.");
    if (backendConfigured) {
      await persistPortalAction("setCommissionStatus", {
        commissionId,
        status: "paid",
        paymentReference: paymentReference.trim(),
      });
      window.location.reload();
      return;
    }
    const now = timestamp();
    setDataset((current) => ({
      ...copyDataset(current),
      commissions: current.commissions.map((entry) =>
        entry.id === commissionId
          ? { ...entry, status: "paid", paidAt: now, paymentReference }
          : entry,
      ),
      auditEvents: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: currentUser.id,
          action: "commission.paid",
          entityType: "commission",
          entityId: commissionId,
          summary: `Fund distribution commission marked paid with reference ${paymentReference}.`,
          occurredAt: now,
        },
        ...current.auditEvents,
      ],
    }));
  }

  async function updateCommissionStatus(
    commissionId: string,
    status: "approved" | "void",
  ) {
    if (backendConfigured) {
      await persistPortalAction("setCommissionStatus", {
        commissionId,
        status,
      });
      window.location.reload();
      return;
    }
    const now = timestamp();
    setDataset((current) => ({
      ...copyDataset(current),
      commissions: current.commissions.map((entry) =>
        entry.id === commissionId
          ? {
              ...entry,
              status,
              approvedAt: status === "approved" ? now : entry.approvedAt,
            }
          : entry,
      ),
      auditEvents: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: currentUser.id,
          action: `commission.${status}`,
          entityType: "commission",
          entityId: commissionId,
          summary: `Fund distribution commission status changed to ${status}.`,
          occurredAt: now,
        },
        ...current.auditEvents,
      ],
    }));
  }

  const value = useMemo<PortalAccessValue>(
    () => ({
      dataset,
      currentUser,
      context,
      previewPersona,
      previewEnabled,
      backendConfigured,
      currentApplication: latestPartnerApplication(dataset, currentUser.id),
      currentVerification: latestLicenseVerification(dataset, currentUser.id),
      currentMembership: membershipForUser(dataset, currentUser.id),
      currentOrganization: organizationForUser(dataset, currentUser.id),
      activationIssues: partnerActivationIssues(context),
      commissions: visibleCommissions(context),
      memberDirectory: visibleMemberDirectory(context),
      accountView,
      setAccountView,
      setPreviewPersona,
      canAccess: (pathname) => canAccessPath(context, pathname),
      submitPartnerApplication,
      decideMembership,
      decideOrganization,
      assignMembershipRoles,
      recordLicenseVerification,
      createCommission,
      markCommissionPaid,
      updateCommissionStatus,
    }),
    // Actions intentionally close over the latest render state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      backendConfigured,
      accountView,
      context,
      currentUser,
      dataset,
      previewEnabled,
      previewPersona,
    ],
  );

  return <PortalAccessContext.Provider value={value}>{children}</PortalAccessContext.Provider>;
}

export function usePortalAccess() {
  const context = useContext(PortalAccessContext);
  if (!context) {
    throw new Error("usePortalAccess must be used within PortalAccessProvider");
  }
  return context;
}
