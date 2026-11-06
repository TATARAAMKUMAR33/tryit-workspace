import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <--- Add this
  devIndicators: false,
};

export default nextConfig;