import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  learningSummary,
  type LearningResourceDetail,
  type LearningResourceSource,
} from "./learning";
import type { LocalizedText } from "./types";

type PublishedLearningRow = {
  id: string;
  slug: string;
  resource_type: string;
  category_key: string;
  audience: string;
  version_id: string;
  version: number;
  title: unknown;
  summary: unknown;
  body_markdown: unknown;
  disclaimer: unknown;
  reading_minutes: unknown;
  effective_at: string;
  published_at: string | null;
  reviewed_at: string;
  sources: unknown;
};

function localizedText(value: unknown): LocalizedText | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.en !== "string" || typeof candidate.tr !== "string") return null;
  return { en: candidate.en, tr: candidate.tr };
}

function readingMinutes(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.en !== "number" || typeof candidate.tr !== "number") return null;
  return { en: candidate.en, tr: candidate.tr };
}

function sources(value: unknown): LearningResourceSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const source = entry as Record<string, unknown>;
    if (
      typeof source.id !== "string" ||
      typeof source.title !== "string" ||
      typeof source.url !== "string" ||
      typeof source.publisher !== "string" ||
      typeof source.accessedAt !== "string" ||
      typeof source.sortOrder !== "number"
    ) return [];
    return [{
      id: source.id,
      title: source.title,
      url: source.url,
      publisher: source.publisher,
      publishedOn: typeof source.publishedOn === "string" ? source.publishedOn : undefined,
      accessedAt: source.accessedAt,
      notes: typeof source.notes === "string" ? source.notes : undefined,
      sortOrder: source.sortOrder,
    }];
  });
}

function resourceFromRow(row: PublishedLearningRow): LearningResourceDetail | null {
  const title = localizedText(row.title);
  const summary = localizedText(row.summary);
  const bodyMarkdown = localizedText(row.body_markdown);
  const disclaimer = localizedText(row.disclaimer);
  const minutes = readingMinutes(row.reading_minutes);
  if (!title || !summary || !bodyMarkdown || !disclaimer || !minutes) return null;
  if (row.resource_type !== "guide" || row.audience !== "investor_and_professional") return null;
  return {
    id: row.id,
    slug: row.slug,
    resourceType: "guide",
    categoryKey: row.category_key,
    audience: "investor_and_professional",
    versionId: row.version_id,
    version: Number(row.version),
    title,
    summary,
    bodyMarkdown,
    disclaimer,
    readingMinutes: minutes,
    effectiveAt: row.effective_at,
    publishedAt: row.published_at ?? undefined,
    reviewedAt: row.reviewed_at,
    sources: sources(row.sources).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

// Learning content is read exclusively from Supabase — no fixture fallback.
export async function getPublishedLearningResources() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const result = await supabase
    .from("published_learning_resources")
    .select("id,slug,resource_type,category_key,audience,version_id,version,title,summary,body_markdown,disclaimer,reading_minutes,effective_at,published_at,reviewed_at,sources")
    .order("published_at", { ascending: false });
  if (result.error) return [];
  const resources = (result.data as PublishedLearningRow[]).map(resourceFromRow).filter(Boolean) as LearningResourceDetail[];
  return resources.map(learningSummary);
}

export async function getPublishedLearningResourceBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;
  const result = await supabase
    .from("published_learning_resources")
    .select("id,slug,resource_type,category_key,audience,version_id,version,title,summary,body_markdown,disclaimer,reading_minutes,effective_at,published_at,reviewed_at,sources")
    .eq("slug", slug)
    .maybeSingle();
  if (result.error || !result.data) return undefined;
  return resourceFromRow(result.data as PublishedLearningRow) ?? undefined;
}
