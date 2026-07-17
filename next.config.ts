import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack rooted inside this project so Vercel and local builds
    // don't wander into the parent folder's lockfile.
    root: __dirname,
  },
};

export default nextConfig;
