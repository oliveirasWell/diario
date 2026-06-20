import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@diario/db"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
