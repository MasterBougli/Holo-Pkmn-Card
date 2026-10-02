import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep builds within the shared VPS resource budget.
  experimental: { cpus: 1, webpackMemoryOptimizations: true, webpackBuildWorker: true },
  webpack(config) { config.cache = false; return config; },
  outputFileTracingExcludes: { "/*": ["./Web/**/*"] },
};

export default nextConfig;
