import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Payment proofs are photos/screenshots; the 1 MB default is too small.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
