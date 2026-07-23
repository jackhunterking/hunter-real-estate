import type { LocalizedText } from "./types";

export type LearningPublicationStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "superseded"
  | "withdrawn";

export type LearningResourceSource = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedOn?: string;
  accessedAt: string;
  notes?: string;
  sortOrder: number;
};

export type LearningResourceSummary = {
  id: string;
  slug: string;
  resourceType: "guide";
  categoryKey: string;
  audience: "investor_and_professional";
  versionId: string;
  version: number;
  title: LocalizedText;
  summary: LocalizedText;
  readingMinutes: { en: number; tr: number };
  effectiveAt: string;
  publishedAt?: string;
  reviewedAt: string;
};

export type LearningResourceDetail = LearningResourceSummary & {
  bodyMarkdown: LocalizedText;
  disclaimer: LocalizedText;
  sources: LearningResourceSource[];
};

export type LearningResourceVersion = {
  id: string;
  resourceId: string;
  version: number;
  status: LearningPublicationStatus;
  title: LocalizedText;
  summary: LocalizedText;
  bodyMarkdown: LocalizedText;
  disclaimer: LocalizedText;
  readingMinutes: { en: number; tr: number };
  authorId: string;
  reviewerId?: string;
  complianceOwnerId?: string;
  effectiveAt?: string;
  publishedAt?: string;
  withdrawalAt?: string;
  createdAt: string;
};

export type LearningAdminResource = LearningResourceVersion & {
  slug: string;
  resourceType: "guide";
  categoryKey: string;
  audience: "investor_and_professional";
  currentVersionId?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  sources: LearningResourceSource[];
};

export const LEARNING_CATEGORIES: Record<string, LocalizedText> = {
  "investment-fundamentals": {
    en: "Investment fundamentals",
    tr: "Yatırım temelleri",
  },
};


export function learningCategoryLabel(categoryKey: string): LocalizedText {
  return LEARNING_CATEGORIES[categoryKey] ?? { en: categoryKey, tr: categoryKey };
}

export function learningSummary(resource: LearningResourceDetail): LearningResourceSummary {
  return {
    id: resource.id,
    slug: resource.slug,
    resourceType: resource.resourceType,
    categoryKey: resource.categoryKey,
    audience: resource.audience,
    versionId: resource.versionId,
    version: resource.version,
    title: resource.title,
    summary: resource.summary,
    readingMinutes: resource.readingMinutes,
    effectiveAt: resource.effectiveAt,
    publishedAt: resource.publishedAt,
    reviewedAt: resource.reviewedAt,
  };
}
