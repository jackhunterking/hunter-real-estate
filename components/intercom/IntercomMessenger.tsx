"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Intercom, { boot, shutdown, update } from "@intercom/messenger-js-sdk";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  INTERCOM_APP_ID,
  INTERCOM_ENABLED,
  INTERCOM_REGION,
  intercomBootSettings,
  type IntercomIdentityResponse,
} from "@/lib/intercom/config";

/**
 * One Intercom Messenger for the whole app — marketing site and advisory portal.
 *
 * Both of Intercom's install modes run together rather than one being chosen:
 * every visitor gets an anonymous messenger (so someone reading
 * the portal before signing up can still start a conversation), and once
 * a Supabase session exists the messenger re-boots authenticated, carrying the
 * signed JWT from /api/intercom/identity.
 *
 * Identity is applied by shutdown + boot rather than `update`, because the JWT
 * authenticates a boot: it is what flips the workspace's "Secure for web" check
 * and what guarantees the messenger's user matches the session exactly. The
 * trade-off is that a conversation started before sign-in stays on the
 * anonymous lead instead of merging into the account.
 */
export function IntercomMessenger({ locale }: { locale: string }) {
  const pathname = usePathname();
  // The user_id currently booted into the messenger. Doubles as the "were we
  // ever signed in?" flag that decides whether a sign-out needs a teardown.
  const identifiedUserId = useRef<string | null>(null);

  // --- Anonymous boot, once per page load ---
  // `locale` is intentionally not a dependency: re-running the initialiser
  // replaces window.intercomSettings wholesale. Language is pushed through
  // `update` instead.
  useEffect(() => {
    if (!INTERCOM_ENABLED) return;
    Intercom({
      ...intercomBootSettings(),
      app_id: INTERCOM_APP_ID,
      region: INTERCOM_REGION,
    });
  }, []);

  // --- Identity, tracked across sign-in and sign-out ---
  useEffect(() => {
    if (!INTERCOM_ENABLED) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    async function syncIdentity(hasSession: boolean) {
      if (!hasSession) {
        // Nothing to tear down for a visitor who was never signed in — leave
        // the anonymous session and its conversation history alone.
        if (!identifiedUserId.current) return;
        identifiedUserId.current = null;
        // shutdown() clears Intercom's session cookie so the next person on a
        // shared device cannot reopen the previous user's conversation; boot()
        // then restores an anonymous messenger.
        shutdown();
        boot(intercomBootSettings());
        return;
      }

      const response = await fetch("/api/intercom/identity", {
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => null);
      if (cancelled || !response?.ok) return;

      const body = (await response.json().catch(() => null)) as
        | IntercomIdentityResponse
        | null;
      // Not authenticated here also covers "the Messenger secret is not
      // configured yet" — the server refuses to identify anyone unsigned, so
      // the messenger stays anonymous rather than impersonatable.
      if (cancelled || !body?.authenticated) return;

      // Re-booting on every auth event (Supabase fires TOKEN_REFRESHED roughly
      // hourly) would drop the open messenger for no reason.
      if (identifiedUserId.current === body.userId) return;
      identifiedUserId.current = body.userId;

      // The token is short-lived by design: it authenticates this boot, after
      // which Intercom's own session cookie carries the user. No refresh loop
      // is needed — a reload mints a fresh one.
      shutdown();
      boot(intercomBootSettings({ intercom_user_jwt: body.intercom_user_jwt }));
    }

    // Local cookie/storage read — no network call for anonymous visitors.
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) void syncIdentity(Boolean(data.session));
      })
      .catch(() => {});

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) void syncIdentity(Boolean(session));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // --- Route changes ---
  // App Router navigations are client-side, so Intercom never sees them without
  // a ping. `update` refreshes the recorded page and lets queued messages open.
  // No JWT here: the boot above already authenticated the session cookie.
  useEffect(() => {
    if (!INTERCOM_ENABLED || !pathname) return;
    update({ language_override: locale });
  }, [pathname, locale]);

  return null;
}
