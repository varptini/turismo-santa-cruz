import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.15",
    "192.168.0.15:3001",
    "192.168.0.15:3000",
    "192.168.0.*",
    "192.168.*",
    "localhost",
    "localhost:3000",
    "localhost:3001",
    "127.0.0.1",
  ],
};

export default nextConfig;

