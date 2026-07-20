import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { LearningAdminResource, LearningResourceSource } from "./learning";
import type { LocalizedText } from "./types";

function localized(value: Json): LocalizedText {
  const item = value as { en?: unknown; tr?: unknown };
  return { en: typeof item.en === "string" ? item.en : "", tr: typeof item.tr === "string" ? item.tr : "" };
}

function minutes(value: Json) {
  const item = value as { en?: unknown; tr?: unknown };
  return { en: Number(item.en) || 1, tr: Number(item.tr) || 1 };
}

function sourceRows(value: Json): LearningResourceSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const item = entry as Record<string, Json | undefined>;
    if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.url !== "string" || typeof item.publisher !== "string" || typeof item.accessedAt !== "string") return [];
    return [{
      id: item.id,
      title: item.title,
      url: item.url,
      publisher: item.publisher,
      publishedOn: typeof item.publishedOn === "string" ? item.publishedOn : undefined,
      accessedAt: item.accessedAt,
      notes: typeof item.notes === "string" ? item.notes : undefined,
      sortOrder: Number(item.sortOrder) || 0,
    }];
  });
}

export async function getLearningResourceAdminRows(): Promise<LearningAdminResource[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const result = await supabase.from("learning_resource_admin").select("*").order("created_at", { ascending: false });
  if (result.error) return [];
  return (result.data ?? []).flatMap((row) => {
    if (row.resource_type !== "guide" || row.audience !== "investor_and_professional") return [];
    return [{
      id: row.version_id,
      resourceId: row.id,
      slug: row.slug,
      resourceType: "guide" as const,
      categoryKey: row.category_key,
      audience: "investor_and_professional" as const,
      currentVersionId: row.current_version_id ?? undefined,
      version: row.version,
      status: row.status,
      title: localized(row.title),
      summary: localized(row.summary),
      bodyMarkdown: localized(row.body_markdown),
      disclaimer: localized(row.disclaimer),
      readingMinutes: minutes(row.reading_minutes),
      authorId: row.author_id,
      reviewerId: row.reviewer_id ?? undefined,
      complianceOwnerId: row.compliance_owner_id ?? undefined,
      reviewNotes: row.review_notes ?? undefined,
      reviewedAt: row.reviewed_at ?? undefined,
      effectiveAt: row.effective_at ?? undefined,
      publishedAt: row.published_at ?? undefined,
      withdrawalAt: row.withdrawal_at ?? undefined,
      createdAt: row.created_at,
      sources: sourceRows(row.sources),
    }];
  });
}
