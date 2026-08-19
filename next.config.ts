import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  pageExtensions: ["spa.tsx"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
