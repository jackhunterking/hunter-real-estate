"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
  ClientAccountType,
  ClientDocument,
  ClientFundInterest,
  ClientJurisdiction,
  ClientRecord,
  InvestorReadinessAssessment,
  LocalizedText,
} from "@/lib/equity-market/types";
import { hasPlatformRole } from "@/lib/equity-market/portal-access";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import { uploadInvestorDocument } from "@/lib/supabase/storage";
import { usePortalAccess } from "./PortalAccessProvider";
import { portalRequest } from "@/lib/equity-market/portal-client";

export type NewClientRecord = Omit<
  ClientRecord,
  "id" | "displayName" | "status" | "introducedAt" | "updatedAt" | "nextAction" | "activity" | "investorReadinessAssessments"
> & { investorReadinessAssessments?: InvestorReadinessAssessment[] };

export type NewProspectRecord = {
  accountType: ClientAccountType;
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  city?: string;
  country: string;
  region?: string;
  jurisdiction: ClientJurisdiction;
};

export type NewInvestorReadinessAssessment = Omit<
  InvestorReadinessAssessment,
  "id" | "clientId" | "assessedAt"
> & { assessedAt?: string };

type NewFundInterest = Omit<ClientFundInterest, "id" | "createdAt" | "primary"> & { primary?: boolean };

type ClientContextValue = {
  clients: ClientRecord[];
  createClient: (client: NewClientRecord) => Promise<string>;
  createProspect: (client: NewProspectRecord) => Promise<string>;
  saveInvestorAssessment: (clientId: string, assessment: NewInvestorReadinessAssessment) => Promise<string>;
  addFundInterest: (clientId: string, interest: NewFundInterest) => void;
  uploadDocument: (clientId: string, documentId: string, file: File) => Promise<boolean>;
  removeDocument: (clientId: string, documentId: string) => boolean;
  markContacted: (clientId: string) => Promise<void>;
};

const ClientContext = createContext<ClientContextValue | null>(null);

function now() {
  return new Date().toISOString();
}

function activityText(en: string, tr: string): LocalizedText {
  return investorTerminology({ en, tr });
}

function locked(document: ClientDocument) {
  return document.status === "under-review" || document.status === "approved";
}

