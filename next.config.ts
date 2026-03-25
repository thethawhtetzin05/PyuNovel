import type { NextConfig } from "next";
// @ts-ignore
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin('./i18n.ts');

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
  }).catch((e: unknown) => console.error(e));
}

const sentryConfig = {
  org: "pyunovel",
  project: "pyunovel-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Disable auto-instrumentation that causes duplicated identifiers with next-on-pages
  autoInstrumentMiddleware: false,
  autoInstrumentServerFunctions: false,
  autoInstrumentAppDirectory: false,

  // New Sentry webpack options for Next.js 15+
  webpack: {
    reactComponentAnnotation: {
      enabled: true,
    },
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  }
};

// Cloudflare Pages sets CF_PAGES=1 automatically during builds.
// Sentry's webpack plugin creates duplicate identifiers that crash next-on-pages,
// so we skip it entirely when building for Cloudflare.
const baseConfig = withNextIntl(nextConfig);
export default process.env.CF_PAGES
  ? baseConfig
  : withSentryConfig(baseConfig, sentryConfig);