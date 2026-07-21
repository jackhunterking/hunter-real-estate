"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { HUNTER_ADVISORY_HOSTS } from "@/lib/capital/advisory-domain";

function isHunterAdvisoryRoute(pathname: string, hostname: string) {
  return (
    HUNTER_ADVISORY_HOSTS.has(hostname.toLowerCase()) ||
    pathname === "/hunter-advisory" ||
    pathname.startsWith("/hunter-advisory/")
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // PostHog project keys are public (they ship to the browser), so the key
    // is hardcoded as a fallback. Override via env if needed.
    const key =
      process.env.NEXT_PUBLIC_POSTHOG_KEY ??
      "phc_na55KbvucPk2mkBLzJhZLepgSNqF7bwTGTXXEhDTE972";

    const sensitivePortal = isHunterAdvisoryRoute(
      window.location.pathname,
      window.location.hostname,
    );
    posthog.init(key, {
      // Routed through the Next.js rewrite proxy (see next.config.mjs) so
      // ad-blockers don't drop analytics + session replay traffic.
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
      defaults: "2025-05-24",
      // Pageviews are captured manually below to support App Router navigation.
      capture_pageview: false,
      capture_pageleave: false,
      // --- Session replay ---
      disable_session_recording: sensitivePortal,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-ph-mask]",
      },
      // --- Autocapture (clicks, form submits, etc.) ---
      autocapture: !sensitivePortal,
      persistence: "localStorage+cookie",
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    const sensitivePortal = isHunterAdvisoryRoute(pathname, window.location.hostname);
    ph.set_config({
      autocapture: !sensitivePortal,
      disable_session_recording: sensitivePortal,
    });
    if (sensitivePortal) ph.stopSessionRecording();
    else ph.startSessionRecording();

    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs && !sensitivePortal) url += "?" + qs;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}
