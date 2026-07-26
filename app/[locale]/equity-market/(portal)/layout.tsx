import { PortalShell } from "@/components/equity-market/portal/PortalShell";
import { ClientProvider } from "@/components/equity-market/portal/ClientProvider";
import { PortalAccessProvider } from "@/components/equity-market/portal/PortalAccessProvider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadPortalSnapshot } from "@/lib/equity-market/portal-server";
import { PROFESSIONAL_WORKSPACE_ENABLED } from "@/lib/equity-market/feature-flags";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata = {
  robots: { index: false, follow: false },
};

// Routes that make up the professional / partner "middle layer" paused this phase.
// Matched on the path segment right after the portal base path so investor
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
  const suffix = path.startsWith(INVESTMENT_BASE_PATH)
    ? path.slice(INVESTMENT_BASE_PATH.length)
    : path;
  const segment = suffix.replace(/^\/+/, "").split("/")[0];
  return PAUSED_MIDDLE_LAYER_SEGMENTS.has(segment);
}

export default async function EquityMarketPortalLayout({ children }: { children: React.ReactNode }) {
  // Temporary: bounce any direct hit on a paused middle-layer route to the
  // investor home. Runs independent of the auth branch so it also applies in
  // dev preview mode. Removing the flag restores every route.
  if (!PROFESSIONAL_WORKSPACE_ENABLED) {
    const requestedPath = (await headers()).get("x-portal-path") ?? "";
    if (isPausedMiddleLayerPath(requestedPath)) {
      redirect(`${INVESTMENT_BASE_PATH}/portfolio`);
    }
  }

  const configured = isSupabaseConfigured();
  const snapshot = configured ? await loadPortalSnapshot() : null;
  const requireAuth =
    process.env.NODE_ENV === "production" ||
    // HNC_REQUIRE_AUTH is the previous name; read both until the Vercel
    // environment is cut over, then drop the fallback.
    (process.env.PORTAL_REQUIRE_AUTH ?? process.env.HNC_REQUIRE_AUTH) === "true";
  if (requireAuth && (!configured || !snapshot)) {
    const requestedPath = (await headers()).get("x-portal-path");
    const next = requestedPath?.startsWith(`${INVESTMENT_BASE_PATH}/`) ? `?next=${encodeURIComponent(requestedPath)}` : "";
    redirect(`${INVESTMENT_BASE_PATH}/sign-in${next}`);
  }
  if (snapshot?.user.onboardingStatus === "pending") {
    redirect(`${INVESTMENT_BASE_PATH}/onboarding`);
  }

  return (
    <PortalAccessProvider
      initialDataset={snapshot?.dataset}
      initialUser={snapshot?.user}
      previewEnabled={!requireAuth && !snapshot}
      backendConfigured={Boolean(snapshot)}
    >
      <ClientProvider>
        <PortalShell>{children}</PortalShell>
      </ClientProvider>
    </PortalAccessProvider>
  );
}
