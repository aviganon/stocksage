import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['firebase-admin', '@anthropic-ai/sdk', 'yahoo-finance2', 'rss-parser'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    staleTimes: {
      dynamic: 0, // Never cache dynamic pages — dashboard always re-fetches on navigation
    },
  },
};

export default nextConfig;
