import { redirect } from "next/navigation";

/**
 * Operations moved into the consolidated Admin console. The old `?module=` query
 * used the same keys as the new sections, so it forwards unchanged.
 */
export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const { module } = await searchParams;
  redirect(module ? `/hunter-advisory/admin?section=${encodeURIComponent(module)}` : "/hunter-advisory/admin");
}
