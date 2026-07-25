import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/capital/north/OnboardingFlow";
import { INVESTMENT_BASE_PATH as NORTH_BASE } from "@/lib/capital/investment-brand";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Search = Promise<{ path?: string; offering?: string; next?: string }>;

export default async function OnboardingPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`${NORTH_BASE}/sign-in`);
  const claims = await supabase.auth.getClaims();
  const userId = claims.data?.claims?.sub;
  if (!userId) redirect(`${NORTH_BASE}/sign-in`);

  // Licensed-partner access is requested separately inside the portal, not
  // through this investor onboarding flow.
  if (search.path === "professional") {
    redirect(`${NORTH_BASE}/partner/apply`);
  }

  const profile = await supabase
    .from("profiles")
    .select("onboarding_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile.data?.onboarding_status === "completed") {
    redirect(
      search.next?.startsWith(`${NORTH_BASE}/`)
        ? search.next
        : search.offering
        ? `${NORTH_BASE}/investments/${encodeURIComponent(search.offering)}`
        : `${NORTH_BASE}/portfolio`,
    );
  }

  return <OnboardingFlow offeringSlug={search.offering} returnPath={search.next} />;
}
