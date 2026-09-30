import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for a small Docker image.
  output: "standalone",
};

export default nextConfig;
