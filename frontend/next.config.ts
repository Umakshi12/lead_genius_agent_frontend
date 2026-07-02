import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone build for easier deployment
  output: 'standalone',

  // Allow external images if needed
  images: {
    unoptimized: true,
  },



  // Experimental features for better performance
  experimental: {
    // Enable if you want server actions
  },
};

export default nextConfig;

