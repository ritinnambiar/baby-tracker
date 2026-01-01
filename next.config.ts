import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only check types, don't fail build on warnings
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
