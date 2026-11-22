import type { NextConfig } from "next";
import path from "node:path";

// Script/style CSP is left out on purpose: it needs nonces for Next inline scripts and
// allowances for Sentry and Google avatars. These directives are safe without that.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  transpilePackages: ["@diario/db"],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
};

export default nextConfig;
