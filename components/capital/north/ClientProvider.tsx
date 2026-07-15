"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ClientDocument, ClientFundInterest, ClientRecord, LocalizedText } from "@/lib/capital/types";
import { initialClients } from "@/lib/capital/partner-data";

export type NewClientRecord = Omit<
  ClientRecord,
  "id" | "displayName" | "status" | "introducedAt" | "updatedAt" | "nextAction" | "activity"
>;

type NewFundInterest = Omit<ClientFundInterest, "id" | "createdAt" | "primary"> & { primary?: boolean };

type ClientContextValue = {
  clients: ClientRecord[];
  createClient: (client: NewClientRecord) => string;
  addFundInterest: (clientId: string, interest: NewFundInterest) => void;
  uploadDocument: (clientId: string, documentId: string, file: File) => boolean;
  removeDocument: (clientId: string, documentId: string) => boolean;
  markContacted: (clientId: string) => void;
};

const ClientContext = createContext<ClientContextValue | null>(null);

function now() {
  return new Date().toISOString();
}

function activityText(en: string, tr: string): LocalizedText {
  return { en, tr };
}

function locked(document: ClientDocument) {
  return document.status === "under-review" || document.status === "approved";
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<ClientRecord[]>(() => initialClients);

  function createClient(input: NewClientRecord) {
    const timestamp = now();
    const id = `session-${Date.now()}`;
    const client: ClientRecord = {
      ...input,
      id,
      displayName: `${input.firstName} ${input.lastName}`.trim(),
      status: "introduced",
      introducedAt: timestamp.slice(0, 10),
      updatedAt: timestamp,
      nextAction: activityText("Complete the introduction and requested documents", "Tanıştırmayı ve istenen belgeleri tamamlayın"),
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
            description: activityText("A new fund interest was added", "Yeni bir fon ilgisi eklendi"),
            occurredAt: timestamp,
          },
          ...client.activity,
        ],
      };
    }));
  }

  function uploadDocument(clientId: string, documentId: string, file: File) {
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

  function markContacted(clientId: string) {
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

  const value = useMemo(() => ({ clients, createClient, addFundInterest, uploadDocument, removeDocument, markContacted }), [clients]);
  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClients must be used within ClientProvider");
  return context;
}
