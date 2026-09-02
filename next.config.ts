import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["bcryptjs"],
  allowedDevOrigins: ["192.168.113.5", "192.168.113.4"],
};

export default nextConfig;
