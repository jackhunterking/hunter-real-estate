import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/capital/north/OnboardingFlow";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Search = Promise<{ path?: string; offering?: string; next?: string }>;

export default async function OnboardingPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`${NORTH_BASE}/sign-in`);
  const claims = await supabase.auth.getClaims();
  const userId = claims.data?.claims?.sub;
  if (!userId) redirect(`${NORTH_BASE}/sign-in`);

  const profile = await supabase
    .from("profiles")
    .select("onboarding_status,account_intent")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile.data?.onboarding_status === "completed") {
    redirect(
      search.next?.startsWith(`${NORTH_BASE}/`)
        ? search.next
        : search.offering
        ? `${NORTH_BASE}/funds/${encodeURIComponent(search.offering)}`
        : search.path === "professional"
          ? `${NORTH_BASE}/partner/apply`
        : `${NORTH_BASE}/portfolio`,
    );
  }

  const initialIntent =
    search.path === "professional" ||
    profile.data?.account_intent === "turkiye_licensed_professional_or_firm"
      ? "turkiye_licensed_professional_or_firm"
      : search.path === "investor" || profile.data?.account_intent === "investor"
        ? "investor"
        : undefined;

  return <OnboardingFlow initialIntent={initialIntent} offeringSlug={search.offering} returnPath={search.next} />;
}
