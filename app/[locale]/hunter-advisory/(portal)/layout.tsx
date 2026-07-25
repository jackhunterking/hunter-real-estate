import { NorthShell } from "@/components/capital/north/NorthShell";
import { ClientProvider } from "@/components/capital/north/ClientProvider";
import { PortalAccessProvider } from "@/components/capital/north/PortalAccessProvider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadPortalSnapshot } from "@/lib/capital/portal-server";
import { PROFESSIONAL_WORKSPACE_ENABLED } from "@/lib/capital/feature-flags";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata = {
  robots: { index: false, follow: false },
};

// Routes that make up the professional / partner "middle layer" paused this phase.
// Matched on the path segment right after the /hunter-advisory prefix so investor
// paths (portfolio, investments, requests, resources, profile, home) and staff
// admin/operations are untouched.
const PAUSED_MIDDLE_LAYER_SEGMENTS = new Set([
  "professional",
  "clients",
  "commissions",
  "partner",
  "partner-program",
  "firm",
  "referrals",
]);

function isPausedMiddleLayerPath(pathnameWithPrefix: string) {
  const path = pathnameWithPrefix.split("?")[0];
  const suffix = path.startsWith("/hunter-advisory")
    ? path.slice("/hunter-advisory".length)
    : path;
  const segment = suffix.replace(/^\/+/, "").split("/")[0];
  return PAUSED_MIDDLE_LAYER_SEGMENTS.has(segment);
}

export default async function HunterNorthPortalLayout({ children }: { children: React.ReactNode }) {
  // Temporary: bounce any direct hit on a paused middle-layer route to the
  // investor home. Runs independent of the auth branch so it also applies in
  // dev preview mode. Removing the flag restores every route.
  if (!PROFESSIONAL_WORKSPACE_ENABLED) {
    const requestedPath = (await headers()).get("x-hnc-path") ?? "";
    if (isPausedMiddleLayerPath(requestedPath)) {
      redirect("/hunter-advisory/portfolio");
    }
  }

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
