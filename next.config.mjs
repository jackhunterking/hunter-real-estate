import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
import createNextIntlPlugin from 'next-intl/plugin';

// Points next-intl at the server request config (locale + messages).
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// The funds portal (github.com/jackhunterking/equity-market) is its own app on
// its own domain. Resolved once here and handed to the app through `env`, so
// lib/portal-link.ts and the host redirect below can never disagree.
const PORTAL_URL = (
  process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://www.equitymarket.io'
).replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const createNextConfig = (phase) => ({
  // Prevent a production build from replacing manifests used by `next dev`.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  env: {
    NEXT_PUBLIC_PORTAL_URL: PORTAL_URL,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['resend'],
  },
  // hunterhunteradvisors.com is still attached to this Vercel project but the
  // portal it served has left this app. Config redirects run before middleware
  // and before API routes and static files, so every path on that host —
  // including /api and /robots.txt — leaves for the portal's domain.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(?:www\\.)?hunterhunteradvisors\\.com' }],
        destination: `${PORTAL_URL}/:path*`,
        permanent: true,
      },
    ];
  },
  // NOTE: locale-prefixed routing means the legacy portal paths on this site's
  // own hosts are intercepted by middleware.ts so it can preserve the
  // active/negotiated locale in the destination. See the legacy-redirect block
  // in middleware.ts.
  // Reverse proxy for PostHog so analytics + session replay survive ad-blockers.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
  // Required to support PostHog trailing-slash API requests through the proxy.
  skipTrailingSlashRedirect: true,
});

// Config is a function of `phase`, so apply the next-intl plugin to the
// *returned* config object for each phase rather than to the factory itself.
const config = (phase) => withNextIntl(createNextConfig(phase));

export default config;
