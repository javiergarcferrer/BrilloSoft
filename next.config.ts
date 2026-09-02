import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Cache Components (PPR + "use cache"): the page is served as a static
  // shell; the only non-deterministic value (footer year) is cached with an
  // explicit lifetime instead of being frozen at build time.
  cacheComponents: true,
  poweredByHeader: false,
  experimental: {
    // Tailwind output is ~7 KB gzipped: inlining it removes a render-blocking
    // round trip for first-time visitors, which is most of a marketing site's
    // traffic.
    inlineCss: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
