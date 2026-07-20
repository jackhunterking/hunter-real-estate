/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // Legacy Capital routes now resolve to the Hunter Advisory experience.
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
};

export default nextConfig;
