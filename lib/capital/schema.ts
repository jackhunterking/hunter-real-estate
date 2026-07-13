import { z } from "zod";
import { documents, managers, offerings, properties, shareClasses, sources } from "./data";

const localized = z.object({ en: z.string().min(1), tr: z.string().min(1) });
const sourced = z.object({
  value: z.union([z.string(), z.number()]),
  classification: z.enum(["historical", "current", "target", "illustrative"]),
  asOfDate: z.string().min(10),
  sourceId: z.string().min(1),
  sourcePage: z.number().int().positive().optional(),
  approval: z.enum(["approved-public", "review-required", "private"]),
});

const imageSlot = z.object({ src: z.string().min(1).optional(), alt: localized.optional() });
const mediaSet = z.object({ card: imageSlot.optional(), banner: imageSlot.optional(), logo: imageSlot.optional() });
const manager = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localized,
  headquarters: z.object({ city: z.string().min(1), province: z.string().min(1), country: z.string().min(1) }),
  description: localized,
  website: z.string().url().optional(),
  officeAddress: localized.optional(),
});

const trailingReturn = z.object({ period: localized, value: z.string().min(1), note: localized.optional() });
const providerInfo = z.object({ name: z.string().min(1), url: z.string().url().optional() });
const serviceProviders = z.object({
  auditor: providerInfo.optional(), legalCounsel: providerInfo.optional(), appraiser: providerInfo.optional(),
});

const offeringSchema = z.object({
  id: z.string().min(1), slug: z.string().min(1), managerId: z.string().min(1),
  name: localized, shortName: localized, summary: localized, thesis: localized,
  status: z.enum(["available", "coming-soon", "paused", "closed"]),
  strategyIds: z.array(z.string()), assetClassIds: z.array(z.string()), regionIds: z.array(z.string()),
  shareClassIds: z.array(z.string()), propertyIds: z.array(z.string()), documentIds: z.array(z.string()),
  featured: z.boolean(), portfolioFacts: z.array(sourced), risks: z.array(localized),
  media: mediaSet.optional(), offeringSize: sourced.optional(), unitsTotal: sourced.optional(),
  fundType: localized.optional(), fundStatus: localized.optional(), inceptionDate: z.string().optional(),
  aum: sourced.optional(), amountRaised: sourced.optional(), fundingPercent: z.number().optional(),
  managementFee: localized.optional(), valuationFrequency: localized.optional(), distributionFrequency: localized.optional(),
  riskProfile: localized.optional(), highlights: z.array(localized).optional(),
  trailingReturns: z.array(trailingReturn).optional(), trailingReturnsNote: localized.optional(), serviceProviders: serviceProviders.optional(),
  lastUpdated: z.string().optional(),
  verifiedAt: z.string().min(10),
});

function assertUnique(records: { id: string }[], label: string) {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate ${label} id: ${record.id}`);
    ids.add(record.id);
  }
}

export function validateCapitalData() {
  z.array(manager).parse(managers);
  z.array(offeringSchema).parse(offerings);
  assertUnique(sources, "source"); assertUnique(managers, "manager"); assertUnique(offerings, "offering");
  assertUnique(shareClasses, "share class"); assertUnique(properties, "property"); assertUnique(documents, "document");
  const managerIds = new Set(managers.map((item) => item.id));
  const sourceIds = new Set(sources.map((item) => item.id));
  const shareIds = new Set(shareClasses.map((item) => item.id));
  const propertyIds = new Set(properties.map((item) => item.id));
  const documentIds = new Set(documents.map((item) => item.id));
  for (const offering of offerings) {
    if (!managerIds.has(offering.managerId)) throw new Error(`Missing manager for ${offering.id}`);
    for (const id of offering.shareClassIds) if (!shareIds.has(id)) throw new Error(`Missing share class ${id}`);
    for (const id of offering.propertyIds) if (!propertyIds.has(id)) throw new Error(`Missing property ${id}`);
    for (const id of offering.documentIds) if (!documentIds.has(id)) throw new Error(`Missing document ${id}`);
    for (const fact of offering.portfolioFacts) if (!sourceIds.has(fact.sourceId)) throw new Error(`Missing source ${fact.sourceId}`);
  }
  for (const property of properties) {
    if (!Number.isFinite(property.latitude) || !Number.isFinite(property.longitude)) throw new Error(`Invalid coordinates for ${property.id}`);
  }
  return true;
}
