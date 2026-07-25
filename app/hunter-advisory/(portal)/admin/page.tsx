import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminConsole, type OperationsQueueItem } from "@/components/capital/north/AdminConsole";
import { isAdminSectionId, type AdminSectionId } from "@/lib/capital/admin-sections";
import type { Json } from "@/lib/supabase/database.types";
import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { getLearningResourceAdminRows } from "@/lib/capital/learning-admin-server";
import { getOfferingAdminRows } from "@/lib/capital/offering-admin-server";
import { loadAdminDirectories } from "@/lib/capital/admin-server";

/**
 * The master Admin console. Every read here is admin-gated in SQL, so a
 * non-admin who reaches the route sees empty collections rather than an error —
 * and `canAccessPath` turns them away before that anyway.
 */
export default async function HunterAdminPage({ searchParams }: { searchParams: Promise<{ section?: string; module?: string }> }) {
  const params = await searchParams;
  // `module` is the retired query name from /operations; honour it so old
  // bookmarks and the eight legacy /admin/* redirects keep landing correctly.
  const requested = params.section ?? params.module;

  const supabase = await createSupabaseServerClient();
  const [queue, offerings, learningResources, offeringAdmin, directories] = await Promise.all([
    supabase
      ? supabase.from("operations_queue").select("id,module,title,summary,status,occurred_at,payload").order("occurred_at", { ascending: false }).limit(250)
      : null,
    getPublishedOfferings(),
    getLearningResourceAdminRows(),
    getOfferingAdminRows(),
    loadAdminDirectories(),
  ]);

  const initialQueue: OperationsQueueItem[] = (queue?.data ?? []).map((item) => ({
    id: item.id,
    module: item.module as OperationsQueueItem["module"],
    title: item.title,
    summary: item.summary,
    status: item.status,
    date: item.occurred_at,
    details: Object.fromEntries(
      Object.entries((item.payload ?? {}) as Exclude<Json, null | string | number | boolean | Json[]>).map(([key, value]) => [key, value == null ? undefined : typeof value === "object" ? JSON.stringify(value) : value]),
    ) as OperationsQueueItem["details"],
  }));

  return (
    <AdminConsole
      initialSection={isAdminSectionId(requested) ? (requested as AdminSectionId) : "overview"}
      initialQueue={initialQueue}
      offerings={offerings}
      offeringAdmin={offeringAdmin}
      learningResources={learningResources}
      directories={directories}
      backendConfigured={Boolean(supabase)}
    />
  );
}
