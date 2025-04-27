import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.API_URL,
    DEV: process.env.DEV,
  },
};

export default nextConfig;
