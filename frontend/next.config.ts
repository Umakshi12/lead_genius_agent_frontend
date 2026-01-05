import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone build for easier deployment
  output: 'standalone',

  // Allow external images if needed
  images: {
    unoptimized: true,
  },

  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Experimental features for better performance
  experimental: {
    // Enable if you want server actions
  },
};

export default nextConfig;

