import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
import createNextIntlPlugin from 'next-intl/plugin';

// Points next-intl at the server request config (locale + messages).
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const createNextConfig = (phase) => ({
  // Prevent a production build from replacing manifests used by `next dev`.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['resend'],
  },
  // NOTE: locale-prefixed routing means these legacy paths are intercepted by
  // middleware.ts (which runs before config redirects) so it can preserve the
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
