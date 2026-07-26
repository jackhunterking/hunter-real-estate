import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/equity-market/portal/OnboardingFlow";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Search = Promise<{ path?: string; offering?: string; next?: string }>;

export default async function OnboardingPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`${INVESTMENT_BASE_PATH}/sign-in`);
  const claims = await supabase.auth.getClaims();
  const userId = claims.data?.claims?.sub;
  if (!userId) redirect(`${INVESTMENT_BASE_PATH}/sign-in`);

  // Licensed-partner access is requested separately inside the portal, not
  // through this investor onboarding flow.
  if (search.path === "professional") {
    redirect(`${INVESTMENT_BASE_PATH}/partner/apply`);
  }

  const profile = await supabase
    .from("profiles")
    .select("onboarding_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile.data?.onboarding_status === "completed") {
    redirect(
      search.next?.startsWith(`${INVESTMENT_BASE_PATH}/`)
        ? search.next
        : search.offering
        ? `${INVESTMENT_BASE_PATH}/investments/${encodeURIComponent(search.offering)}`
        : `${INVESTMENT_BASE_PATH}/portfolio`,
    );
  }

  return <OnboardingFlow offeringSlug={search.offering} returnPath={search.next} />;
}
