import { NorthShell } from "@/components/capital/north/NorthShell";
import { ClientProvider } from "@/components/capital/north/ClientProvider";
import { PortalAccessProvider } from "@/components/capital/north/PortalAccessProvider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadPortalSnapshot } from "@/lib/capital/portal-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function HunterNorthPortalLayout({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const snapshot = configured ? await loadPortalSnapshot() : null;
  const requireAuth =
    process.env.NODE_ENV === "production" ||
    process.env.HNC_REQUIRE_AUTH === "true";
  if (requireAuth && (!configured || !snapshot)) {
    const requestedPath = (await headers()).get("x-hnc-path");
    const next = requestedPath?.startsWith("/hunter-advisory/") ? `?next=${encodeURIComponent(requestedPath)}` : "";
    redirect(`/hunter-advisory/sign-in${next}`);
  }
  if (snapshot?.user.onboardingStatus === "pending") {
    redirect("/hunter-advisory/onboarding");
  }

  return (
    <PortalAccessProvider
      initialDataset={snapshot?.dataset}
      initialUser={snapshot?.user}
      previewEnabled={!requireAuth && !snapshot}
      backendConfigured={Boolean(snapshot)}
    >
      <ClientProvider>
        <NorthShell>{children}</NorthShell>
      </ClientProvider>
    </PortalAccessProvider>
  );
}
