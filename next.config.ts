import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_PAGES === "true" ? "/Project-Spy" : undefined,
  allowedDevOrigins: ["127.0.0.1", "192.168.200.114"],
  reactStrictMode: true,
  typedRoutes: true,
};

export default nextConfig;
