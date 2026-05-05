import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    mdxRs: false,
  },
  env: {
    // Set NEXT_PUBLIC_APP_VERSION in Vercel dashboard env vars to override
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.3.0',
  },
};

export default nextConfig;
