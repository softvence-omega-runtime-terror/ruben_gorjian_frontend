import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure Turbopack treats this folder as the workspace root
    root: __dirname,
  },
  experimental: {
    workerThreads: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "talexia.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
