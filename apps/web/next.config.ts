import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@diario/db"],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
