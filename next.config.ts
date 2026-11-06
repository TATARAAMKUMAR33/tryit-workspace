import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <--- Add this line
  devIndicators: false,
};

export default nextConfig;