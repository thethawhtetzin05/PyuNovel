import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Development mode ဖြစ်ရင် Cloudflare Environment ကို Setup လုပ်ပေးပါ
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform({
    configPath: './wrangler.toml',
  }).catch((e) => console.error(e));
}

export default nextConfig;