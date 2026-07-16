"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  availableWorkspaces,
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
  type PortalDataset,
  type PortalUser,
  type PortalWorkspace,
  type PreviewPersona,
} from "@/lib/capital/portal-access";
import {
  demoUserForPersona,
  initialPortalDataset,
} from "@/lib/capital/portal-demo";
import { calculateFundDistributionCommission } from "@/lib/capital/commissions";
import { portalRequest } from "@/lib/capital/portal-client";

type NewOrganizationInput = Pick<
  Organization,
  | "legalName"
  | "tradingName"
  | "firmType"
  | "website"
  | "businessDomain"
  | "spkRegistration"
  | "registeredAddress"
  | "authorizedContact"
  | "complianceContact"
  | "authorizationEvidenceFilename"
>;

export type PartnerApplicationInput = {
  organizationId?: string;
  newOrganization?: NewOrganizationInput;
  registeredFirstNames: string;
  registryLastName: string;
  licenceDocumentNumber: string;
  licenceType: string;
  professionalTitle: string;
  firmWorkEmail: string;
  evidenceFilename?: string;
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

type PortalAccessValue = {
  dataset: PortalDataset;
  currentUser: PortalUser;
  context: AccessContext;
  workspace: PortalWorkspace;
  workspaces: PortalWorkspace[];
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
  setWorkspace: (workspace: PortalWorkspace) => void;
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
    documents: [...dataset.documents],
    auditEvents: [...dataset.auditEvents],
  };
}

export function PortalAccessProvider({
  children,
  initialDataset = initialPortalDataset,
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
  const [previewPersona, setPreviewPersonaState] = useState<PreviewPersona>("partner");
  const [workspace, setWorkspaceState] = useState<PortalWorkspace>("partner");

  useEffect(() => {
    if (!previewEnabled) return;
    try {
      const savedPersona = window.localStorage.getItem("hnc-preview-persona") as PreviewPersona | null;
      const savedWorkspace = window.localStorage.getItem("hnc-workspace") as PortalWorkspace | null;
      if (savedPersona) setPreviewPersonaState(savedPersona);
      if (savedWorkspace) setWorkspaceState(savedWorkspace);
    } catch {
      // Preview state remains deterministic when local storage is unavailable.
    }
  }, [previewEnabled]);

  const currentUser = initialUser ?? demoUserForPersona(previewPersona);
  const context = useMemo(() => ({ user: currentUser, dataset }), [currentUser, dataset]);
  const workspaces = useMemo(() => availableWorkspaces(context), [context]);

  useEffect(() => {
    if (!workspaces.includes(workspace)) {
      setWorkspaceState(workspaces[0] ?? "investor");
    }
  }, [workspace, workspaces]);

  function setWorkspace(next: PortalWorkspace) {
    if (!canUseWorkspace(context, next)) return;
    setWorkspaceState(next);
    try {
      window.localStorage.setItem("hnc-workspace", next);
    } catch {
      // Workspace still changes for the active visit.
    }
  }

  function setPreviewPersona(persona: PreviewPersona) {
    if (!previewEnabled) return;
    setPreviewPersonaState(persona);
    try {
      window.localStorage.setItem("hnc-preview-persona", persona);
    } catch {
      // Preview still changes for the active visit.
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
      !input.firmWorkEmail.trim() ||
      (!input.organizationId && !input.newOrganization) ||
      !input.lookupConsent ||
      !input.accuracyConsent
    ) {
      throw new Error("Required partner application fields are missing.");
    }
    if (backendConfigured) {
      const data = await persistPortalAction("submitPartnerApplication", {
        organizationId: input.organizationId || null,
        registeredFirstNames: input.registeredFirstNames.trim(),
        registryLastName: input.registryLastName.trim(),
        normalizedRegistryLastName: normalizeRegistrySurname(input.registryLastName),
        licenceDocumentNumber: input.licenceDocumentNumber.trim(),
        licenceType: input.licenceType.trim(),
        professionalTitle: input.professionalTitle.trim(),
        firmWorkEmail: input.firmWorkEmail.trim().toLocaleLowerCase("en"),
        evidenceStoragePath: input.evidenceFilename || null,
        newFirmLegalName: input.newOrganization?.legalName || null,
        newFirmTradingName: input.newOrganization?.tradingName || null,
        newFirmType: input.newOrganization?.firmType || null,
        newFirmWebsite: input.newOrganization?.website || null,
        newFirmBusinessDomain: input.newOrganization?.businessDomain || null,
        newFirmSpkRegistration: input.newOrganization?.spkRegistration || null,
        newFirmRegisteredAddress: input.newOrganization?.registeredAddress || null,
        newFirmAuthorizedContact: input.newOrganization?.authorizedContact || null,
        newFirmComplianceContact: input.newOrganization?.complianceContact || null,
        newFirmEvidenceStoragePath:
          input.newOrganization?.authorizationEvidenceFilename || null,
      });
      window.location.reload();
      return String(data);
    }
    const now = timestamp();
    const applicationId = `application-${Date.now()}`;
    let organizationId = input.organizationId;
    setDataset((current) => {
      const next = copyDataset(current);
      if (!organizationId && input.newOrganization) {
        organizationId = `org-${Date.now()}`;
        next.organizations.unshift({
          id: organizationId,
          ...input.newOrganization,
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
        evidenceFilename: input.evidenceFilename,
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
          ? `Hunter North fallback approval recorded: ${fallbackReason}`
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
      workspace,
      workspaces,
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
      setWorkspace,
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
      context,
      currentUser,
      dataset,
      previewEnabled,
      previewPersona,
      workspace,
      workspaces,
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
