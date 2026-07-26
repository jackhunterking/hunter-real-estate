/**
 * Where to send someone who wants the investor portal.
 *
 * Equity Market is a separate business on its own domain, in its own repo
 * (github.com/jackhunterking/equity-market). It used to be a subtree of this
 * app; now it is a link out, so this is an absolute URL rather than a path.
 *
 * The fallback is the domain the portal serves on today. It becomes
 * https://equitymarket.io when that domain is live — set
 * NEXT_PUBLIC_PORTAL_URL rather than editing this, so both apps flip together.
 */
export const PORTAL_URL = (
  process.env.NEXT_PUBLIC_PORTAL_URL ??
  process.env.NEXT_PUBLIC_HNC_SITE_URL ??
  "https://www.hunterhunteradvisors.com"
).replace(/\/$/, "");
