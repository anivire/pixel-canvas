import type { NextConfig } from 'next';
import UnoCSS from '@unocss/webpack';
import presetIcons from '@unocss/preset-icons';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.cache = false;
    config.plugins.push(UnoCSS({ presets: [presetIcons()] }));
    return config;
  },
  env: {
    API_URL: process.env.API_URL,
    DEV: process.env.DEV,
  },
};

export default nextConfig;