function referralClient(
  referral: ReturnType<typeof usePortalAccess>["dataset"]["referrals"][number],
  documents: ReturnType<typeof usePortalAccess>["dataset"]["documents"],
  qualificationAssessments: ReturnType<typeof usePortalAccess>["dataset"]["qualificationAssessments"],
): ClientRecord {
  const createdAt = referral.createdAt;
  return {
    id: referral.id,
    ownerUserId: referral.ownerUserId,
    firmId: referral.firmId,
    accountType: referral.accountType,
    firstName: referral.firstName,
    lastName: referral.lastName,
    displayName: referral.displayName,
    organization: referral.organization,
    email: referral.email,
    phone: referral.phone,
    city: referral.city,
    country: referral.country,
    region: referral.region,
    jurisdiction:
      referral.country.toLocaleLowerCase("en-CA") === "canada" &&
      ["ontario", "on"].includes(referral.region?.toLocaleLowerCase("en-CA") ?? "")
        ? "ontario"
        : "manual-review",
    status: referral.status,
    introducedAt: createdAt.slice(0, 10),
    updatedAt: referral.updatedAt,
    nextAction: activityText(
      referral.status === "introduced"
        ? "Confirm client contact and complete requested documents"
        : "Continue through the licensed review process",
      referral.status === "introduced"
        ? "Müşteri iletişimini doğrulayın ve istenen belgeleri tamamlayın"
        : "Lisanslı inceleme sürecine devam edin",
    ),
    fundInterests:
      referral.offeringId
        ? [{
            id: `${referral.id}-primary-interest`,
            offeringId: referral.offeringId,
            amount: referral.indicativeAmount ?? 0,
            timeline: "Now",
            accountPreference: "Unsure",
            primary: true,
            createdAt,
          }]
        : [],
    investorReadinessAssessments: qualificationAssessments
      .filter((assessment) => assessment.clientId === referral.id)
      .sort((a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt)),
    documents: documents
      .filter((document) => document.referralId === referral.id)
      .map((document) => ({
        id: document.id,
        label: {
          en: document.category || document.filename,
          tr: document.category || document.filename,
        },
        category: "fund-specific",
        status: "received",
        filename: document.filename,
        size: document.byteSize,
        mimeType: document.mimeType,
        uploadedAt: document.createdAt,
      })),
    contactConsentAt: referral.contactConsentAt,
    accuracyConsentAt: referral.accuracyConsentAt,
    activity: [{
      id: `${referral.id}-created`,
      kind: "created",
      description: activityText("Client profile created", "Müşteri profili oluşturuldu"),
      occurredAt: createdAt,
    }],
  };
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    currentMembership,
    dataset,
    backendConfigured,
  } = usePortalAccess();
  const [allClients, setClients] = useState<ClientRecord[]>(() =>
    backendConfigured
      ? dataset.referrals.map((referral) => referralClient(referral, dataset.documents, dataset.qualificationAssessments))
      : [],
  );
  const clients = useMemo(
    () =>
      hasPlatformRole(currentUser, "master_admin")
        ? allClients
        : allClients.filter((client) => client.ownerUserId === currentUser.id),
    [allClients, currentUser],
  );

  async function portalMutation(action: string, payload: Record<string, unknown>) {
    return portalRequest(action, payload);
  }

  async function createClient(input: NewClientRecord) {
    const timestamp = now();
    const displayName = input.accountType === "entity" && input.organization
      ? input.organization
      : `${input.firstName} ${input.lastName}`.trim();
    const primaryInterest = input.fundInterests.find((item) => item.primary) ?? input.fundInterests[0];
    const id = backendConfigured
      ? String(await portalMutation("createReferral", {
          accountType: input.accountType,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          displayName,
          organization: input.organization,
          email: input.email.trim(),
          phone: input.phone,
          country: input.country.trim(),
          region: input.region,
          city: input.city,
          offeringId: primaryInterest?.offeringId,
          indicativeAmount: primaryInterest?.amount,
        }))
      : `session-${Date.now()}`;
    const client: ClientRecord = {
      ...input,
      id,
      ownerUserId: currentUser.id,
      firmId: currentMembership?.organizationId,
      displayName,
      status: "introduced",
      introducedAt: timestamp.slice(0, 10),
      updatedAt: timestamp,
      nextAction: activityText("Complete the introduction and requested documents", "Tanıştırmayı ve istenen belgeleri tamamlayın"),
      investorReadinessAssessments: input.investorReadinessAssessments ?? [],
      activity: [
        ...input.documents.filter((document) => document.filename).map((document, index) => ({
          id: `${id}-initial-document-${index}`,
          kind: "document" as const,
          description: activityText(`${document.label.en} received during onboarding`, `${document.label.tr} onboarding sırasında alındı`),
          occurredAt: timestamp,
        })),
        {
          id: `${id}-created`,
          kind: "created",
          description: activityText("Client profile created", "Müşteri profili oluşturuldu"),
          occurredAt: timestamp,
        },
      ],
    };
    setClients((current) => [client, ...current]);
    return id;
  }

  async function createProspect(input: NewProspectRecord) {
    const timestamp = now();
    const displayName = input.accountType === "entity" && input.organization
      ? input.organization
      : `${input.firstName} ${input.lastName}`.trim();
    const id = backendConfigured
      ? String(await portalMutation("createReferral", {
          accountType: input.accountType,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          displayName,
          organization: input.organization,
          email: input.email.trim(),
          country: input.country.trim(),
          region: input.region,
          city: input.city,
        }))
      : `session-${Date.now()}`;
    const client: ClientRecord = {
      ...input,
      id,
      ownerUserId: currentUser.id,
      firmId: currentMembership?.organizationId,
      displayName,
      status: "introduced",
      introducedAt: timestamp.slice(0, 10),
      updatedAt: timestamp,
      nextAction: activityText("Complete licensed investor review", "Lisanslı yatırımcı incelemesini tamamlayın"),
      fundInterests: [],
      investorReadinessAssessments: [],
      documents: [],
      contactConsentAt: timestamp,
      accuracyConsentAt: timestamp,
      activity: [{
        id: `${id}-created`,
        kind: "created",
        description: activityText("Prospective client created from Investor readiness", "Potansiyel müşteri Yatırımcı hazırlığı aracından oluşturuldu"),
        occurredAt: timestamp,
      }],
    };
    setClients((current) => [client, ...current]);
    return id;
  }

  async function saveInvestorAssessment(clientId: string, input: NewInvestorReadinessAssessment) {
    const assessedAt = input.assessedAt ?? now();
    const persistedId = backendConfigured
      ? await portalMutation("saveReferralQualificationAssessment", {
          referralId: clientId,
          assessment: { ...input, assessedAt: undefined },
        })
      : undefined;
    const id = typeof persistedId === "string" ? persistedId : `${clientId}-readiness-${Date.now()}`;
    const assessment: InvestorReadinessAssessment = { ...input, id, clientId, assessedAt };
    setClients((current) => current.map((client) => client.id === clientId ? {
      ...client,
      accountType: assessment.accountType,
      jurisdiction: assessment.jurisdiction,
      updatedAt: assessedAt,
      investorReadinessAssessments: [assessment, ...client.investorReadinessAssessments],
      activity: [{
        id: `${clientId}-readiness-activity-${Date.now()}`,
        kind: "note",
        description: activityText("Investor readiness assessment completed", "Yatırımcı hazırlık değerlendirmesi tamamlandı"),
        occurredAt: assessedAt,
      }, ...client.activity],
    } : client));
    return id;
  }

  function addFundInterest(clientId: string, input: NewFundInterest) {
    const timestamp = now();
    setClients((current) => current.map((client) => {
      if (client.id !== clientId) return client;
      const primary = input.primary ?? client.fundInterests.length === 0;
      const nextInterest: ClientFundInterest = {
        ...input,
        id: `${clientId}-interest-${Date.now()}`,
        primary,
        createdAt: timestamp,
      };
      return {
        ...client,
        updatedAt: timestamp,
        fundInterests: [
          ...client.fundInterests.map((item) => primary ? { ...item, primary: false } : item),
          nextInterest,
        ],
        activity: [
          {
            id: `${clientId}-fund-${Date.now()}`,
            kind: "fund",
            description: activityText("A new investment interest was added", "Yeni bir yatırım ilgisi eklendi"),
            occurredAt: timestamp,
          },
          ...client.activity,
        ],
      };
    }));
  }

  async function uploadDocument(clientId: string, documentId: string, file: File) {
    let changed = false;
    const timestamp = now();
    setClients((current) => current.map((client) => {
      if (client.id !== clientId) return client;
      const target = client.documents.find((document) => document.id === documentId);
      if (!target || locked(target)) return client;
      changed = true;
      if (target.objectUrl) URL.revokeObjectURL(target.objectUrl);
      const documents = client.documents.map((document) => document.id === documentId ? {
        ...document,
        status: "received" as const,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: timestamp,
        objectUrl: URL.createObjectURL(file),
      } : document);
      return {
        ...client,
        documents,
        updatedAt: timestamp,
        nextAction: activityText("Complete any remaining requested documents", "Kalan istenen belgeleri tamamlayın"),
        activity: [
          {
            id: `${clientId}-document-${Date.now()}`,
            kind: "document",
            description: activityText(`${target.label.en} received`, `${target.label.tr} alındı`),
            occurredAt: timestamp,
          },
          ...client.activity,
        ],
      };
    }));
    if (changed && backendConfigured) {
      const storagePath = await uploadInvestorDocument(currentUser.id, clientId, file);
      await portalMutation("registerReferralDocument", {
        referralId: clientId,
        storagePath,
        filename: file.name,
        documentCategory: documentId,
        mimeType: file.type,
        byteSize: file.size,
      });
    }
    return changed;
  }

  function removeDocument(clientId: string, documentId: string) {
    let changed = false;
    const timestamp = now();
    setClients((current) => current.map((client) => {
      if (client.id !== clientId) return client;
      const target = client.documents.find((document) => document.id === documentId);
      if (!target || locked(target)) return client;
      changed = true;
      if (target.objectUrl) URL.revokeObjectURL(target.objectUrl);
      return {
        ...client,
        updatedAt: timestamp,
        documents: client.documents.map((document) => document.id === documentId ? {
          ...document,
          status: "missing" as const,
          filename: undefined,
          size: undefined,
          mimeType: undefined,
          uploadedAt: undefined,
          objectUrl: undefined,
        } : document),
        activity: [
          {
            id: `${clientId}-document-remove-${Date.now()}`,
            kind: "document",
            description: activityText(`${target.label.en} removed`, `${target.label.tr} kaldırıldı`),
            occurredAt: timestamp,
          },
          ...client.activity,
        ],
      };
    }));
    return changed;
  }

  async function markContacted(clientId: string) {
    if (backendConfigured) {
      await portalMutation("markReferralContacted", { referralId: clientId });
    }
    const timestamp = now();
    setClients((current) => current.map((client) => client.id === clientId && client.status === "introduced" ? {
      ...client,
      status: "contacted",
      updatedAt: timestamp,
      nextAction: activityText("Complete the requested client documents", "İstenen müşteri belgelerini tamamlayın"),
      activity: [
        {
          id: `${clientId}-contacted-${Date.now()}`,
          kind: "status",
          description: activityText("Client contact confirmed by partner", "Müşteri iletişimi partner tarafından doğrulandı"),
          occurredAt: timestamp,
        },
        ...client.activity,
      ],
    } : client));
  }

  const value = { clients, createClient, createProspect, saveInvestorAssessment, addFundInterest, uploadDocument, removeDocument, markContacted };
  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClients must be used within ClientProvider");
  return context;
}
