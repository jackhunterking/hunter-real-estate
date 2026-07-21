import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

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
  async redirects() {
    return [
      {
        source: '/rehber',
        destination: '/#kaynaklar',
        permanent: true,
      },
      // Legacy Capital routes now resolve to the Hunter & Hunter Investment Advisors experience.
      { source: '/hunter-group-capital/:path*', destination: '/hunter-advisory', permanent: true },
      { source: '/hunter-x-capital/:path*', destination: '/hunter-advisory', permanent: true },
    ];
  },
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

export default createNextConfig;
