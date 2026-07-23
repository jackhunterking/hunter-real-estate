import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OperationsInbox, type OperationsModule, type OperationsQueueItem } from "@/components/capital/north/OperationsInbox";
import type { Json } from "@/lib/supabase/database.types";
import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { getLearningResourceAdminRows } from "@/lib/capital/learning-admin-server";
import { getOfferingAdminRows } from "@/lib/capital/offering-admin-server";

const MODULES = new Set<OperationsModule>(["requests", "professional", "licences", "firms", "payments", "fund-schedules", "content", "leads", "audit"]);

export default async function HunterNorthOperationsPage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const { module } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [queue, offerings, learningResources, offeringAdmin] = await Promise.all([
    supabase
      ? supabase.from("operations_queue").select("id,module,title,summary,status,occurred_at,payload").order("occurred_at", { ascending: false }).limit(250)
      : null,
    getPublishedOfferings(),
    getLearningResourceAdminRows(),
    getOfferingAdminRows(),
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
    <OperationsInbox
      initialQueue={initialQueue}
      initialModule={module && MODULES.has(module as OperationsModule) ? module as OperationsModule : "all"}
      offerings={offerings.map((offering) => ({ id: offering.id, name: offering.name }))}
      offeringAdmin={offeringAdmin}
      learningResources={learningResources}
      backendConfigured={Boolean(supabase)}
    />
  );
}
